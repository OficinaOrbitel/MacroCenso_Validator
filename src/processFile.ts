import * as XLSX from 'xlsx';
import type { CensusRecord } from './types';

export interface FileReadResult {
    fileName: string;
    sheetName: string;
    rows: CensusRecord[];
    totalRows: number;
    skippedRows: number;
}

export async function readExcelFile(file: File): Promise<FileReadResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

                if (jsonData.length === 0) {
                    reject(new Error('El archivo Excel está vacío'));
                    return;
                }

                const rawRows: CensusRecord[] = jsonData.map((row, i) => {
                    const r: Record<string, unknown> = {};
                    for (const [key, value] of Object.entries(row)) {
                        const normalizedKey = key.trim().toUpperCase().replace(/\s+/g, ' ');
                        r[normalizedKey] = value;
                    }
                    return {
                        _excelRow: i + 2,
                        PROVINCIA: String(r['PROVINCIA'] ?? ''),
                        POBLACION: String(r['POBLACION'] ?? ''),
                        'CODIGO-POSTAL': r['CODIGO-POSTAL'] ?? '',
                        GESCAL26: String(r['GESCAL26'] ?? ''),
                        GESCAL17: String(r['GESCAL17'] ?? ''),
                        'TIPO-VIA': String(r['TIPO-VIA'] ?? ''),
                        'NOMBRE-VIA': String(r['NOMBRE-VIA'] ?? ''),
                        NUM: r['NUM'] ?? '',
                        TOTALES: Number(r['TOTALES']) || 0,
                        'NUM-DE-HOGARES': Number(r['NUM-DE-HOGARES']) || 0,
                        'NUM-DE-LOCALES': Number(r['NUM-DE-LOCALES']) || 0,
                        'TIPO-INSTALACION-INTERIOR': String(r['TIPO-INSTALACION-INTERIOR'] ?? ''),
                        'CENSUS-ZONE-MAP': String(r['CENSUS-ZONE-MAP'] ?? ''),
                        'AUTOR CENSO': String(r['AUTOR CENSO'] ?? ''),
                        'AUTOR VOLCADO': String(r['AUTOR VOLCADO'] ?? ''),
                        DUMMY: r['DUMMY'] ?? 0,
                        'BIS-DUPLICADO': String(r['BIS-DUPLICADO'] ?? ''),
                        BLOQUE: String(r['BLOQUE'] ?? ''),
                        'PORTAL-PUERTA': String(r['PORTAL-PUERTA'] ?? ''),
                        'LETRA-FINCA': String(r['LETRA-FINCA'] ?? ''),
                        ESCALERA: String(r['ESCALERA'] ?? ''),
                        'OPERADORES-PREVIOS': String(r['OPERADORES-PREVIOS'] ?? ''),
                        'FECHA-DE-CENSO': r['FECHA-DE-CENSO'] ?? '',
                        'TIPO-DE-PERMISO': String(r['TIPO-DE-PERMISO'] ?? ''),
                        'OBSERVACIONES': String(r['OBSERVACIONES'] ?? ''),
                    } as CensusRecord;
                });

                const rows = rawRows.filter(r => {
                    const zone = String(r['CENSUS-ZONE-MAP'] ?? '').trim();
                    return zone !== '' && zone !== 'NAN';
                });
                const skippedRows = rawRows.length - rows.length;

                resolve({
                    fileName: file.name,
                    sheetName,
                    rows,
                    totalRows: rows.length,
                    skippedRows,
                });
            } catch (err) {
                reject(new Error(`Error al leer el archivo: ${err instanceof Error ? err.message : 'Error desconocido'}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };

        reader.readAsArrayBuffer(file);
    });
}
