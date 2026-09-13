import { CheckCircle, X } from 'lucide-react'
import { useEffect } from 'react'

interface SuccessModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    message: string
    autoCloseMs?: number
}

export default function SuccessModal({
    isOpen,
    onClose,
    title,
    message,
    autoCloseMs = 2000
}: SuccessModalProps) {
    useEffect(() => {
        if (isOpen && autoCloseMs > 0) {
            const timer = setTimeout(() => {
                onClose()
            }, autoCloseMs)
            return () => clearTimeout(timer)
        }
    }, [isOpen, autoCloseMs, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-green-500/30 rounded-2xl shadow-2xl w-full max-w-md animate-bounce-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-purple-200" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse">
                            <CheckCircle className="w-12 h-12 text-green-400" />
                        </div>
                    </div>
                    <p className="text-purple-200 text-lg">{message}</p>
                </div>
            </div>
        </div>
    )
}
