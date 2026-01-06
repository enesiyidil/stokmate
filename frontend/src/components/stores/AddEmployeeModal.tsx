import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import { useAssignEmployeeMutation, useGetStoreEmployeesQuery } from '../../services/storeEmployeeApi'
import { useGetAllUsersQuery, type UserResponse } from '../../services/userApi'

interface AddEmployeeModalProps {
    storeId: string
    onClose: () => void
    onSuccess: () => void
}

export default function AddEmployeeModal({ storeId, onClose, onSuccess }: AddEmployeeModalProps) {
    const [formData, setFormData] = useState({
        userId: '',
        joinDate: new Date().toISOString().split('T')[0],
    })
    const [error, setError] = useState('')

    const { data: users = [] } = useGetAllUsersQuery()
    const { data: currentEmployees = [] } = useGetStoreEmployeesQuery(storeId)
    const [assignEmployee, { isLoading }] = useAssignEmployeeMutation()

    // Get IDs of users already assigned to this store
    const assignedUserIds = new Set(currentEmployees.map(emp => emp.user.id))

    // Filter users to only show STORE_MANAGER and STORE_EMPLOYEE who are NOT already assigned
    const availableEmployees = users.filter(
        (u: UserResponse) =>
            (u.role === 'STORE_MANAGER' || u.role === 'STORE_EMPLOYEE') &&
            !assignedUserIds.has(u.id)
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.userId) {
            setError('Lütfen bir çalışan seçin')
            return
        }

        try {
            await assignEmployee({ storeId, data: formData }).unwrap()
            onSuccess()
        } catch (err: any) {
            setError(err?.data?.message || 'Çalışan atanırken bir hata oluştu')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                        <UserPlus className="w-6 h-6" />
                        Çalışan Ekle
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-amber-700" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-amber-700 mb-2">
                            Çalışan *
                        </label>
                        <select
                            required
                            value={formData.userId}
                            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        >
                            <option value="" disabled>
                                {availableEmployees.length === 0 ? 'Atanabilecek çalışan yok' : 'Çalışan seçin'}
                            </option>
                            {availableEmployees.map((user: UserResponse) => (
                                <option key={user.id} value={user.id}>
                                    {user.firstName || ''} {user.lastName || ''} ({user.email})
                                </option>
                            ))}
                        </select>
                        {availableEmployees.length === 0 && (
                            <p className="mt-2 text-xs text-amber-600">
                                Tüm uygun çalışanlar mağazalara atanmış durumda.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-700 mb-2">
                            İşe Giriş Tarihi *
                        </label>
                        <input
                            type="date"
                            required
                            value={formData.joinDate}
                            onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-red-800 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-all"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || availableEmployees.length === 0}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-lg hover:from-amber-800 hover:to-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            {isLoading ? 'Ekleniyor...' : 'Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
