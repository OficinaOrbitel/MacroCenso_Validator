import * as XLSX from 'xlsx';
import type { ValidationResult } from './types';

export function exportReport(results: ValidationResult[], originalFileName: string, skipped: number): void {
    const wb = XLSX.utils.book_new();

    const summaryData = [
        ['MacroCenso Validator - Informe de validación'],
        [],
        ['Archivo:', originalFileName],
        ['Filas procesadas:', results.length],
        ['Sin errores:', results.filter(r => !r.hasError).length],
        ['Con errores:', results.filter(r => r.hasError).length],
        ['Saltadas (sin CENSUS-ZONE-MAP):', skipped],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

    const headers = ['Fila Excel', 'GESCAL26', 'Dirección', 'Tipo Permiso', 'Totales', 'Errores'];
    const detailData = results.map(r => [
        r.rowIndex + 2,
        r.row.GESCAL26 || '-',
        `${r.row['TIPO-VIA']} ${r.row['NOMBRE-VIA']}, Nº ${r.row.NUM}`,
        r.row['TIPO-DE-PERMISO'] || '-',
        r.row.TOTALES,
        r.errors.map(e => `[${e.rule}] ${e.message}`).join('; '),
    ]);
    const wsDetail = XLSX.utils.aoa_to_sheet([headers, ...detailData]);
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle');

    const outName = originalFileName.replace(/\.(xlsx|xls|xlsm)$/i, '') + '_validado.xlsx';
    XLSX.writeFile(wb, outName);
}
