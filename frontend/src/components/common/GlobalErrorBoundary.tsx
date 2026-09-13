import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
        this.setState({ errorInfo })
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-900 text-white p-8 flex flex-col items-center justify-center text-left">
                    <h1 className="text-2xl font-bold mb-4">Uygulama Hatası (Mobile Debug)</h1>
                    <pre className="bg-black/50 p-4 rounded overflow-auto w-full max-w-lg mb-4 text-xs font-mono border border-red-500">
                        {this.state.error?.toString()}
                    </pre>
                    <details className="w-full max-w-lg bg-black/30 p-2 rounded">
                        <summary className="mb-2 font-bold cursor-pointer">Stack Trace</summary>
                        <pre className="text-[10px] whitespace-pre-wrap font-mono">
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </details>
                    <button
                        className="mt-6 px-6 py-3 bg-white text-red-900 font-bold rounded"
                        onClick={() => window.location.reload()}
                    >
                        Yeniden Yükle
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
