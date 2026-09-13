import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, Save } from 'lucide-react'
import { useGetSalesConsultantsQuery } from '../../services/userApi'
import { useListCustomersQuery } from '../../services/customerApi'
import type { CustomerResponse } from '../../services/customerApi'

interface UpdateOrderModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => void
    initialData: {
        orderNo: string
        prosapContractNo?: string
        prosapContractNameSurname: string
        orderDate: string
        customerId?: string
        salesConsultantId?: string
        orderNotes?: string
    }
    isLoading: boolean
}

export default function UpdateOrderModal({ isOpen, onClose, onSubmit, initialData, isLoading }: UpdateOrderModalProps) {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: initialData
    })

    // Reset form when initialData changes
    useEffect(() => {
        if (isOpen && initialData) {
            reset(initialData)
        }
    }, [isOpen, initialData, reset])

    const { data: consultants = [] } = useGetSalesConsultantsQuery()
    const { data: customers = [] } = useListCustomersQuery()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">Sipariş Bilgilerini Düzenle</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sipariş No <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('orderNo', { required: 'Bu alan zorunludur' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sipariş Tarihi <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                {...register('orderDate', { required: 'Bu alan zorunludur' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sözleşme No
                            </label>
                            <input
                                {...register('prosapContractNo')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sözleşme Ad Soyad <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register('prosapContractNameSurname', { required: 'Bu alan zorunludur' })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Müşteri
                            </label>
                            <select
                                {...register('customerId')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                            >
                                <option value="">Seçiniz...</option>
                                {customers.map((c: CustomerResponse) => (
                                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Satış Danışmanı
                            </label>
                            <select
                                {...register('salesConsultantId')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                            >
                                <option value="">Seçiniz...</option>
                                {consultants.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sipariş Notları
                        </label>
                        <textarea
                            {...register('orderNotes')}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md shadow-orange-200"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Kaydet
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
