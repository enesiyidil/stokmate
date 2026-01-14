import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save, User } from 'lucide-react'
import { useCreateOrderMutation, type OrderProductCreateRequest, useGetOrdersByCustomerQuery } from '../../services/orderApi'
import { useListCustomersQuery, type CustomerRequest } from '../../services/customerApi'
import { useGetSalesConsultantsQuery } from '../../services/userApi'
import SearchableSelect from '../common/SearchableSelect'
import { cities, districts, neighborhoods } from '../../data/turkeyLocations'
import { BRANDS, getBrandLabel, getBrandColor, type Brand } from '../../constants/brandConstants'

interface PrefillData {
    orderType?: 'STOCK' | 'CUSTOMER_SPECIFIC' | 'AFTER_SALES_SERVICE'
    customerId?: string
    salesConsultantId?: string
    brand?: string
    parentOrderId?: string
    linkedShipmentId?: string
    hidden?: boolean
    problemType?: string
}

interface Props {
    onClose: () => void
    onSuccess?: () => void
    isOpen?: boolean
    prefillData?: PrefillData
}

type OrderType = 'CUSTOMER_SPECIFIC' | 'STOCK' | 'AFTER_SALES_SERVICE'

interface ProductWithPricing extends OrderProductCreateRequest {
    showPricing: boolean
}

export default function AddOrderModal({ onClose, onSuccess, isOpen = true, prefillData }: Props) {
    const [createOrder, { isLoading }] = useCreateOrderMutation()
    const [orderType, setOrderType] = useState<OrderType>('STOCK')

    // Always fetch customers and sales consultants
    const { data: customers = [] } = useListCustomersQuery()
    const { data: salesConsultants = [] } = useGetSalesConsultantsQuery()

    const [useExistingCustomer, setUseExistingCustomer] = useState(true)
    const [selectedCustomerId, setSelectedCustomerId] = useState('')
    const [selectedSalesConsultantId, setSelectedSalesConsultantId] = useState('')
    const [selectedParentOrderId, setSelectedParentOrderId] = useState('')
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

    // Fetch parent orders for SSH if customer is selected
    const { data: parentOrders = [] } = useGetOrdersByCustomerQuery(selectedCustomerId, {
        skip: orderType !== 'AFTER_SALES_SERVICE' || !selectedCustomerId
    })

    // Apply prefill data on mount
    useEffect(() => {
        if (prefillData) {
            if (prefillData.orderType) setOrderType(prefillData.orderType)
            if (prefillData.customerId) {
                setSelectedCustomerId(prefillData.customerId)
                setUseExistingCustomer(true)
            }
            if (prefillData.salesConsultantId) setSelectedSalesConsultantId(prefillData.salesConsultantId)
            if (prefillData.brand) setSelectedBrand(prefillData.brand as Brand)
            if (prefillData.parentOrderId) setSelectedParentOrderId(prefillData.parentOrderId)
        }
    }, [prefillData])

    const [formData, setFormData] = useState({
        orderNo: '',
        prosapContractNo: '',
        prosapContractNameSurname: '',
        orderDate: new Date().toISOString().split('T')[0],
    })

    const [customerData, setCustomerData] = useState<CustomerRequest>({
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

    const [products, setProducts] = useState<ProductWithPricing[]>([{
        productCode: '',
        productName: '',
        quantity: 1,
        showPricing: false,
    }])

    // Update Prosap Contract Name when customer is selected
    useEffect(() => {
        if (useExistingCustomer && selectedCustomerId) {
            const selectedCustomer = customers.find(c => c.id === selectedCustomerId)
            if (selectedCustomer) {
                setFormData(prev => ({
                    ...prev,
                    prosapContractNameSurname: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                }))
            }
        } else if (!useExistingCustomer && customerData.firstName && customerData.lastName) {
            setFormData(prev => ({
                ...prev,
                prosapContractNameSurname: `${customerData.firstName} ${customerData.lastName}`
            }))
        }
    }, [selectedCustomerId, customerData.firstName, customerData.lastName, useExistingCustomer, customers])

    const handleAddProduct = () => {
        setProducts([...products, {
            productCode: '',
            productName: '',
            quantity: 1,
            showPricing: false,
        }])
    }

    const handleRemoveProduct = (index: number) => {
        if (products.length > 1) {
            setProducts(products.filter((_, i) => i !== index))
        }
    }

    const handleProductChange = (index: number, field: string, value: any) => {
        const newProducts = [...products]
        newProducts[index] = { ...newProducts[index], [field]: value }
        setProducts(newProducts)
    }

    const handleParentOrderChange = (orderId: string) => {
        setSelectedParentOrderId(orderId)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const orderData: any = {
            orderNo: formData.orderNo,
            prosapContractNameSurname: formData.prosapContractNameSurname,
            orderDate: formData.orderDate,
            orderType: orderType,
            products: products.map(p => {
                const product: any = {
                    productCode: p.productCode,
                    productName: p.productName,
                    quantity: Number(p.quantity),
                    brand: selectedBrand,
                }

                // Add pricing fields if enabled
                if (p.showPricing) {
                    if (p.grossPrice) product.grossPrice = p.grossPrice
                    if (p.netPrice) product.netPrice = p.netPrice
                    if (p.fixedDiscount) product.fixedDiscount = p.fixedDiscount
                    if (p.cashDiscount) product.cashDiscount = p.cashDiscount
                    if (p.displayDiscount) product.displayDiscount = p.displayDiscount
                    if (p.discount1) product.discount1 = p.discount1
                    if (p.discount2) product.discount2 = p.discount2
                    if (p.discount3) product.discount3 = p.discount3
                    if (p.discount4) product.discount4 = p.discount4
                    if (p.discount5) product.discount5 = p.discount5
                    if (p.vat) product.vat = p.vat
                    if (p.paymentCondition) product.paymentCondition = p.paymentCondition
                    if (p.paymentConditionDefinition) product.paymentConditionDefinition = p.paymentConditionDefinition
                }

                return product
            }),
        }

        // Add customer data (for all order types now)
        if (useExistingCustomer && selectedCustomerId) {
            orderData.customerId = selectedCustomerId
        } else if (!useExistingCustomer) {
            orderData.customerData = customerData
        }

        // Add fields based on order type
        if (orderType === 'CUSTOMER_SPECIFIC') {
            orderData.prosapContractNo = formData.prosapContractNo
            if (selectedSalesConsultantId) {
                orderData.salesConsultantId = selectedSalesConsultantId
            }
        } else if (orderType === 'AFTER_SALES_SERVICE') {
            if (selectedParentOrderId) {
                orderData.parentOrderId = selectedParentOrderId
            }
            // Add SSH linkage for problematic shipment
            if (prefillData?.linkedShipmentId) {
                orderData.linkedShipmentId = prefillData.linkedShipmentId
                orderData.hidden = true
            }
        }

        try {
            await createOrder(orderData).unwrap()
            onSuccess?.()
            onClose() // Close modal after successful creation
        } catch (error: any) {
            console.error('Failed to create order:', error)

            // Extract error message from different error formats
            let errorMessage = 'Sipariş oluşturulurken bir hata oluştu'

            if (error?.data?.message) {
                errorMessage = error.data.message
            } else if (error?.data?.details) {
                errorMessage = error.data.details
            } else if (error?.message) {
                errorMessage = error.message
            }

            alert(errorMessage)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                        <Plus className="w-6 h-6" />
                        Manuel Sipariş Ekle
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-amber-700" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="p-6 space-y-6">
                        {/* Order Type Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-amber-900">Sipariş Tipi</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setOrderType('CUSTOMER_SPECIFIC')}
                                    className={`px-4 py-3 rounded-lg transition-all text-sm font-medium ${orderType === 'CUSTOMER_SPECIFIC'
                                        ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-md'
                                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                                        }`}
                                >
                                    Müşteri Özel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOrderType('STOCK')}
                                    className={`px-4 py-3 rounded-lg transition-all text-sm font-medium ${orderType === 'STOCK'
                                        ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-md'
                                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                                        }`}
                                >
                                    Stok
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOrderType('AFTER_SALES_SERVICE')}
                                    className={`px-4 py-3 rounded-lg transition-all text-sm font-medium ${orderType === 'AFTER_SALES_SERVICE'
                                        ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-md'
                                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                                        }`}
                                >
                                    SSH
                                </button>
                            </div>
                        </div>

                        {/* Brand Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-amber-900">Marka Seçimi *</h3>
                            <p className="text-sm text-amber-700">
                                Seçilen marka, bu siparişte ekleyeceğiniz tüm ürünlere uygulanacaktır.
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                {BRANDS.map(brand => (
                                    <button
                                        key={brand}
                                        type="button"
                                        onClick={() => setSelectedBrand(brand)}
                                        className={`px-4 py-3 rounded-lg font-medium transition-all ${selectedBrand === brand
                                            ? 'ring-2 ring-offset-2 shadow-lg transform scale-105'
                                            : 'hover:shadow-md hover:scale-102'
                                            }`}
                                        style={{
                                            backgroundColor: selectedBrand === brand ? getBrandColor(brand) : '#fff',
                                            color: selectedBrand === brand ? '#fff' : getBrandColor(brand),
                                            borderColor: getBrandColor(brand),
                                            borderWidth: '2px',
                                            ringColor: getBrandColor(brand)
                                        }}
                                    >
                                        {getBrandLabel(brand)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Customer Selection - FOR ALL ORDER TYPES */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-amber-900">Müşteri Bilgileri</h3>
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
                                {/* Toggle between existing/new customer */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setUseExistingCustomer(true)}
                                        className={`flex-1 px-4 py-2 rounded-lg transition-all ${useExistingCustomer
                                            ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-md'
                                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                            }`}
                                    >
                                        <User className="w-4 h-4 inline mr-2" />
                                        Mevcut Müşteri
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUseExistingCustomer(false)}
                                        className={`flex-1 px-4 py-2 rounded-lg transition-all ${!useExistingCustomer
                                            ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-md'
                                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                            }`}
                                    >
                                        <Plus className="w-4 h-4 inline mr-2" />
                                        Yeni Müşteri
                                    </button>
                                </div>

                                {useExistingCustomer ? (
                                    <div>
                                        <label className="block text-sm font-medium text-amber-800 mb-2">
                                            Müşteri Seç *
                                        </label>
                                        <select
                                            value={selectedCustomerId}
                                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="">Müşteri seçiniz...</option>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.firstName} {customer.lastName}
                                                    {customer.phone && ` - ${customer.phone}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-amber-700 mb-1">Ad *</label>
                                            <input
                                                type="text"
                                                required={!useExistingCustomer}
                                                value={customerData.firstName}
                                                onChange={(e) => setCustomerData({ ...customerData, firstName: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-amber-700 mb-1">Soyad *</label>
                                            <input
                                                type="text"
                                                required={!useExistingCustomer}
                                                value={customerData.lastName}
                                                onChange={(e) => setCustomerData({ ...customerData, lastName: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-amber-700 mb-1">Telefon</label>
                                            <input
                                                type="tel"
                                                value={customerData.phone}
                                                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-amber-700 mb-1">E-posta</label>
                                            <input
                                                type="email"
                                                value={customerData.email}
                                                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-amber-700 mb-1">TC No</label>
                                            <input
                                                type="text"
                                                value={customerData.tcNo}
                                                onChange={(e) => setCustomerData({ ...customerData, tcNo: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-amber-700 mb-1">Şehir</label>
                                            <SearchableSelect
                                                value={customerData.city}
                                                onChange={(value) => {
                                                    setCustomerData({ ...customerData, city: value, district: '', neighborhood: '' })
                                                }}
                                                options={cities}
                                                placeholder="Şehir seçiniz..."
                                                className="text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-amber-700 mb-1">İlçe</label>
                                            <SearchableSelect
                                                value={customerData.district}
                                                onChange={(value) => {
                                                    setCustomerData({ ...customerData, district: value, neighborhood: '' })
                                                }}
                                                options={customerData.city ? (districts[customerData.city] || []) : []}
                                                placeholder={customerData.city ? "İlçe seçiniz..." : "Önce şehir seçin"}
                                                className="text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-amber-700 mb-1">Mahalle</label>
                                            <input
                                                type="text"
                                                value={customerData.neighborhood}
                                                onChange={(e) => setCustomerData({ ...customerData, neighborhood: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs text-amber-700 mb-1">Tam Adres</label>
                                            <textarea
                                                rows={2}
                                                value={customerData.fullAddress}
                                                onChange={(e) => setCustomerData({ ...customerData, fullAddress: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Order Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-amber-900">Sipariş Bilgileri</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-amber-800 mb-2">
                                        Sipariş No *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.orderNo}
                                        onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="ORD-001"
                                    />
                                </div>

                                {/* Customer Specific: Contract No */}
                                {orderType === 'CUSTOMER_SPECIFIC' && (
                                    <div>
                                        <label className="block text-sm font-medium text-amber-800 mb-2">
                                            Sözleşme No *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.prosapContractNo}
                                            onChange={(e) => setFormData({ ...formData, prosapContractNo: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="CTR-001"
                                        />
                                    </div>
                                )}

                                {/* SSH: Parent Order Selection */}
                                {orderType === 'AFTER_SALES_SERVICE' && selectedCustomerId && parentOrders.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-amber-800 mb-2">
                                            Bağlı Sipariş
                                        </label>
                                        <select
                                            value={selectedParentOrderId}
                                            onChange={(e) => handleParentOrderChange(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="">Bağlı sipariş seçiniz (opsiyonel)</option>
                                            {parentOrders.map((order) => (
                                                <option key={order.id} value={order.id}>
                                                    {order.prosapContractNo || order.orderNo} - {order.orderDate}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className={orderType === 'STOCK' || (orderType === 'AFTER_SALES_SERVICE' && (!selectedCustomerId || parentOrders.length === 0)) ? 'col-span-1' : ''}>
                                    <label className="block text-sm font-medium text-amber-800 mb-2">
                                        Prosap Sözleşme Ad Soyad *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.prosapContractNameSurname}
                                        onChange={(e) => setFormData({ ...formData, prosapContractNameSurname: e.target.value })}
                                        disabled={(useExistingCustomer && selectedCustomerId !== '') || (!useExistingCustomer && customerData.firstName && customerData.lastName)}
                                        className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                        placeholder="Müşteri seçince otomatik dolacak"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-amber-800 mb-2">
                                        Sipariş Tarihi *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.orderDate}
                                        onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                {/* Sales Consultant (Customer Specific Only) */}
                                {orderType === 'CUSTOMER_SPECIFIC' && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-amber-800 mb-2">
                                            Satış Danışmanı
                                        </label>
                                        <select
                                            value={selectedSalesConsultantId}
                                            onChange={(e) => setSelectedSalesConsultantId(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="">Satış danışmanı seçiniz (opsiyonel)</option>
                                            {salesConsultants.map((consultant) => (
                                                <option key={consultant.id} value={consultant.id}>
                                                    {consultant.firstName && consultant.lastName
                                                        ? `${consultant.firstName} ${consultant.lastName}`
                                                        : consultant.email
                                                    }
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Products */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-amber-900">Ürünler</h3>
                                <button
                                    type="button"
                                    onClick={handleAddProduct}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-700 to-emerald-700 text-white rounded-lg hover:from-green-800 hover:to-emerald-800 transition-all shadow-md"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ürün Ekle
                                </button>
                            </div>

                            <div className="space-y-3">
                                {products.map((product, index) => (
                                    <div key={index} className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-amber-800">Ürün #{index + 1}</span>
                                            {products.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveProduct(index)}
                                                    className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs text-purple-300 mb-1">Ürün Kodu *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={product.productCode}
                                                    onChange={(e) => handleProductChange(index, 'productCode', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    placeholder="PRD-001"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-purple-300 mb-1">Ürün Adı *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={product.productName}
                                                    onChange={(e) => handleProductChange(index, 'productName', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    placeholder="Ürün Adı"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-purple-300 mb-1">Miktar *</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={product.quantity}
                                                    onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                />
                                            </div>
                                        </div>

                                        {/* Price Info Checkbox */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                id={`showPricing-${index}`}
                                                checked={product.showPricing}
                                                onChange={(e) => handleProductChange(index, 'showPricing', e.target.checked)}
                                                className="w-4 h-4 rounded border-purple-400 text-purple-600 focus:ring-purple-500 focus:ring-2"
                                            />
                                            <label htmlFor={`showPricing-${index}`} className="text-sm text-amber-700 cursor-pointer">
                                                Fiyat Bilgisi Gir
                                            </label>
                                        </div>

                                        {/* Price Fields */}
                                        {product.showPricing && (
                                            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                                                <div>
                                                    <label className="block text-xs text-purple-300 mb-1">Brüt Fiyat</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={product.grossPrice || ''}
                                                        onChange={(e) => handleProductChange(index, 'grossPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-purple-300 mb-1">Net Fiyat</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={product.netPrice || ''}
                                                        onChange={(e) => handleProductChange(index, 'netPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-purple-300 mb-1">Sabit İskonto</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={product.fixedDiscount || ''}
                                                        onChange={(e) => handleProductChange(index, 'fixedDiscount', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-purple-300 mb-1">Peşin İskonto</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={product.cashDiscount || ''}
                                                        onChange={(e) => handleProductChange(index, 'cashDiscount', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-purple-300 mb-1">Teşhir İskonto</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={product.displayDiscount || ''}
                                                        onChange={(e) => handleProductChange(index, 'displayDiscount', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-purple-300 mb-1">İskonto 1</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={product.discount1 || ''}
                                                        onChange={(e) => handleProductChange(index, 'discount1', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-purple-300 mb-1">İskonto 2</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={product.discount2 || ''}
                                                        onChange={(e) => handleProductChange(index, 'discount2', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-purple-300 mb-1">İskonto 3</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={product.discount3 || ''}
                                                        onChange={(e) => handleProductChange(index, 'discount3', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-purple-300 mb-1">İskonto 4</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={product.discount4 || ''}
                                                        onChange={(e) => handleProductChange(index, 'discount4', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-purple-300 mb-1">İskonto 5</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={product.discount5 || ''}
                                                        onChange={(e) => handleProductChange(index, 'discount5', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-purple-300 mb-1">KDV (%)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={product.vat || ''}
                                                        onChange={(e) => handleProductChange(index, 'vat', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-purple-300 mb-1">Ödeme Koşulu</label>
                                                    <input
                                                        type="text"
                                                        value={product.paymentCondition || ''}
                                                        onChange={(e) => handleProductChange(index, 'paymentCondition', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <label className="block text-xs text-purple-300 mb-1">Ödeme Koşulu Tanımı</label>
                                                    <input
                                                        type="text"
                                                        value={product.paymentConditionDefinition || ''}
                                                        onChange={(e) => handleProductChange(index, 'paymentConditionDefinition', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
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
                            disabled={isLoading}
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
