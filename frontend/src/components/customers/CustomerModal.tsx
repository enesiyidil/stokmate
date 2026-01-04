import { useState, useEffect } from 'react'
import { X, Save, Users } from 'lucide-react'
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '../../services/customerApi'
import type { CustomerRequest, CustomerResponse } from '../../services/customerApi'

interface CustomerModalProps {
    isOpen: boolean
    onClose: () => void
    customer?: CustomerResponse | null
}

export default function CustomerModal({ isOpen, onClose, customer }: CustomerModalProps) {
    const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation()
    const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation()

    const [formData, setFormData] = useState<CustomerRequest>({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        tcNo: '',
        city: '',
        district: '',
        neighborhood: '',
        fullAddress: '',
    })

    useEffect(() => {
        if (customer) {
            setFormData({
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phone || '',
                email: customer.email || '',
                tcNo: customer.tcNo || '',
                city: customer.city || '',
                district: customer.district || '',
                neighborhood: customer.neighborhood || '',
                fullAddress: customer.fullAddress || '',
            })
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                tcNo: '',
                city: '',
                district: '',
                neighborhood: '',
                fullAddress: '',
            })
        }
    }, [customer])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            if (customer) {
                await updateCustomer({ id: customer.id, data: formData }).unwrap()
                alert('Müşteri başarıyla güncellendi')
            } else {
                await createCustomer(formData).unwrap()
                alert('Müşteri başarıyla oluşturuldu')
            }
            onClose()
        } catch (error: any) {
            alert(error.data?.message || 'Bir hata oluştu')
        }
    }

    if (!isOpen) return null

    const isLoading = isCreating || isUpdating

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                        <Users className="w-6 h-6" />
                        {customer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
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
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-6">
                            {/* Kişisel Bilgiler */}
                            <div>
                                <h3 className="text-lg font-semibold text-amber-900 mb-4">Kişisel Bilgiler</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Ad */}
                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Ad *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Örn: Ahmet"
                                        />
                                    </div>

                                    {/* Soyad */}
                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Soyad *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Örn: Yılmaz"
                                        />
                                    </div>

                                    {/* Telefon */}
                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Telefon
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Örn: 0555 123 45 67"
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
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Örn: ahmet@example.com"
                                        />
                                    </div>

                                    {/* TC No */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            TC Kimlik No
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.tcNo}
                                            onChange={(e) => setFormData({ ...formData, tcNo: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="11 haneli TC kimlik numarası"
                                            maxLength={11}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Adres Bilgileri */}
                            <div>
                                <h3 className="text-lg font-semibold text-amber-900 mb-4">Adres Bilgileri</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Şehir */}
                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Şehir
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Örn: İstanbul"
                                        />
                                    </div>

                                    {/* İlçe */}
                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            İlçe
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.district}
                                            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Örn: Kadıköy"
                                        />
                                    </div>

                                    {/* Mahalle */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Mahalle
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.neighborhood}
                                            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Örn: Moda Mahallesi"
                                        />
                                    </div>

                                    {/* Tam Adres */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Tam Adres
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.fullAddress}
                                            onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                            placeholder="Sokak, bina no, daire no vb..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
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
                        {isLoading ? 'Kaydediliyor...' : (customer ? 'Güncelle' : 'Kaydet')}
                    </button>
                </div>
            </div>
        </div>
    )
}
