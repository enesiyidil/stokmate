import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { useListCustomersQuery } from '../../services/customerApi'
import { useGetOrdersByCustomerQuery } from '../../services/orderApi'
import { useCreateCrossConversionMutation } from '../../services/crossConversionApi'
import { BRANDS, getBrandLabel, getBrandColor, type Brand } from '../../constants/brandConstants'

interface Props {
    onClose: () => void
    onSuccess?: () => void
}

export default function AddCrossConversionModal({ onClose, onSuccess }: Props) {
    const [createCrossConversion, { isLoading }] = useCreateCrossConversionMutation()
    const { data: customers = [] } = useListCustomersQuery()

    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const [selectedOrderId, setSelectedOrderId] = useState('')
    const [sourceBrand, setSourceBrand] = useState<Brand | null>(null)
    const [targetBrand, setTargetBrand] = useState<Brand | null>(null)
    const [notes, setNotes] = useState('')
    const [customerSearch, setCustomerSearch] = useState('')
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

    const { data: customerOrders = [] } = useGetOrdersByCustomerQuery(selectedCustomerId, {
        skip: !selectedCustomerId
    })

    // Reset target brand when source brand changes
    useEffect(() => {
        if (sourceBrand && targetBrand && sourceBrand === targetBrand) {
            setTargetBrand(null)
        }
    }, [sourceBrand])

    // Filter customers by search query
    const filteredCustomers = customers.filter(c => {
        if (!customerSearch.trim()) return true
        const query = customerSearch.toLocaleLowerCase('tr-TR')
        const fullName = `${c.firstName} ${c.lastName}`.toLocaleLowerCase('tr-TR')
        return fullName.includes(query) || c.phone?.includes(query)
    })

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCustomerId || !selectedOrderId || !sourceBrand || !targetBrand) return

        try {
            await createCrossConversion({
                customerId: selectedCustomerId,
                orderId: selectedOrderId,
                sourceBrand: sourceBrand,
                targetBrand: targetBrand,
                notes: notes || undefined,
            }).unwrap()
            onSuccess?.()
            onClose()
        } catch (error: any) {
            console.error('Failed to create cross conversion:', error)
            const errorMessage = error?.data?.message || error?.message || 'Çapraz dönüştürme oluşturulurken bir hata oluştu'
            alert(errorMessage)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <h2 className="text-2xl font-bold text-amber-900">Çapraz Dönüştürme Ekle</h2>
                    <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
                        <X className="w-6 h-6 text-amber-700" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="p-6 space-y-6">

                        {/* 1. Müşteri Seçimi */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-amber-900">Müşteri Seçimi *</h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : customerSearch}
                                    onChange={(e) => {
                                        setCustomerSearch(e.target.value)
                                        setSelectedCustomerId('')
                                        setSelectedOrderId('')
                                        setShowCustomerDropdown(true)
                                    }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    placeholder="Müşteri adı veya telefon ile arayın..."
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                {selectedCustomer && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedCustomerId('')
                                            setSelectedOrderId('')
                                            setCustomerSearch('')
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            {showCustomerDropdown && !selectedCustomerId && (
                                <div className="bg-white border border-amber-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {filteredCustomers.length === 0 ? (
                                        <div className="px-4 py-3 text-amber-500 text-sm">Müşteri bulunamadı</div>
                                    ) : (
                                        filteredCustomers.map(customer => (
                                            <button
                                                key={customer.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCustomerId(customer.id)
                                                    setCustomerSearch('')
                                                    setSelectedOrderId('')
                                                    setShowCustomerDropdown(false)
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors border-b border-amber-100 last:border-none"
                                            >
                                                <p className="font-medium text-amber-900">{customer.firstName} {customer.lastName}</p>
                                                {customer.phone && <p className="text-sm text-amber-600">{customer.phone}</p>}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 2. Sözleşme (Sipariş) Seçimi */}
                        {selectedCustomerId && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-amber-900">Sözleşme Seçimi *</h3>
                                <p className="text-sm text-amber-600">Müşterinin mevcut siparişlerinden birini seçin.</p>
                                {customerOrders.length === 0 ? (
                                    <p className="text-amber-500 text-sm p-3 bg-amber-50 rounded-xl">Bu müşteriye ait sipariş bulunamadı.</p>
                                ) : (
                                    <select
                                        value={selectedOrderId}
                                        onChange={(e) => setSelectedOrderId(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="">Sipariş seçiniz...</option>
                                        {customerOrders.map(order => (
                                            <option key={order.id} value={order.id}>
                                                {order.prosapContractNo || order.orderNo} — {order.orderType === 'CUSTOMER_SPECIFIC' ? 'Müşteriye Özel' : order.orderType === 'STOCK' ? 'Stoklu Satış' : order.orderType}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* 3. Nereden Marka Seçimi */}
                        {selectedOrderId && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-amber-900">Nereden *</h3>
                                <p className="text-sm text-amber-600">Ürünlerin hangi markadan geleceğini seçin.</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {BRANDS.map(brand => (
                                        <button
                                            key={brand}
                                            type="button"
                                            onClick={() => setSourceBrand(brand)}
                                            className={`px-4 py-3 rounded-lg font-medium transition-all ${sourceBrand === brand
                                                ? 'ring-2 ring-offset-2 shadow-lg transform scale-105'
                                                : 'hover:shadow-md hover:scale-102'
                                                }`}
                                            style={{
                                                backgroundColor: sourceBrand === brand ? getBrandColor(brand) : '#fff',
                                                color: sourceBrand === brand ? '#fff' : getBrandColor(brand),
                                                borderColor: getBrandColor(brand),
                                                borderWidth: '2px',
                                            }}
                                        >
                                            {getBrandLabel(brand)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 4. Nereye Marka Seçimi */}
                        {sourceBrand && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-amber-900">Nereye *</h3>
                                <p className="text-sm text-amber-600">Ürünlerin hangi markaya dönüştürüleceğini seçin.</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {BRANDS.map(brand => {
                                        const isDisabled = brand === sourceBrand
                                        return (
                                            <button
                                                key={brand}
                                                type="button"
                                                onClick={() => !isDisabled && setTargetBrand(brand)}
                                                disabled={isDisabled}
                                                className={`px-4 py-3 rounded-lg font-medium transition-all ${isDisabled
                                                    ? 'opacity-30 cursor-not-allowed'
                                                    : targetBrand === brand
                                                        ? 'ring-2 ring-offset-2 shadow-lg transform scale-105'
                                                        : 'hover:shadow-md hover:scale-102'
                                                    }`}
                                                style={{
                                                    backgroundColor: !isDisabled && targetBrand === brand ? getBrandColor(brand) : '#fff',
                                                    color: !isDisabled && targetBrand === brand ? '#fff' : getBrandColor(brand),
                                                    borderColor: getBrandColor(brand),
                                                    borderWidth: '2px',
                                                }}
                                            >
                                                {getBrandLabel(brand)}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 5. Not */}
                        {targetBrand && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-amber-900">Not</h3>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Opsiyonel not ekleyebilirsiniz..."
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-amber-200 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !selectedCustomerId || !selectedOrderId || !sourceBrand || !targetBrand}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-lg hover:from-amber-800 hover:to-orange-800 transition-all disabled:opacity-50 shadow-md"
                        >
                            <Save className="w-4 h-4" />
                            {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
