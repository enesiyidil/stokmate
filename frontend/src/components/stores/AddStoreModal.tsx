import { useState } from 'react'
import { X, Building2, Save } from 'lucide-react'
import { useCreateStoreMutation } from '../../services/storeApi'

interface AddStoreModalProps {
    onClose: () => void
    onSuccess: () => void
}

export default function AddStoreModal({ onClose, onSuccess }: AddStoreModalProps) {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        address: '',
        phone: '',
        email: '',
    })
    const [error, setError] = useState('')
    const [createStore, { isLoading }] = useCreateStoreMutation()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            await createStore(formData).unwrap()
            onSuccess()
        } catch (err: any) {
            setError(err?.data?.message || 'Mağaza oluşturulurken bir hata oluştu')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                        <Building2 className="w-6 h-6" />
                        Yeni Mağaza Ekle
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-amber-700" />
                    </button>
                </div>

                {/* Form */}
                <div className="overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Store Code */}
                        <div>
                            <label className="block text-sm font-medium text-amber-700 mb-2">
                                Mağaza Kodu *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="M001"
                            />
                        </div>

                        {/* Store Name */}
                        <div>
                            <label className="block text-sm font-medium text-amber-700 mb-2">
                                Mağaza Adı *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="Merkez Mağaza"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-amber-700 mb-2">
                                Adres
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                placeholder="Tam adres..."
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-amber-700 mb-2">
                                Telefon
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="0555 123 4567"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-amber-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="magaza@email.com"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
                                {error}
                            </div>
                        )}
                    </form>
                </div>

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
                        <Save className="w-4 h-4" />
                        {isLoading ? 'Oluşturuluyor...' : 'Mağaza Oluştur'}
                    </button>
                </div>
            </div>
        </div>
    )
}
