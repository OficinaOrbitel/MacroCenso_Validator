import type { CensusRecord, ValidationResult, ValidationError } from './types';

const BIS_VALID = new Set(['B', 'C', 'D', 'K', 'Q', 'T', 'X', 'Y', '-']);
const BLOQUE_FIRST_VALID = new Set(['A', 'B', 'C', 'E', 'F', 'G', 'H', 'L', 'N', 'P', 'R', 'S', 'T', 'Z', '-']);
const TIPOS_PERMISO_VALIDOS = new Set([
    'ABANDONADO',
    'ALTAS POR AEREO',
    'AZOTEA',
    'CHALET ICT',
    'EMPRESA',
    'EN CONSTRUCCION',
    'FACHADA',
    'FUERA DE HUELLA',
    'INDUSTRIAL',
    'INEXISTENTE',
    'INTERIOR',
    'MIXTO',
    'MULTIEMPRESA',
    'PATIO',
    'PEDESTAL',
    'POSTE',
    'RUINAS',
    'SINGULAR',
    'SOLAR',
]);
const TIPOS_SIN_HOGARES = new Set(['ABANDONADO', 'INEXISTENTE', 'RUINAS', 'SINGULAR', 'FUERA DE HUELLA', 'SOLAR']);
const TIPOS_REQUIEREN_OBS = new Set(['ABANDONADO', 'SINGULAR', 'INDUSTRIAL', 'EMPRESA', 'MIXTO']);
const OPERADORES_VALIDOS = ['MV', 'JZ', 'OR', 'VF', 'ON', 'MM', 'OTROS'];

function buildGescal26(row: CensusRecord): string {
    const g17 = String(row.GESCAL17 ?? '').trim();
    const bis = String(row['BIS-DUPLICADO'] ?? '');
    const bloque = String(row.BLOQUE ?? '');
    const portal = String(row['PORTAL-PUERTA'] ?? '');
    const letra = String(row['LETRA-FINCA'] ?? '');
    const esc = String(row.ESCALERA ?? '');
    return g17 + bis + bloque + portal + letra + esc;
}

function addError(errors: ValidationError[], rule: string, message: string): void {
    errors.push({ rule, message });
}

export function validateRow(row: CensusRecord, rowIndex: number): ValidationResult {
    const errors: ValidationError[] = [];
    const gescal26 = row.GESCAL26 || buildGescal26(row);

    // 1. GESCAL26 length must be 26
    if (gescal26.length !== 26) {
        addError(errors, 'GESCAL26-LENGTH', `Largo de GESCAL26 incorrecto: ${gescal26.length} (debe ser 26)`);
    }

    // 2. NUM must be numeric
    const numStr = String(row.NUM).trim();
    if (!/^\d+$/.test(numStr)) {
        addError(errors, 'NUM-NOT-NUMERIC', 'Campo NUM no es numérico');
    }

    // 3. GESCAL26[12:17] must match NUM
    if (gescal26.length >= 17 && /^\d+$/.test(numStr)) {
        const gescalNumPart = gescal26.substring(12, 17);
        if (gescalNumPart !== numStr.padStart(5, '0')) {
            addError(errors, 'GESCAL26-NUM-MISMATCH', `Número de edificio no coincide: GESCAL26 dice "${gescalNumPart}", NUM dice "${numStr}"`);
        }
    }

    // 4. BIS-DUPLICADO must be valid
    const bis = String(row['BIS-DUPLICADO'] ?? '');
    if (!BIS_VALID.has(bis)) {
        addError(errors, 'BIS-INVALID', `BIS-DUPLICADO "${bis}" incorrecto. Valores: ${[...BIS_VALID].join(', ')}`);
    }

    // 5. BLOQUE validation
    const bloque = String(row.BLOQUE ?? '');
    if (bloque !== '---') {
        if (bloque.length !== 3) {
            addError(errors, 'BLOQUE-LENGTH', `BLOQUE largo incorrecto: "${bloque}" (debe ser 3 chars o "---")`);
        } else if (!BLOQUE_FIRST_VALID.has(bloque[0])) {
            addError(errors, 'BLOQUE-FIRST-CHAR', `BLOQUE código inicial incorrecto: "${bloque[0]}"`);
        }
    }

    // 6. BLOQUE contains "-" incorrectly
    if (bloque !== '---' && bloque.includes('-')) {
        addError(errors, 'BLOQUE-DASH', 'BLOQUE contiene "-" de forma incorrecta');
    }

    // 7. PORTAL-PUERTA validation
    const portal = String(row['PORTAL-PUERTA'] ?? '');
    const totales = Number(row.TOTALES) || 0;
    if (portal !== '--') {
        if (portal.length > 0) {
            const firstChar = portal[0];
            if (!/^\d/.test(firstChar) && firstChar !== 'O' && firstChar !== 'U') {
                addError(errors, 'PORTAL-PREFIX', 'PORTAL-PUERTA: Falta prefijo O o U');
            }
            if (firstChar === 'O' && totales < 2) {
                addError(errors, 'PORTAL-O-CONSISTENCY', 'PORTAL-PUERTA: prefijo O requiere más de 1 hogar');
            }
            if (firstChar === 'U' && totales > 1) {
                addError(errors, 'PORTAL-U-CONSISTENCY', 'PORTAL-PUERTA: prefijo U solo puede tener 1 hogar');
            }
        }
    }

    // 8. TIPO-DE-PERMISO must be valid
    const tipoPermiso = String(row['TIPO-DE-PERMISO'] ?? '').trim();
    if (!TIPOS_PERMISO_VALIDOS.has(tipoPermiso)) {
        addError(errors, 'TIPO-PERMISO-INVALID', `TIPO-DE-PERMISO "${tipoPermiso}" incorrecto`);
    }

    // 9. Compatibility TIPO-DE-PERMISO vs TOTALES
    if (tipoPermiso) {
        const isSinHogares = TIPOS_SIN_HOGARES.has(tipoPermiso);
        if (isSinHogares && totales !== 0) {
            addError(errors, 'PERMISO-TOTALES-MISMATCH', `TIPO-DE-PERMISO "${tipoPermiso}" es incompatible con TOTALES=${totales} (debe ser 0)`);
        }
        if (!isSinHogares && totales === 0) {
            addError(errors, 'PERMISO-TOTALES-ZERO', `TIPO-DE-PERMISO "${tipoPermiso}" no puede tener TOTALES=0`);
        }
    }

    // 10. Observaciones required for certain types
    const obs = String(row['OBSERVACIONES'] ?? '').trim().toUpperCase();
    if (TIPOS_REQUIEREN_OBS.has(tipoPermiso) && (obs === 'NAN' || obs === '')) {
        addError(errors, 'OBSERVACIONES-REQUIRED', `Faltan OBSERVACIONES para tipo "${tipoPermiso}"`);
    }

    // 11. EN CONSTRUCCION requires "ENTREGA DE LLAVES" in observaciones
    if (tipoPermiso === 'EN CONSTRUCCION' && !obs.includes('ENTREGA DE LLAVES')) {
        addError(errors, 'OBS-ENTREGA-LLAVES', 'Falta "ENTREGA DE LLAVES" en OBSERVACIONES');
    }

    // 12. INTERIOR requires TIPO-INSTALACION-INTERIOR
    const tipoInst = String(row['TIPO-INSTALACION-INTERIOR'] ?? '').trim().toUpperCase();
    if (tipoPermiso === 'INTERIOR' && tipoInst !== 'ICT' && tipoInst !== 'NO ICT') {
        addError(errors, 'INSTALACION-INTERIOR', 'TIPO-INSTALACION-INTERIOR debe ser ICT o NO ICT');
    }
    if (tipoPermiso !== 'INTERIOR' && tipoInst !== '' && tipoInst !== 'NAN') {
        addError(errors, 'INSTALACION-INTERIOR-NO-PERMITIDO', 'TIPO-INSTALACION-INTERIOR solo aplica para INTERIOR');
    }

    // 13. FECHA-DE-CENSO not empty
    const fecha = row['FECHA-DE-CENSO'];
    if (fecha === undefined || fecha === null || String(fecha).trim() === '' || String(fecha).trim().toUpperCase() === 'NAN') {
        addError(errors, 'FECHA-CENSO-EMPTY', 'FECHA-DE-CENSO vacío o formato fecha erróneo');
    }

    // 14. DUMMY validation
    const dummyNum = Number(row.DUMMY);
    if (isNaN(dummyNum) || dummyNum < 0 || dummyNum > 1) {
        addError(errors, 'DUMMY-INVALID', 'DUMMY debe ser 0 o 1');
    } else if (dummyNum === 1 && !obs.includes('DUMMY')) {
        addError(errors, 'DUMMY-OBS-MISSING', 'DUMMY=1 requiere "DUMMY" en OBSERVACIONES');
    }

    // 15. OPERADORES-PREVIOS must contain at least one valid value
    const ops = String(row['OPERADORES-PREVIOS'] ?? '');
    const hasValidOp = OPERADORES_VALIDOS.some(op => ops.includes(op));
    if (!hasValidOp) {
        addError(errors, 'OPERADORES-PREVIOS', `OPERADORES-PREVIOS debe contener al menos uno de: ${OPERADORES_VALIDOS.join(', ')}`);
    }

    return {
        rowIndex,
        row,
        errors,
        hasError: errors.length > 0,
    };
}

export function validateRows(rows: CensusRecord[]): ValidationResult[] {
    return rows.map((row, i) => validateRow(row, i));
}

export function checkGescal12Duplicates(rows: CensusRecord[]): ValidationResult[] {
    const extraErrors: ValidationResult[] = [];
    const groups = new Map<string, { vias: Set<string>; indices: number[] }>();

    for (let i = 0; i < rows.length; i++) {
        const gescal26 = rows[i].GESCAL26;
        if (!gescal26 || gescal26.length < 12) continue;
        const gescal12 = gescal26.substring(0, 12);
        const viaName = `${String(rows[i]['TIPO-VIA'] ?? '')} ${String(rows[i]['NOMBRE-VIA'] ?? '')}`.trim();

        let entry = groups.get(gescal12);
        if (!entry) {
            entry = { vias: new Set(), indices: [] };
            groups.set(gescal12, entry);
        }
        entry.vias.add(viaName);
        entry.indices.push(i);
    }

    for (const [gescal12, { vias, indices }] of groups) {
        if (vias.size >= 2) {
            const msg = `Mismo GESCAL12 (${gescal12}) con diferentes vías: ${[...vias].join(' | ')}`;
            for (const i of indices) {
                extraErrors.push({
                    rowIndex: i,
                    row: rows[i],
                    errors: [{ rule: 'GESCAL12-DUPLICATE-VIA', message: msg }],
                    hasError: true,
                });
            }
        }
    }

    return extraErrors;
}

export function checkSumHogares(row: CensusRecord): ValidationError | null {
    const totales = Number(row.TOTALES) || 0;
    const hogares = Number(row['NUM-DE-HOGARES']) || 0;
    const locales = Number(row['NUM-DE-LOCALES']) || 0;
    if (totales !== hogares + locales) {
        return {
            rule: 'SUMA-HOGARES',
            message: `TOTALES (${totales}) ≠ NUM-DE-HOGARES (${hogares}) + NUM-DE-LOCALES (${locales}) = ${hogares + locales}`,
        };
    }
    return null;
}

export function mergeAllValidationResults(rows: CensusRecord[]): ValidationResult[] {
    const baseResults = validateRows(rows);

    for (let i = 0; i < rows.length; i++) {
        const sumError = checkSumHogares(rows[i]);
        if (sumError) {
            baseResults[i].errors.push(sumError);
            baseResults[i].hasError = true;
        }
    }

    const dupResults = checkGescal12Duplicates(rows);
    for (const dup of dupResults) {
        const existing = baseResults[dup.rowIndex];
        for (const err of dup.errors) {
            existing.errors.push(err);
            existing.hasError = true;
        }
    }

    return baseResults;
}
