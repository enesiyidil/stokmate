import { X, Power } from 'lucide-react'

interface ConfirmToggleActiveModalProps {
    onClose: () => void
    onConfirm: () => void
    user: {
        displayName?: string
        email: string
        active: boolean
    }
}

export default function ConfirmToggleActiveModal({ onClose, onConfirm, user }: ConfirmToggleActiveModalProps) {
    const action = user.active ? 'pasif' : 'aktif'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-200 w-full max-w-md mx-4">
                {/* Header */}
                <div className={`bg-gradient-to-r ${user.active ? 'from-orange-600 to-orange-700' : 'from-green-600 to-green-700'} p-6 rounded-t-2xl`}>
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <Power className="w-6 h-6" />
                            <h2 className="text-xl font-semibold">Kullanıcıyı {action.charAt(0).toUpperCase() + action.slice(1)} Yap</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-700">
                        <strong>{user.displayName || user.email}</strong> kullanıcısını {action} yapmak istediğinizden emin misiniz?
                    </p>
                    {user.active && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <p className="text-sm text-orange-800">
                                Pasif yapılan kullanıcı sisteme giriş yapamayacaktır.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2 bg-gradient-to-r ${user.active ? 'from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800' : 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} text-white rounded-lg transition-colors`}
                    >
                        {action.charAt(0).toUpperCase() + action.slice(1)} Yap
                    </button>
                </div>
            </div>
        </div>
    )
}
