import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import Toast, { type ToastType } from '../components/common/Toast'

interface ToastMessage {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface ToastContextType {
    success: (message: string, duration?: number) => void
    error: (message: string, duration?: number) => void
    info: (message: string, duration?: number) => void
    warning: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([])

    const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
        const id = Math.random().toString(36).substring(7)
        setToasts(prev => [...prev, { id, type, message, duration }])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
    }, [])

    const contextValue = {
        success: (msg: string, dur?: number) => addToast('success', msg, dur),
        error: (msg: string, dur?: number) => addToast('error', msg, dur),
        info: (msg: string, dur?: number) => addToast('info', msg, dur),
        warning: (msg: string, dur?: number) => addToast('warning', msg, dur)
    }

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            {...toast}
                            onClose={removeToast}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
