export interface CensusRecord {
    PROVINCIA: string;
    POBLACION: string;
    'CODIGO-POSTAL'?: string | number;
    GESCAL26: string;
    GESCAL17?: string;
    'TIPO-VIA': string;
    'NOMBRE-VIA': string;
    NUM: number | string;
    TOTALES: number;
    'NUM-DE-HOGARES': number;
    'NUM-DE-LOCALES': number;
    'TIPO-INSTALACION-INTERIOR': string;
    'CENSUS-ZONE-MAP'?: string;
    'AUTOR CENSO'?: string;
    'AUTOR VOLCADO'?: string;
    DUMMY: string | number;
    'BIS-DUPLICADO': string;
    BLOQUE: string;
    'PORTAL-PUERTA': string;
    'LETRA-FINCA': string;
    ESCALERA: string;
    'OPERADORES-PREVIOS'?: string;
    'FECHA-DE-CENSO'?: string | number | Date;
    'TIPO-DE-PERMISO'?: string;
    'OBSERVACIONES'?: string;
    _excelRow?: number;
}

export interface ValidationError {
    rule: string;
    message: string;
}

export interface ValidationResult {
    rowIndex: number;
    row: CensusRecord;
    errors: ValidationError[];
    hasError: boolean;
}

export type AppPhase = 'upload' | 'loading' | 'results';

export interface ValidatorSummary {
    total: number;
    ok: number;
    withErrors: number;
    skipped: number;
}
