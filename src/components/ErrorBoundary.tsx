import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <AlertTriangle size={32} className="text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white mb-2">Error inesperado</h2>
                            <p className="text-slate-400 text-sm mb-4">
                                Ocurrió un error al procesar o mostrar los datos.
                            </p>
                            <div className="bg-[#141417] rounded-xl border border-slate-800/50 p-4 mb-6 text-left">
                                <p className="text-[10px] uppercase font-bold text-red-400/70 tracking-wider mb-2">
                                    {this.state.error?.name || 'Error'}
                                </p>
                                <p className="text-xs text-slate-400 font-mono break-all">
                                    {this.state.error?.message || 'Error desconocido'}
                                </p>
                            </div>
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-medium"
                            >
                                <RefreshCw size={16} />
                                Recargar página
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}