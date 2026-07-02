import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileSpreadsheet, RefreshCw, FileDown } from 'lucide-react';
import type { AppPhase, ValidationResult, ValidatorSummary } from './types';
import { mergeAllValidationResults } from './macroValidator';
import { readExcelFile } from './processFile';
import { exportReport } from './exportReport';
import ErrorBoundary from './components/ErrorBoundary';
import FileUpload from './components/FileUpload';
import StatsSummary from './components/StatsSummary';
import ValidationResults from './components/ValidationResults';

export default function App() {
    const [phase, setPhase] = useState<AppPhase>('upload');
    const [results, setResults] = useState<ValidationResult[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [skipped, setSkipped] = useState<number>(0);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);

    const processFile = useCallback(async (file: File) => {
        setPhase('loading');
        setError(null);

        const timeout = setTimeout(() => {
            setError('La operación está tomando demasiado tiempo. Posible archivo muy grande o formato no soportado.');
            setPhase('upload');
        }, 20000);

        try {
            console.log('[processFile] reading file...', file.name);
            const fileData = await readExcelFile(file);
            console.log('[processFile] file read:', fileData.totalRows, 'rows, skipped:', fileData.skippedRows);

            console.log('[processFile] validating...');
            const validationResults = mergeAllValidationResults(fileData.rows);
            console.log('[processFile] validation done:', validationResults.length, 'results');

            clearTimeout(timeout);
            setFileName(fileData.fileName);
            setResults(validationResults);
            setSkipped(fileData.skippedRows);
            setPhase('results');
        } catch (err) {
            clearTimeout(timeout);
            console.error('[processFile] error:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido al procesar el archivo');
            setPhase('upload');
        }
    }, []);

    const handleFileSelect = useCallback(async (file: File, handle?: FileSystemFileHandle) => {
        setCurrentFile(file);
        if (handle) setFileHandle(handle);
        await processFile(file);
    }, [processFile]);

    const handleRefresh = useCallback(async () => {
        // Priority 1: use stored FileSystemFileHandle (always reads fresh from disk)
        if (fileHandle) {
            try {
                const freshFile = await fileHandle.getFile();
                await processFile(freshFile);
                return;
            } catch { /* handle may be stale, fall through */ }
        }

        // Priority 2: open file picker (gets a new handle)
        if ((window as any).showOpenFilePicker) {
            try {
                const [handle] = await (window as any).showOpenFilePicker({
                    id: 'excelPicker',
                    types: [{
                        description: 'Archivos Excel',
                        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xls'] }
                    }],
                    excludeAcceptAllOption: true,
                    multiple: false,
                });
                setFileHandle(handle);
                const freshFile = await handle.getFile();
                await processFile(freshFile);
                return;
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
            }
        }

        // Priority 3: use stored File (best-effort, may be stale)
        if (currentFile) {
            await processFile(currentFile);
        }
    }, [fileHandle, currentFile, processFile]);

    const handleExport = useCallback(() => {
        exportReport(results, fileName, skipped);
    }, [results, fileName, skipped]);

    const handleReset = useCallback(() => {
        setPhase('upload');
        setResults([]);
        setFileName('');
        setError(null);
        setSkipped(0);
        setCurrentFile(null);
        setFileHandle(null);
    }, []);

    const summary: ValidatorSummary = {
        total: results.length,
        ok: results.filter(r => !r.hasError).length,
        withErrors: results.filter(r => r.hasError).length,
        skipped,
    };

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-[#0a0a0c]">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <AnimatePresence>
                        {phase === 'upload' && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <FileUpload onFileSelect={handleFileSelect} isLoading={false} />
                            </motion.div>
                        )}

                        {phase === 'loading' && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center min-h-[60vh]"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                    className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6"
                                >
                                    <FileSpreadsheet size={32} className="text-blue-400" />
                                </motion.div>
                                <p className="text-white font-medium text-lg mb-1">Procesando archivo</p>
                                <p className="text-slate-500 text-sm">Leyendo y validando datos...</p>

                                <div className="mt-8 flex gap-1.5">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-2.5 h-2.5 rounded-full bg-blue-400"
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {phase === 'results' && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/30 transition-all text-sm"
                                    >
                                        <ArrowLeft size={16} />
                                        <span className="hidden sm:inline">Nuevo archivo</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet size={18} className="text-blue-400" />
                                        <span className="text-white font-medium">{fileName}</span>
                                        <button
                                            onClick={handleRefresh}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all text-xs font-bold uppercase tracking-wider"
                                        >
                                            <RefreshCw size={13} />
                                            Actualizar
                                        </button>
                                        <button
                                            onClick={handleExport}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-bold uppercase tracking-wider"
                                        >
                                            <FileDown size={13} />
                                            Exportar
                                        </button>
                                    </div>

                                    <div className="w-20" />
                                </div>

                                <StatsSummary summary={summary} fileName={fileName} />

                                {summary.withErrors > 0 ? (
                                    <ValidationResults results={results} />
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                                            <FileSpreadsheet size={40} className="text-emerald-400" />
                                        </div>
                                        <p className="text-white text-xl font-black mb-2">¡Validación exitosa!</p>
                                        <p className="text-slate-400 text-sm max-w-md">
                                            Todas las {summary.total} filas pasaron las reglas de validación sin errores.
                                        </p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </ErrorBoundary>
    );
}
