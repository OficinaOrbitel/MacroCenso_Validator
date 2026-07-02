import { useState, useRef, type DragEvent } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { cn } from '../utils';

interface FileUploadProps {
    onFileSelect: (file: File, handle?: FileSystemFileHandle) => void;
    isLoading: boolean;
}

export default function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);

        const files = e.dataTransfer.files;
        const item = e.dataTransfer.items?.[0];
        let fileHandle: FileSystemFileHandle | undefined;

        if (item && item.kind === 'file' && (item as any).getAsFileSystemHandle) {
            try {
                fileHandle = await (item as any).getAsFileSystemHandle();
            } catch { /* browser doesn't support it */ }
        }

        if (files.length === 0) return;

        validateAndSelect(files[0], fileHandle);
    };

    const handleClick = async () => {
        if (isLoading) return;

        if ((window as any).showOpenFilePicker) {
            try {
                const [handle] = await (window as any).showOpenFilePicker({
                    types: [{
                        description: 'Archivos Excel',
                        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xls'] }
                    }],
                    excludeAcceptAllOption: true,
                    multiple: false,
                });
                const file = await handle.getFile();
                validateAndSelect(file, handle);
                return;
            } catch (err: any) {
                if (err?.name === 'AbortError') return;
            }
        }

        inputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        validateAndSelect(files[0]);
        e.target.value = '';
    };

    const validateAndSelect = (file: File, handle?: FileSystemFileHandle) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !['xlsx', 'xls', 'xlsm'].includes(ext)) {
            setError('Solo se admiten archivos Excel (.xlsx, .xls, .xlsm)');
            return;
        }
        onFileSelect(file, handle);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center min-h-[60vh]"
        >
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                    <FileSpreadsheet size={32} className="text-blue-400" />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">MacroCenso Validator</h1>
                <p className="text-slate-400 text-sm max-w-md">
                    Arrastrá un archivo Excel con volcados de censo para validar su contenido según las reglas de la macro.
                </p>
            </div>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={isLoading ? undefined : handleClick}
                className={cn(
                    'relative w-full max-w-lg p-12 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-200',
                    isDragging
                        ? 'border-blue-400 bg-blue-500/5'
                        : 'border-slate-700/50 bg-[#141417] hover:border-slate-600/50 hover:bg-slate-800/20',
                    isLoading && 'opacity-50 pointer-events-none'
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.xlsm"
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={isLoading}
                />

                <div className="flex flex-col items-center gap-4">
                    <div className={cn(
                        'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                        isDragging ? 'bg-blue-500/20' : 'bg-slate-800/50'
                    )}>
                        {isLoading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            >
                                <Upload size={28} className="text-blue-400" />
                            </motion.div>
                        ) : (
                            <Upload size={28} className={cn(
                                'transition-colors',
                                isDragging ? 'text-blue-400' : 'text-slate-400'
                            )} />
                        )}
                    </div>

                    <div className="text-center">
                        {isLoading ? (
                            <p className="text-blue-400 font-medium">Procesando archivo...</p>
                        ) : (
                            <>
                                <p className="text-white font-medium mb-1">
                                    {isDragging ? 'Soltá el archivo aquí' : 'Hacé clic o arrastrá un archivo'}
                                </p>
                                <p className="text-slate-500 text-xs">
                                    Formatos soportados: .xlsx, .xls, .xlsm
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                </motion.div>
            )}

            <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/30 border border-slate-700/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <FileSpreadsheet size={12} />
                    Basado en las reglas de validación de Revisión volcados Censo
                </div>
            </div>
        </motion.div>
    );
}
