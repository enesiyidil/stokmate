import { useState } from 'react'
import { X, UserCheck } from 'lucide-react'
import { useUpdateUserRoleMutation } from '../../services/userApi'
import { useToast } from '../../context/ToastContext'

interface EditUserRoleModalProps {
    onClose: () => void
    user: {
        id: string
        email: string
        role: string
        displayName?: string
    }
}

const ROLES = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Craft' },
    { value: 'DIRECTOR', label: 'Direktör' },
    { value: 'STORE_MANAGER', label: 'Mağaza Sorumlusu' },
    { value: 'STORE_EMPLOYEE', label: 'Mağaza Çalışanı' },
    { value: 'OPERATIONS_MANAGER', label: 'Operasyon Sorumlusu' },
    { value: 'LOGISTICS_MANAGER', label: 'Lojistik Sorumlusu' },
]

export default function EditUserRoleModal({ onClose, user }: EditUserRoleModalProps) {
    const [selectedRole, setSelectedRole] = useState(user.role)
    const [updateUserRole, { isLoading }] = useUpdateUserRoleMutation()
    const { success, error } = useToast()

    const handleSubmit = async () => {
        if (selectedRole === user.role) {
            error('Aynı rol seçildi, değişiklik yapılmadı.')
            return
        }

        try {
            await updateUserRole({ id: user.id, role: selectedRole }).unwrap()
            success('Kullanıcı rolü başarıyla güncellendi!')
            onClose()
        } catch (err) {
            console.error('Failed to update role:', err)
            error('Rol güncellenirken bir hata oluştu')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-200 w-full max-w-md mx-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-700 to-orange-700 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                            <UserCheck className="w-6 h-6" />
                            <h2 className="text-xl font-semibold">Rol Değiştir</h2>
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
                    <div>
                        <p className="text-sm text-amber-700 mb-1">Kullanıcı</p>
                        <p className="text-amber-900 font-medium">
                            {user.displayName || user.email}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-900 mb-2">
                            Yeni Rol
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            {ROLES.map((role) => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-amber-200 p-6 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-amber-300 text-amber-900 rounded-lg hover:bg-amber-50 transition-colors"
                        disabled={isLoading}
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-6 py-2 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-lg hover:from-amber-800 hover:to-orange-800 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Güncelleniyor...' : 'Güncelle'}
                    </button>
                </div>
            </div>
        </div>
    )
}
