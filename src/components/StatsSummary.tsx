import { motion } from 'framer-motion';
import { FileSpreadsheet, CheckCircle2, AlertTriangle, SkipForward } from 'lucide-react';
import type { ValidatorSummary } from '../types';
import { cn } from '../utils';

interface StatsSummaryProps {
    summary: ValidatorSummary;
    fileName: string;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'rounded-2xl border p-5 bg-[#141417]',
                'border-slate-800/50 card-hover'
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                    color === 'blue' && 'bg-blue-500/10',
                    color === 'emerald' && 'bg-emerald-500/10',
                    color === 'red' && 'bg-red-500/10',
                    color === 'slate' && 'bg-slate-500/10',
                )}>
                    {icon}
                </div>
                <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        {label}
                    </div>
                    <div className={cn(
                        'text-2xl font-black',
                        color === 'blue' && 'text-blue-400',
                        color === 'emerald' && 'text-emerald-400',
                        color === 'red' && 'text-red-400',
                        color === 'slate' && 'text-slate-400',
                    )}>
                        {value.toLocaleString()}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function StatsSummary({ summary, fileName }: StatsSummaryProps) {
    return (
        <div className="space-y-4">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-slate-400 text-sm"
            >
                <FileSpreadsheet size={16} className="text-blue-400" />
                <span className="font-mono text-xs">{fileName}</span>
                <span className="text-slate-600">—</span>
                <span className="text-slate-500">{summary.total} filas procesadas</span>
                {summary.skipped > 0 && (
                    <>
                        <span className="text-slate-600">—</span>
                        <span className="text-slate-500">{summary.skipped} filas sin CENSUS-ZONE-MAP</span>
                    </>
                )}
            </motion.div>

            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    icon={<FileSpreadsheet size={22} className="text-blue-400" />}
                    label="Total Filas"
                    value={summary.total}
                    color="blue"
                />
                <StatCard
                    icon={<CheckCircle2 size={22} className="text-emerald-400" />}
                    label="Sin Errores"
                    value={summary.ok}
                    color="emerald"
                />
                <StatCard
                    icon={<AlertTriangle size={22} className="text-red-400" />}
                    label="Con Errores"
                    value={summary.withErrors}
                    color="red"
                />
                <StatCard
                    icon={<SkipForward size={22} className="text-slate-400" />}
                    label="Saltadas"
                    value={summary.skipped}
                    color="slate"
                />
            </div>
        </div>
    );
}
