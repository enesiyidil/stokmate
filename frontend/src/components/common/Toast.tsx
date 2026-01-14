import React, { useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
    id: string
    type: ToastType
    message: string
    onClose: (id: string) => void
    duration?: number
}

const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
}

const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
}

export default function Toast({ id, type, message, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id)
        }, duration)

        return () => clearTimeout(timer)
    }, [id, duration, onClose])

    return (
        <div className={`
            flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg 
            transform transition-all duration-300 animate-in slide-in-from-right-full
            ${styles[type]}
            min-w-[300px] max-w-md
        `}>
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={() => onClose(id)}
                className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
                <X className="w-4 h-4 opacity-50" />
            </button>
        </div>
    )
}
