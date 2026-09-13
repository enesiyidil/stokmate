import { useState } from 'react'
import { X, Mail, Shield, CheckCircle, User } from 'lucide-react'
import { useCreateUserMutation } from '../../services/userApi'

interface AddUserModalProps {
    onClose: () => void
    onSuccess: () => void
}

export default function AddUserModal({ onClose, onSuccess }: AddUserModalProps) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('STORE_EMPLOYEE')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [createUser, { isLoading }] = useCreateUserMutation()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            await createUser({ email, role }).unwrap()
            setSuccess(true)
            setTimeout(() => {
                onSuccess()
            }, 1500)
        } catch (err: any) {
            setError(err.data?.message || 'Kullanıcı oluşturulurken bir hata oluştu')
        }
    }

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-slide-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-900 mb-2">Başarılı!</h2>
                    <p className="text-amber-700">Kullanıcı oluşturuldu ve OTP kodu email'e gönderildi.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                        <User className="w-6 h-6" />
                        Yeni Kullanıcı Ekle
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-amber-700" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-medium text-amber-700 mb-2">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Email Adresi
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="kullanici@ornek.com"
                        />
                    </div>

                    {/* Role Select */}
                    <div>
                        <label className="block text-sm font-medium text-amber-700 mb-2">
                            <Shield className="w-4 h-4 inline mr-1" />
                            Rol
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 [&>option]:text-gray-900 [&>option]:bg-white"
                        >
                            <option value="STORE_EMPLOYEE">Mağaza Çalışanı</option>
                            <option value="STORE_MANAGER">Mağaza Sorumlusu</option>
                            <option value="LOGISTICS_MANAGER">Lojistik Yöneticisi</option>
                            <option value="OPERATIONS_MANAGER">Operasyon Yöneticisi</option>
                            <option value="DIRECTOR">Direktör</option>
                            <option value="MANAGER">Yönetici</option>
                        </select>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Info Message */}
                    <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg text-blue-800 text-sm">
                        Kullanıcı oluşturulduktan sonra, email adresine bir OTP kodu gönderilecektir.
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-amber-200 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-lg hover:from-amber-800 hover:to-orange-800 transition-all disabled:opacity-50 shadow-md"
                    >
                        <Shield className="w-4 h-4" />
                        {isLoading ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
                    </button>
                </div>
            </div>
        </div>
    )
}
