import { useState, useEffect } from 'react'
import { X, Upload, FileSpreadsheet, CheckCircle, Save, AlertCircle, Loader, Edit, ChevronDown, ChevronUp, Package, Plus, Trash2 } from 'lucide-react'
import { useExtractFromExcelMutation, useCreateOrderMutation, type OrderGroupData } from '../../services/orderApi'
import { type CustomerResponse } from '../../services/customerApi'
import axiosInstance from '../../services/axiosInstance'
import { BRANDS, getBrandLabel, getBrandColor, type Brand } from '../../constants/brandConstants'

interface Props {
    onClose: () => void
    onSuccess: () => void
}

type OrderStatus = 'pending' | 'processing' | 'success' | 'error'

type CustomerMatchStatus = 'searching' | 'exact' | 'none' | 'multiple' | 'selected'

interface OrderWithStatus extends OrderGroupData {
    status: OrderStatus
    errorMessage?: string
    orderType?: 'STOCK' | 'CUSTOMER_SPECIFIC' | 'AFTER_SALES_SERVICE'
    salesConsultantId?: string
    // Customer matching
    customerMatchStatus?: CustomerMatchStatus
    matchedCustomers?: CustomerResponse[]
    selectedCustomerId?: string
}

export default function BulkUploadModal({ onClose, onSuccess }: Props) {
    const [extractFromExcel, { isLoading: isExtracting }] = useExtractFromExcelMutation()
    const [createOrder] = useCreateOrderMutation()

    const [file, setFile] = useState<File | null>(null)
    const [ordersWithStatus, setOrdersWithStatus] = useState<OrderWithStatus[]>([])
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
    const [step, setStep] = useState<'upload' | 'select' | 'processing'>('upload')
    const [error, setError] = useState<string>('')
    const [isSaving, setIsSaving] = useState(false)
    const [editingOrder, setEditingOrder] = useState<OrderWithStatus | null>(null)
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
    const [tempEditedOrder, setTempEditedOrder] = useState<OrderWithStatus | null>(null)
    const [salesConsultants, setSalesConsultants] = useState<{ id: string; name: string }[]>([])
    const [customerSearchQueries, setCustomerSearchQueries] = useState<Map<string, string>>(new Map())
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)

    // Load sales consultants on mount
    useEffect(() => {
        const loadSalesConsultants = async () => {
            try {
                const response = await axiosInstance.get('/users/sales-consultants')
                setSalesConsultants(response.data.map((user: any) => ({
                    id: user.id,
                    name: `${user.firstName} ${user.lastName}`
                })))
            } catch (err) {
                console.error('Failed to load sales consultants:', err)
            }
        }
        loadSalesConsultants()
    }, [])

    // Perform customer search for all orders with queries
    useEffect(() => {
        const searchCustomers = async () => {
            if (customerSearchQueries.size === 0) return

            // Process each query
            for (const [orderNo, query] of customerSearchQueries.entries()) {
                try {
                    const response = await axiosInstance.get(`/customers/search?query=${encodeURIComponent(query)}`)
                    const customers: CustomerResponse[] = response.data

                    setOrdersWithStatus(prev => prev.map(o => {
                        if (o.orderNo !== orderNo) return o

                        if (customers.length === 0) {
                            return { ...o, customerMatchStatus: 'none', matchedCustomers: [] }
                        } else if (customers.length === 1) {
                            return {
                                ...o,
                                customerMatchStatus: 'exact',
                                matchedCustomers: customers,
                                selectedCustomerId: customers[0].id
                            }
                        } else {
                            return { ...o, customerMatchStatus: 'multiple', matchedCustomers: customers }
                        }
                    }))
                } catch (error) {
                    console.error(`Failed to search customers for order ${orderNo}:`, error)
                    setOrdersWithStatus(prev => prev.map(o =>
                        o.orderNo === orderNo ? { ...o, customerMatchStatus: 'none', matchedCustomers: [] } : o
                    ))
                }
            }
        }

        searchCustomers()
    }, [customerSearchQueries])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            setError('')
        }
    }

    const handleExtract = async () => {
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            const result = await extractFromExcel(formData).unwrap()

            if (result.extractionStatus === 'ERROR') {
                setError(result.message || 'Excel dosyası işlenirken hata oluştu')
                return
            }

            const ordersWithInitialStatus: OrderWithStatus[] = result.orders.map(o => ({
                ...o,
                status: 'pending' as OrderStatus,
                orderType: (o.prosapContractNo && o.prosapContractNo.trim()) ? 'CUSTOMER_SPECIFIC' as const : 'STOCK' as const,
                salesConsultantId: undefined,
                customerMatchStatus: 'searching' as CustomerMatchStatus,
                matchedCustomers: [],
                selectedCustomerId: undefined
            }))

            setOrdersWithStatus(ordersWithInitialStatus)
            setSelectedOrders(new Set(result.orders.map(o => o.orderNo)))

            // Start customer matching for each order
            const queries = new Map<string, string>()
            result.orders.forEach(o => {
                if (o.prosapContractNameSurname && o.prosapContractNameSurname.trim()) {
                    queries.set(o.orderNo, o.prosapContractNameSurname.trim())
                }
            })
            setCustomerSearchQueries(queries)

            setStep('select')
        } catch (err) {
            console.error('Failed to extract Excel:', err)
            setError('Excel dosyası yüklenirken bir hata oluştu')
        }
    }

    const toggleOrderSelection = (orderNo: string) => {
        const newSelected = new Set(selectedOrders)
        if (newSelected.has(orderNo)) {
            newSelected.delete(orderNo)
        } else {
            newSelected.add(orderNo)
        }
        setSelectedOrders(newSelected)
    }

    const toggleAllOrders = () => {
        if (selectedOrders.size === ordersWithStatus.length) {
            setSelectedOrders(new Set())
        } else {
            setSelectedOrders(new Set(ordersWithStatus.map(o => o.orderNo)))
        }
    }

    const handleSaveSelected = async () => {
        setStep('processing')
        setIsSaving(true)

        let hasAnyErrors = false

        for (const order of ordersWithStatus) {
            if (!selectedOrders.has(order.orderNo)) continue

            setOrdersWithStatus(prev => prev.map(o =>
                o.orderNo === order.orderNo ? { ...o, status: 'processing' } : o
            ))

            try {
                const requestData: any = {
                    orderNo: order.orderNo,
                    prosapContractNo: order.prosapContractNo,
                    prosapContractNameSurname: order.prosapContractNameSurname,
                    orderDate: order.orderDate,
                    orderType: order.orderType || 'STOCK',
                    salesConsultantId: order.salesConsultantId,
                    shipmentNote: order.shipmentNote || undefined,
                    products: order.products.map(p => ({
                        productCode: p.productCode,
                        productName: p.productName,
                        quantity: p.quantity,
                        brand: selectedBrand,
                        // Include all price/discount fields
                        specName: p.specName,
                        productGroupDefinition: p.productGroupDefinition,
                        warehouseLocation: p.warehouseLocation,
                        productionLocationName: p.productionLocationName,
                        grossPrice: p.grossPrice,
                        netPrice: p.netPrice,
                        fixedDiscount: p.fixedDiscount,
                        cashDiscount: p.cashDiscount,
                        displayDiscount: p.displayDiscount,
                        discount1: p.discount1,
                        discount2: p.discount2,
                        discount3: p.discount3,
                        discount4: p.discount4,
                        discount5: p.discount5,
                        vat: p.vat,
                        paymentCondition: p.paymentCondition,
                        paymentConditionDefinition: p.paymentConditionDefinition,
                    }))
                }

                // Handle customer matching for CUSTOMER_SPECIFIC orders
                if (order.orderType === 'CUSTOMER_SPECIFIC') {
                    if (order.selectedCustomerId && order.selectedCustomerId !== 'create_new') {
                        // Use existing customer
                        requestData.customerId = order.selectedCustomerId
                    } else if (order.selectedCustomerId === 'create_new' || order.customerMatchStatus === 'none') {
                        // Create new customer from prosapContractNameSurname
                        const nameParts = (order.prosapContractNameSurname || '').trim().split(' ')
                        const firstName = nameParts[0] || 'Müşteri'
                        const lastName = nameParts.slice(1).join(' ') || '-'

                        requestData.customerData = {
                            firstName,
                            lastName
                        }
                    }
                }

                await createOrder(requestData).unwrap()

                setOrdersWithStatus(prev => prev.map(o =>
                    o.orderNo === order.orderNo ? { ...o, status: 'success' } : o
                ))

                await new Promise(resolve => setTimeout(resolve, 300))

            } catch (err: any) {
                hasAnyErrors = true
                const errorMessage = err?.data?.detail || err?.message || 'Bilinmeyen hata'
                setOrdersWithStatus(prev => prev.map(o =>
                    o.orderNo === order.orderNo
                        ? { ...o, status: 'error', errorMessage }
                        : o
                ))
            }
        }

        setIsSaving(false)

        if (!hasAnyErrors) {
            setTimeout(() => onSuccess(), 500)
        }
    }

    const handleRetryFailed = async () => {
        const failedOrders = ordersWithStatus.filter(o => o.status === 'error')
        setIsSaving(true)

        for (const order of failedOrders) {
            setOrdersWithStatus(prev => prev.map(o =>
                o.orderNo === order.orderNo ? { ...o, status: 'processing' } : o
            ))

            try {
                const requestData: any = {
                    orderNo: order.orderNo,
                    prosapContractNo: order.prosapContractNo,
                    prosapContractNameSurname: order.prosapContractNameSurname,
                    orderDate: order.orderDate,
                    orderType: order.orderType || 'STOCK',
                    salesConsultantId: order.salesConsultantId,
                    shipmentNote: order.shipmentNote || undefined,
                    products: order.products.map(p => ({
                        productCode: p.productCode,
                        productName: p.productName,
                        quantity: p.quantity,
                        brand: selectedBrand,
                        // Include all price/discount fields
                        specName: p.specName,
                        productGroupDefinition: p.productGroupDefinition,
                        warehouseLocation: p.warehouseLocation,
                        productionLocationName: p.productionLocationName,
                        grossPrice: p.grossPrice,
                        netPrice: p.netPrice,
                        fixedDiscount: p.fixedDiscount,
                        cashDiscount: p.cashDiscount,
                        displayDiscount: p.displayDiscount,
                        discount1: p.discount1,
                        discount2: p.discount2,
                        discount3: p.discount3,
                        discount4: p.discount4,
                        discount5: p.discount5,
                        vat: p.vat,
                        paymentCondition: p.paymentCondition,
                        paymentConditionDefinition: p.paymentConditionDefinition,
                    }))
                }

                // Handle customer matching for CUSTOMER_SPECIFIC orders
                if (order.orderType === 'CUSTOMER_SPECIFIC') {
                    if (order.selectedCustomerId && order.selectedCustomerId !== 'create_new') {
                        // Use existing customer
                        requestData.customerId = order.selectedCustomerId
                    } else if (order.selectedCustomerId === 'create_new' || order.customerMatchStatus === 'none') {
                        // Create new customer from prosapContractNameSurname
                        const nameParts = (order.prosapContractNameSurname || '').trim().split(' ')
                        const firstName = nameParts[0] || 'Müşteri'
                        const lastName = nameParts.slice(1).join(' ') || '-'

                        requestData.customerData = {
                            firstName,
                            lastName
                        }
                    }
                }

                await createOrder(requestData).unwrap()

                setOrdersWithStatus(prev => prev.map(o =>
                    o.orderNo === order.orderNo ? { ...o, status: 'success', errorMessage: undefined } : o
                ))

                await new Promise(resolve => setTimeout(resolve, 300))

            } catch (err: any) {
                const errorMessage = err?.data?.detail || err?.message || 'Bilinmeyen hata'
                setOrdersWithStatus(prev => prev.map(o =>
                    o.orderNo === order.orderNo ? { ...o, errorMessage } : o
                ))
            }
        }

        setIsSaving(false)

        const stillHasErrors = ordersWithStatus.some(o => o.status === 'error')
        if (!stillHasErrors) {
            setTimeout(() => onSuccess(), 500)
        }
    }

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case 'pending':
                return null
            case 'processing':
                return <Loader className="w-5 h-5 text-blue-400 animate-spin" />
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-400" />
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-400" />
        }
    }

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-50 border-amber-200'
            case 'processing':
                return 'bg-blue-500/20 border-blue-400/50 animate-pulse'
            case 'success':
                return 'bg-green-500/20 border-green-400/50'
            case 'error':
                return 'bg-red-500/20 border-red-400/50'
        }
    }

    const successCount = ordersWithStatus.filter(o => o.status === 'success').length
    const errorCount = ordersWithStatus.filter(o => o.status === 'error').length
    const processingCount = ordersWithStatus.filter(o => o.status === 'processing').length

    const handleEditOrder = () => {
        if (!editingOrder || !tempEditedOrder) return

        const oldOrderNo = editingOrder.orderNo
        setOrdersWithStatus(prev => prev.map(o =>
            o.orderNo === oldOrderNo
                ? { ...tempEditedOrder, status: 'pending' as OrderStatus, errorMessage: undefined }
                : o
        ))

        // Update selected orders set if it contained the old order
        if (selectedOrders.has(oldOrderNo)) {
            const newSelected = new Set(selectedOrders)
            newSelected.delete(oldOrderNo)
            newSelected.add(tempEditedOrder.orderNo)
            setSelectedOrders(newSelected)
        }

        setEditingOrder(null)
        setTempEditedOrder(null)
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                        <Upload className="w-6 h-6" />
                        Dosyadan Toplu Sipariş Ekle
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        disabled={isSaving}
                    >
                        <X className="w-6 h-6 text-amber-700" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
                    {step === 'upload' ? (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-amber-300 rounded-xl p-12 text-center">
                                <input
                                    type="file"
                                    id="excel-file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="excel-file"
                                    className="cursor-pointer inline-flex flex-col items-center gap-4"
                                >
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                                        <FileSpreadsheet className="w-10 h-10 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-amber-900 mb-2">
                                            {file ? file.name : 'Excel dosyası seçin'}
                                        </p>
                                        <p className="text-sm text-amber-700">
                                            .xlsx veya .xls formatında dosya yükleyin
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-200">{error}</p>
                                </div>
                            )}
                        </div>
                    ) : step === 'select' || step === 'processing' ? (
                        <div className="space-y-4">
                            {/* Brand Selection - After extraction */}
                            {step === 'select' && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                                    <label className="block text-sm font-semibold text-amber-900 mb-3">
                                        Marka Seçimi *
                                    </label>
                                    <p className="text-xs text-amber-700 mb-4">
                                        Seçilen marka, tüm siparişlerdeki tüm ürünlere uygulanacaktır.
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
                                                    borderWidth: '2px'
                                                }}
                                            >
                                                {getBrandLabel(brand)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                                <div>
                                    {step === 'select' ? (
                                        <>
                                            <p className="text-amber-900 font-semibold">
                                                Toplam {ordersWithStatus.length} sipariş bulundu
                                            </p>
                                            <p className="text-sm text-amber-700">
                                                {selectedOrders.size} sipariş seçildi
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-amber-900 font-semibold">
                                                İşlem Durumu
                                            </p>
                                            <div className="flex gap-4 text-sm mt-1">
                                                <span className="text-green-300">✓ {successCount} Başarılı</span>
                                                {processingCount > 0 && <span className="text-blue-300">⟳ {processingCount} İşleniyor</span>}
                                                {errorCount > 0 && <span className="text-red-300">✗ {errorCount} Hatalı</span>}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {step === 'select' && (
                                    <button
                                        onClick={toggleAllOrders}
                                        className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
                                    >
                                        {selectedOrders.size === ordersWithStatus.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {ordersWithStatus.map((order) => (
                                    <div
                                        key={order.orderNo}
                                        className={`p-4 border rounded-xl transition-all ${getStatusColor(order.status)} ${step === 'select' && selectedOrders.has(order.orderNo)
                                            ? ''
                                            : ''
                                            } ${step === 'select' ? 'cursor-pointer' : ''}`}
                                        onClick={() => step === 'select' && toggleOrderSelection(order.orderNo)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {step === 'select' ? (
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 ${selectedOrders.has(order.orderNo)
                                                    ? 'bg-blue-500 border-blue-400'
                                                    : 'border-white/30'
                                                    }`}>
                                                    {selectedOrders.has(order.orderNo) && (
                                                        <CheckCircle className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                                                    {getStatusIcon(order.status)}
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                                    <div>
                                                        <p className="text-xs text-amber-700">Sipariş No</p>
                                                        <p className="text-amber-900 font-medium">{order.orderNo}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-amber-700">Sözleşme No</p>
                                                        <p className="text-amber-900">{order.prosapContractNo}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-amber-700 mb-2">Müşteri</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-amber-900">{order.prosapContractNameSurname}</p>
                                                            {order.customerMatchStatus === 'searching' && (
                                                                <span className="text-xs text-blue-300">🔍 Aranıyor...</span>
                                                            )}
                                                            {order.customerMatchStatus === 'exact' && (
                                                                <span className="text-xs text-green-300">✓ Eşleşti</span>
                                                            )}
                                                            {order.customerMatchStatus === 'none' && (
                                                                <span className="text-xs text-blue-300">🆕 Yeni Müşteri</span>
                                                            )}
                                                            {order.customerMatchStatus === 'multiple' && (
                                                                <span className="text-xs text-orange-300">⚠ {order.matchedCustomers?.length} eşleşme</span>
                                                            )}
                                                            {order.customerMatchStatus === 'selected' && (
                                                                <span className="text-xs text-green-300">✓ Seçildi</span>
                                                            )}
                                                        </div>

                                                        {/* Customer selection dropdown for multiple matches */}
                                                        {(order.customerMatchStatus === 'multiple' || order.customerMatchStatus === 'selected') && order.matchedCustomers && order.matchedCustomers.length > 1 && (
                                                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                                                <select
                                                                    value={order.selectedCustomerId || ''}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation()
                                                                        const customerId = e.target.value
                                                                        setOrdersWithStatus(prev => prev.map(o =>
                                                                            o.orderNo === order.orderNo
                                                                                ? { ...o, selectedCustomerId: customerId || undefined, customerMatchStatus: customerId ? 'selected' : 'multiple' }
                                                                                : o
                                                                        ))
                                                                    }}
                                                                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                                    style={{ colorScheme: 'dark' }}
                                                                >
                                                                    <option value="">-- Müşteri Seçin --</option>
                                                                    {order.matchedCustomers.map(customer => (
                                                                        <option key={customer.id} value={customer.id}>
                                                                            {customer.firstName} {customer.lastName} {customer.phone ? `(${customer.phone})` : ''}
                                                                        </option>
                                                                    ))}
                                                                    <option value="create_new">--- Yeni Müşteri Oluştur ---</option>
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-amber-700">Tarih</p>
                                                        <p className="text-amber-900">{new Date(order.orderDate).toLocaleDateString('tr-TR')}</p>
                                                    </div>
                                                    {order.shipmentNote && (
                                                        <div className="col-span-2 md:col-span-4">
                                                            <p className="text-xs text-amber-700">Sevkiyat Notu</p>
                                                            <p className="text-amber-900 text-sm">{order.shipmentNote}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Order Type Selection */}
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <label className="block text-xs font-medium text-amber-700 mb-1.5">Sipariş Tipi</label>
                                                            <select
                                                                value={order.orderType || 'STOCK'}
                                                                onChange={(e) => {
                                                                    e.stopPropagation()
                                                                    setOrdersWithStatus(prev => prev.map(o =>
                                                                        o.orderNo === order.orderNo
                                                                            ? { ...o, orderType: e.target.value as any, salesConsultantId: e.target.value === 'CUSTOMER_SPECIFIC' ? o.salesConsultantId : undefined }
                                                                            : o
                                                                    ))
                                                                }}
                                                                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                                                                style={{ colorScheme: 'dark' }}
                                                            >
                                                                <option value="STOCK" className="bg-white text-amber-900 py-2">Stok Siparişi</option>
                                                                <option value="CUSTOMER_SPECIFIC" className="bg-white text-amber-900 py-2">Müşteriye Özel</option>
                                                                <option value="AFTER_SALES_SERVICE" className="bg-white text-amber-900 py-2">Satış Sonrası Hizmet</option>
                                                            </select>
                                                        </div>
                                                        {order.orderType === 'CUSTOMER_SPECIFIC' && (
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <label className="block text-xs font-medium text-amber-700 mb-1.5">Satış Danışmanı (Opsiyonel)</label>
                                                                <select
                                                                    value={order.salesConsultantId || ''}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation()
                                                                        setOrdersWithStatus(prev => prev.map(o =>
                                                                            o.orderNo === order.orderNo ? { ...o, salesConsultantId: e.target.value || undefined } : o
                                                                        ))
                                                                    }}
                                                                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                                                                    style={{ colorScheme: 'dark' }}
                                                                >
                                                                    <option value="" className="bg-white text-gray-600 py-2">Seç...</option>
                                                                    {salesConsultants.map(sc => (
                                                                        <option key={sc.id} value={sc.id} className="bg-white text-amber-900 py-2">{sc.name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-3 mt-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                                                            {order.products.length} Ürün
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                const newExpanded = new Set(expandedOrders)
                                                                if (newExpanded.has(order.orderNo)) {
                                                                    newExpanded.delete(order.orderNo)
                                                                } else {
                                                                    newExpanded.add(order.orderNo)
                                                                }
                                                                setExpandedOrders(newExpanded)
                                                            }}
                                                            className="px-3 py-1 bg-amber-200 text-amber-900 rounded text-xs hover:bg-amber-300 transition-colors flex items-center gap-1 font-medium"
                                                        >
                                                            <Package className="w-3 h-3" />
                                                            {expandedOrders.has(order.orderNo) ? (
                                                                <>
                                                                    <ChevronUp className="w-3 h-3" />
                                                                    Gizle
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown className="w-3 h-3" />
                                                                    Detay
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setEditingOrder(order)
                                                            setTempEditedOrder({ ...order })
                                                        }}
                                                        className="px-3 py-1 bg-green-200 text-green-900 rounded text-xs hover:bg-green-300 transition-colors flex items-center gap-1 font-medium"
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                        Düzenle
                                                    </button>
                                                </div>

                                                {order.status === 'error' && order.errorMessage && (
                                                    <div className="mt-2 p-2 bg-red-500/10 border border-red-400/30 rounded text-xs text-red-300">
                                                        ⚠️ {order.errorMessage}
                                                    </div>
                                                )}

                                                {expandedOrders.has(order.orderNo) && (
                                                    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                                                        <p className="text-xs font-semibold text-amber-800 mb-2">Ürün Detayları:</p>
                                                        {order.products.map((product, idx) => (
                                                            <div key={idx} className="p-3 bg-amber-50 rounded-lg">
                                                                <div className="grid grid-cols-3 gap-2 text-xs">
                                                                    <div>
                                                                        <p className="text-amber-700">Ürün Kodu</p>
                                                                        <p className="text-amber-900 font-medium">{product.productCode}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-amber-700">Ürün Adı</p>
                                                                        <p className="text-amber-900">{product.productName}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-amber-700">Miktar</p>
                                                                        <p className="text-amber-900">{product.quantity}</p>
                                                                    </div>
                                                                </div>
                                                                {product.itemDescription && (
                                                                    <div className="mt-2">
                                                                        <p className="text-amber-700 text-xs">Prosap Ürün Adı</p>
                                                                        <p className="text-amber-900 text-xs">{product.itemDescription}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-amber-200">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                    >
                        {step === 'processing' && errorCount === 0 ? 'Kapat' : 'İptal'}
                    </button>

                    {step === 'upload' && (
                        <button
                            onClick={handleExtract}
                            disabled={!file || isExtracting}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                        >
                            <Upload className="w-4 h-4" />
                            {isExtracting ? 'İşleniyor...' : 'Dosyayı İşle'}
                        </button>
                    )}

                    {step === 'select' && (
                        <>
                            <button
                                onClick={() => {
                                    setStep('upload')
                                    setOrdersWithStatus([])
                                    setSelectedOrders(new Set())
                                    setFile(null)
                                }}
                                className="px-6 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
                            >
                                Geri
                            </button>
                            <button
                                onClick={handleSaveSelected}
                                disabled={selectedOrders.size === 0 || isSaving || !selectedBrand}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-lg hover:from-amber-800 hover:to-orange-800 transition-all disabled:opacity-50 shadow-md"
                            >
                                <Save className="w-4 h-4" />
                                {`${selectedOrders.size} Siparişi Kaydet`}
                            </button>
                        </>
                    )}

                    {step === 'processing' && !isSaving && (
                        <>
                            {/* Show save button if there are pending orders after editing */}
                            {ordersWithStatus.some(o => o.status === 'pending' && selectedOrders.has(o.orderNo)) && (
                                <button
                                    onClick={handleSaveSelected}
                                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                                >
                                    <Save className="w-4 h-4" />
                                    {`${ordersWithStatus.filter(o => o.status === 'pending' && selectedOrders.has(o.orderNo)).length} Sipariş Kaydet`}
                                </button>
                            )}

                            {/* Show retry button if there are errors */}
                            {errorCount > 0 && (
                                <button
                                    onClick={handleRetryFailed}
                                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all"
                                >
                                    <Upload className="w-4 h-4" />
                                    Hatalı Olanları Tekrar Dene
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Full Order Edit Modal */}
            {editingOrder && tempEditedOrder && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white border border-amber-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-amber-200">
                            <h3 className="text-xl font-bold text-amber-900">Sipariş Düzenle</h3>
                            <p className="text-sm text-amber-700 mt-1">Tüm alanları düzenleyebilirsiniz</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Order Details */}
                            <div>
                                <h4 className="text-sm font-semibold text-amber-800 mb-3">Sipariş Bilgileri</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-amber-700 mb-2">Sipariş No *</label>
                                        <input
                                            type="text"
                                            value={tempEditedOrder.orderNo}
                                            onChange={(e) => setTempEditedOrder({ ...tempEditedOrder, orderNo: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-amber-700 mb-2">Sözleşme No</label>
                                        <input
                                            type="text"
                                            value={tempEditedOrder.prosapContractNo}
                                            onChange={(e) => setTempEditedOrder({ ...tempEditedOrder, prosapContractNo: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-amber-700 mb-2">Ad Soyad *</label>
                                        <input
                                            type="text"
                                            value={tempEditedOrder.prosapContractNameSurname}
                                            onChange={(e) => setTempEditedOrder({ ...tempEditedOrder, prosapContractNameSurname: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-amber-700 mb-2">Sipariş Tarihi *</label>
                                        <input
                                            type="date"
                                            value={tempEditedOrder.orderDate}
                                            onChange={(e) => setTempEditedOrder({ ...tempEditedOrder, orderDate: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Products */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-purple-200">Ürünler</h4>
                                    <button
                                        onClick={() => {
                                            setTempEditedOrder({
                                                ...tempEditedOrder,
                                                products: [...tempEditedOrder.products, {
                                                    orderNo: tempEditedOrder.orderNo,
                                                    contractNo: tempEditedOrder.prosapContractNo,
                                                    itemDescription: '',
                                                    quantity: 1,
                                                    productCode: '',
                                                    productName: ''
                                                }]
                                            })
                                        }}
                                        className="px-3 py-1 bg-green-200 text-green-900 rounded text-xs hover:bg-green-300 transition-colors flex items-center gap-1 font-medium"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Ürün Ekle
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {tempEditedOrder.products.map((product, idx) => (
                                        <div key={idx} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-xs font-medium text-amber-800">Ürün #{idx + 1}</span>
                                                {tempEditedOrder.products.length > 1 && (
                                                    <button
                                                        onClick={() => {
                                                            setTempEditedOrder({
                                                                ...tempEditedOrder,
                                                                products: tempEditedOrder.products.filter((_, i) => i !== idx)
                                                            })
                                                        }}
                                                        className="px-2 py-1 bg-red-200 text-red-900 rounded text-xs hover:bg-red-300 transition-colors"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs text-amber-700 mb-1">Ürün Kodu *</label>
                                                    <input
                                                        type="text"
                                                        value={product.productCode}
                                                        onChange={(e) => {
                                                            const newProducts = [...tempEditedOrder.products]
                                                            newProducts[idx] = { ...product, productCode: e.target.value }
                                                            setTempEditedOrder({ ...tempEditedOrder, products: newProducts })
                                                        }}
                                                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-amber-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-amber-700 mb-1">Ürün Adı *</label>
                                                    <input
                                                        type="text"
                                                        value={product.productName}
                                                        onChange={(e) => {
                                                            const newProducts = [...tempEditedOrder.products]
                                                            newProducts[idx] = { ...product, productName: e.target.value }
                                                            setTempEditedOrder({ ...tempEditedOrder, products: newProducts })
                                                        }}
                                                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-amber-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-amber-700 mb-1">Miktar *</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={product.quantity}
                                                        onChange={(e) => {
                                                            const newProducts = [...tempEditedOrder.products]
                                                            newProducts[idx] = { ...product, quantity: parseInt(e.target.value) || 1 }
                                                            setTempEditedOrder({ ...tempEditedOrder, products: newProducts })
                                                        }}
                                                        className="w-full px-2 py-1 bg-white border border-amber-300 rounded text-amber-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-amber-200">
                            <button
                                onClick={() => {
                                    setEditingOrder(null)
                                    setTempEditedOrder(null)
                                }}
                                className="flex-1 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleEditOrder}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-lg hover:from-amber-800 hover:to-orange-800 transition-all shadow-md"
                            >
                                Değişiklikleri Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
