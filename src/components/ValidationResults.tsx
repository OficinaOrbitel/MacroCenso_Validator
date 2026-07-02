import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Filter, ArrowUpDown, List } from 'lucide-react';
import type { ValidationResult } from '../types';
import { cn } from '../utils';
import ErrorBadge from './ErrorBadge';

interface ValidationResultsProps {
    results: ValidationResult[];
}

type SortField = 'rowIndex' | 'errors';
type FilterType = 'all' | 'withErrors' | 'ok';

export default function ValidationResults({ results }: ValidationResultsProps) {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [sortField, setSortField] = useState<SortField>('rowIndex');
    const [sortAsc, setSortAsc] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [errorFilter, setErrorFilter] = useState<string>('');

    const uniqueRules = useMemo(() => {
        const rules = new Set<string>();
        for (const r of results) {
            for (const err of r.errors) {
                rules.add(err.rule);
            }
        }
        return [...rules].sort();
    }, [results]);

    const toggleRow = (rowIndex: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(rowIndex)) {
                next.delete(rowIndex);
            } else {
                next.add(rowIndex);
            }
            return next;
        });
    };

    const filteredAndSorted = useMemo(() => {
        let filtered = results;
        if (filter === 'withErrors') filtered = results.filter(r => r.hasError);
        if (filter === 'ok') filtered = results.filter(r => !r.hasError);
        if (errorFilter) filtered = filtered.filter(r => r.errors.some(e => e.rule === errorFilter));

        return [...filtered].sort((a, b) => {
            if (sortField === 'rowIndex') {
                return sortAsc ? a.rowIndex - b.rowIndex : b.rowIndex - a.rowIndex;
            }
            const aCount = a.errors.length;
            const bCount = b.errors.length;
            return sortAsc ? aCount - bCount : bCount - aCount;
        });
    }, [results, sortField, sortAsc, filter, errorFilter]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(true);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/50">
                    <Filter size={14} className="text-slate-400" />
                    {(['all', 'withErrors', 'ok'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors',
                                filter === f
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'text-slate-500 hover:text-slate-300'
                            )}
                        >
                            {f === 'all' && 'Todas'}
                            {f === 'withErrors' && 'Con errores'}
                            {f === 'ok' && 'OK'}
                        </button>
                    ))}
                </div>

                {uniqueRules.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/50">
                        <List size={14} className="text-slate-400" />
                        <select
                            value={errorFilter}
                            onChange={(e) => setErrorFilter(e.target.value)}
                            className="bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer rounded-md px-2 py-1 border border-slate-700/50"
                        >
                            <option value="">Todos los errores</option>
                            {uniqueRules.map(rule => (
                                <option key={rule} value={rule}>{rule}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <span>{filteredAndSorted.length} de {results.length} filas</span>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800/50 overflow-hidden bg-[#141417]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800/50">
                                <Th sortable sortField="rowIndex" current={sortField} asc={sortAsc} onClick={toggleSort}>
                                    Fila
                                </Th>
                                <Th>GESCAL26</Th>
                                <Th>Dirección</Th>
                                <Th>Tipo Permiso</Th>
                                <Th>Totales</Th>
                                <Th sortable sortField="errors" current={sortField} asc={sortAsc} onClick={toggleSort}>
                                    Errores
                                </Th>
                                <Th className="w-10"><span /></Th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filteredAndSorted.map((result) => (
                                    <React.Fragment key={result.rowIndex}>
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => toggleRow(result.rowIndex)}
                                            className={cn(
                                                'border-b border-slate-800/30 cursor-pointer transition-colors hover:bg-slate-800/20',
                                                result.hasError ? 'border-l-2 border-l-red-500/50' : 'border-l-2 border-l-emerald-500/30'
                                            )}
                                        >
                                            <td className="p-3 text-sm font-mono text-slate-400">
                                                {result.row._excelRow ?? result.rowIndex + 2}
                                            </td>
                                            <td className="p-3">
                                                <span className="font-mono text-xs text-slate-300">
                                                    {result.row.GESCAL26 || '-'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-sm text-slate-300">
                                                    <span className="text-slate-500">{result.row['TIPO-VIA']}</span>{' '}
                                                    {result.row['NOMBRE-VIA']}
                                                </div>
                                                <div className="text-[10px] text-slate-600 font-mono">
                                                    Nº {result.row.NUM}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-xs text-slate-300">
                                                    {result.row['TIPO-DE-PERMISO'] || '-'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm font-mono text-slate-400">
                                                {result.row.TOTALES}
                                            </td>
                                            <td className="p-3">
                                                <ErrorBadge count={result.errors.length} />
                                            </td>
                                            <td className="p-3 text-center">
                                                {result.errors.length > 0 && (
                                                    <button className="text-slate-500 hover:text-slate-300 transition-colors">
                                                        {expandedRows.has(result.rowIndex) ? (
                                                            <ChevronUp size={16} />
                                                        ) : (
                                                            <ChevronDown size={16} />
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        </motion.tr>
                                        {expandedRows.has(result.rowIndex) && result.errors.length > 0 && (
                                            <motion.tr
                                                key={`detail-${result.rowIndex}`}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                            >
                                                <td colSpan={7} className="p-0">
                                                    <div className="border-b border-red-500/20 bg-red-500/5 px-4 py-3 space-y-2">
                                                        {result.errors.map((err, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex items-start gap-2 text-sm text-slate-300"
                                                            >
                                                                <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <span className="text-[10px] font-mono text-red-400/70 uppercase tracking-wider">
                                                                        [{err.rule}]
                                                                    </span>
                                                                    <span className="ml-2">{err.message}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredAndSorted.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                >
                    <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
                    <p className="text-slate-400 text-lg font-medium">No hay filas para mostrar</p>
                    <p className="text-slate-500 text-sm">
                        {errorFilter
                            ? `Ninguna fila tiene el error "${errorFilter}"`
                            : filter === 'withErrors'
                                ? 'Todas las filas pasaron la validación'
                                : 'No se encontraron resultados'
                        }
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}

function Th({
    children,
    sortable,
    sortField,
    current,
    asc,
    onClick,
    className,
}: {
    children: React.ReactNode;
    sortable?: boolean;
    sortField?: SortField;
    current?: SortField;
    asc?: boolean;
    onClick?: (field: SortField) => void;
    className?: string;
}) {
    const isActive = sortable && sortField === current;

    return (
        <th
            onClick={sortable && onClick ? () => onClick(sortField!) : undefined}
            className={cn(
                'p-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 text-left',
                sortable && 'cursor-pointer hover:text-slate-300 select-none',
                className
            )}
        >
            <div className="flex items-center gap-1">
                {children}
                {sortable && (
                    <ArrowUpDown size={12} className={cn(isActive ? 'text-blue-400' : 'text-slate-600')} />
                )}
            </div>
        </th>
    );
}
