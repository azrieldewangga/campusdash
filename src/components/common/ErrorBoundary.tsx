import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-base-300 p-4">
                    <div className="card bg-base-100 shadow-2xl max-w-lg w-full border border-base-content/10">
                        <div className="card-body items-center text-center">
                            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-2">
                                <AlertTriangle className="w-8 h-8 text-error" />
                            </div>
                            <h2 className="card-title text-2xl font-bold">Oops! Something went wrong.</h2>
                            <p className="opacity-70">
                                We encountered an unexpected error. Please try reloading the application.
                            </p>

                            <div className="bg-base-200 p-4 rounded-lg w-full mt-4 text-left overflow-auto max-h-48 border border-base-content/5">
                                <code className="text-xs font-mono opacity-80 break-words">
                                    {this.state.error && this.state.error.toString()}
                                </code>
                            </div>

                            <div className="card-actions justify-end mt-6 w-full">
                                <button
                                    className="btn btn-primary w-full gap-2"
                                    onClick={() => window.location.reload()}
                                >
                                    <RefreshCw size={18} />
                                    Reload Application
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
