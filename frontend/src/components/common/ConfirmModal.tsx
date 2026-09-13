import { CheckCircle, AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
    isOpen: boolean
    onClose?: () => void
    onCancel?: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'success' | 'warning' | 'danger'
    isLoading?: boolean
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onCancel,
    onConfirm,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    type = 'warning',
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null

    const handleCancel = () => {
        if (onCancel) onCancel()
        if (onClose) onClose()
    }

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-12 h-12 text-green-400" />
            case 'danger':
                return <AlertTriangle className="w-12 h-12 text-red-400" />
            default:
                return <AlertTriangle className="w-12 h-12 text-orange-400" />
        }
    }

    const getButtonClass = () => {
        switch (type) {
            case 'success':
                return 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
            case 'danger':
                return 'from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
            default:
                return 'from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <h3 className="text-xl font-bold text-amber-900">{title}</h3>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5 text-amber-700" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                        {getIcon()}
                    </div>
                    <p className="text-amber-700 text-lg">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-amber-200 bg-white">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-6 py-2 bg-gradient-to-r ${getButtonClass()} text-white rounded-lg transition-all shadow-lg disabled:opacity-50`}
                    >
                        {isLoading ? 'İşleniyor...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
