import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useSoftDeleteUserMutation } from '../../services/userApi'

interface DeleteUserModalProps {
    onClose: () => void
    user: {
        id: string
        email: string
        displayName?: string
    }
}

export default function DeleteUserModal({ onClose, user }: DeleteUserModalProps) {
    const [alias, setAlias] = useState('')
    const [softDeleteUser, { isLoading }] = useSoftDeleteUserMutation()

    const handleSubmit = async () => {
        if (!alias.trim()) {
            alert('Lütfen bir mahlas girin.')
            return
        }

        if (alias.trim().length < 3 || alias.trim().length > 50) {
            alert('Mahlas 3-50 karakter arasında olmalıdır.')
            return
        }

        if (!confirm(`"${user.displayName || user.email}" kullanıcısını silmek istediğinizden emin misiniz?\n\nMahlas: ${alias}`)) {
            return
        }

        try {
            await softDeleteUser({ id: user.id, alias: alias.trim() }).unwrap()
            alert('Kullanıcı başarıyla silindi!')
            onClose()
        } catch (error: any) {
            console.error('Failed to delete user:', error)
            if (error?.data?.message?.includes('Alias already exists')) {
                alert('Bu mahlas zaten kullanılıyor, lütfen farklı bir mahlas girin.')
            } else {
                alert('Kullanıcı silinirken bir hata oluştu')
            }
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-200 w-full max-w-md mx-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6" />
                            <h2 className="text-xl font-semibold">Kullanıcıyı Sil</h2>
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
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">
                            <strong>Uyarı:</strong> Bu işlem kullanıcıyı kalıcı olarak siler.
                            Geçmiş kayıtlarda kullanıcı adı yerine girdiğiniz mahlas görünecektir.
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-700 mb-1">Silinecek Kullanıcı</p>
                        <p className="text-gray-900 font-medium">
                            {user.displayName || user.email}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Mahlas <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            placeholder="ör: eski_calisan_001, ayrilmis_personel_XYZ"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                            maxLength={50}
                        />
                        <p className="text-xs text-gray-600 mt-1">
                            3-50 karakter arasında benzersiz bir mahlas girin
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isLoading}
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Siliniyor...' : 'Sil'}
                    </button>
                </div>
            </div>
        </div>
    )
}
