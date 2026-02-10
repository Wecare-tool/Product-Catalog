import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public state: ErrorBoundaryState = {
        hasError: false,
        error: null,
    };

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen bg-[#2b2b2b] flex flex-col items-center justify-center p-4 text-center">
                    <div className="bg-white/10 p-8 rounded-lg backdrop-blur-md max-w-md w-full border border-white/20">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-red-400 font-lexend text-xl mb-2 font-bold">
                            Đã xảy ra lỗi
                        </h3>
                        <p className="text-gray-300 font-roboto text-sm mb-4">
                            Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang.
                        </p>
                        {this.state.error && (
                            <pre className="text-[10px] text-gray-500 bg-black/30 p-3 rounded mb-4 overflow-auto max-h-24 text-left">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            onClick={this.handleReload}
                            className="bg-wecare-blue text-white px-6 py-3 rounded-lg hover:bg-wecare-darkBlue transition-colors font-medium font-lexend"
                        >
                            Tải lại trang
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
