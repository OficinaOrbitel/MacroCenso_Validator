import { cn } from '../utils';

interface ErrorBadgeProps {
    count: number;
}

export default function ErrorBadge({ count }: ErrorBadgeProps) {
    if (count === 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                OK
            </span>
        );
    }

    return (
        <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider',
            count === 1
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
        )}>
            <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                count === 1 ? 'bg-amber-400' : 'bg-red-400'
            )} />
            {count} error{count !== 1 ? 'es' : ''}
        </span>
    );
}
