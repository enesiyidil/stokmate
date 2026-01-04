import { useState, useEffect } from 'react'
import { X, Building2, Save } from 'lucide-react'
import { useUpdateStoreMutation, type StoreResponse } from '../../services/storeApi'

interface EditStoreModalProps {
    store: StoreResponse
    onClose: () => void
    onSuccess: () => void
}

export default function EditStoreModal({ store, onClose, onSuccess }: EditStoreModalProps) {
    const [formData, setFormData] = useState({
        name: store.name,
        address: store.address || '',
        phone: store.phone || '',
        email: store.email || '',
        active: store.active,
    })
    const [error, setError] = useState('')
    const [updateStore, { isLoading }] = useUpdateStoreMutation()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            await updateStore({ id: store.id, data: formData }).unwrap()
            onSuccess()
        } catch (err: any) {
            setError(err?.data?.message || 'Mağaza güncellenirken bir hata oluştu')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                        <Building2 className="w-6 h-6" />
                        Mağaza Düzenle
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
                        {/* Store Code (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-amber-700 mb-2">
                                Mağaza Kodu
                            </label>
                            <input
                                type="text"
                                value={store.code}
                                disabled
                                className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-600 cursor-not-allowed"
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

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <span className="text-amber-900 font-medium">Aktif Durum</span>
                            <label className="relative inline-block w-14 h-7">
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="opacity-0 w-0 h-0 peer"
                                />
                                <span className="absolute cursor-pointer inset-0 bg-gray-300 rounded-full transition-all peer-checked:bg-amber-600 before:absolute before:h-5 before:w-5 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all peer-checked:before:translate-x-7"></span>
                            </label>
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
                        {isLoading ? 'Güncelleniyor...' : 'Güncelle'}
                    </button>
                </div>
            </div>
        </div>
    )
}
