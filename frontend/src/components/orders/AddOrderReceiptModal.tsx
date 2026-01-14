import { useState, useMemo } from 'react'
import { X, Search, Package, ChevronRight, Truck, User, FileText, Upload, AlertCircle, ArrowLeft } from 'lucide-react'
import { useListOrdersQuery } from '../../services/orderApi'
import { useCreateOrderReceiptMutation } from '../../services/orderReceiptApi'
import { useAppSelector } from '../../hooks/useAuth'
import { useListVehiclesQuery } from '../../services/vehicleApi'

interface AddOrderReceiptModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

type Step = 'SELECT_ORDER' | 'SELECT_PRODUCT' | 'ENTER_DETAILS'

export default function AddOrderReceiptModal({ isOpen, onClose, onSuccess }: AddOrderReceiptModalProps) {
    const [step, setStep] = useState<Step>('SELECT_ORDER')
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Form State
    const [receivedQuantity, setReceivedQuantity] = useState('')
    const [vehiclePlate, setVehiclePlate] = useState('')
    const [isManualPlate, setIsManualPlate] = useState(false)
    const [driverName, setDriverName] = useState('')
    const [driverPhone, setDriverPhone] = useState('')
    const [notes, setNotes] = useState('')
    const [photos, setPhotos] = useState<File[]>([])

    const currentUser = useAppSelector(state => state.auth.user)
    const [createReceipt, { isLoading: isSubmitting }] = useCreateOrderReceiptMutation()
    const { data: vehicles = [] } = useListVehiclesQuery()

    // Fetch all orders including hidden (SSH) ones
    const { data: orders = [], isLoading: isLoadingOrders } = useListOrdersQuery({ includeHidden: true })

    const activeOrders = useMemo(() => {
        const activeStatuses = [
            'CREATED',
            'PENDING_ACCEPTANCE',
            'PARTIALLY_ACCEPTED',
            'PENDING_SHIPMENT_APPROVAL',
            'SHIPMENT_APPROVED',
            'IN_SHIPMENT',
            'PARTIALLY_SHIPPED',
            'DEVAM_EDIYOR'
        ]
        return orders.filter(order => activeStatuses.includes(order.status))
            .filter(order =>
                order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.prosapContractNameSurname?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            // Only show orders that have at least one product with remaining quantity > 0
            .filter(order =>
                order.products.some(product => (product.remainingQuantity ?? product.quantity) > 0)
            )
    }, [orders, searchQuery])

    const selectedOrder = useMemo(() =>
        orders.find(o => o.id === selectedOrderId),
        [orders, selectedOrderId])

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos(Array.from(e.target.files))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProduct || !receivedQuantity) return

        try {
            await createReceipt({
                request: {
                    orderProductId: selectedProduct.id,
                    receivedQuantity: Number(receivedQuantity),
                    vehiclePlate,
                    driverName,
                    driverPhone,
                    notes
                },
                photos
            }).unwrap()

            onSuccess()
            handleClose()
        } catch (error) {
            console.error('Failed to create receipt:', error)
            alert('Kayıt oluşturulurken bir hata oluştu.')
        }
    }

    const handleClose = () => {
        setStep('SELECT_ORDER')
        setSelectedOrderId(null)
        setSelectedProduct(null)
        setSearchQuery('')
        setReceivedQuantity('')
        setVehiclePlate('')
        setIsManualPlate(false)
        setDriverName('')
        setDriverPhone('')
        setNotes('')
        setPhotos([])
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-amber-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-amber-200 flex items-center justify-between bg-amber-50">
                    <div className="flex items-center gap-3">
                        {step !== 'SELECT_ORDER' && (
                            <button onClick={() => {
                                if (step === 'ENTER_DETAILS') setStep('SELECT_PRODUCT')
                                else if (step === 'SELECT_PRODUCT') setStep('SELECT_ORDER')
                            }} className="p-1 hover:bg-amber-100 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-amber-700" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-amber-900">Yeni Ürün Kabul</h2>
                            <p className="text-sm text-amber-700">
                                {step === 'SELECT_ORDER' && 'Sipariş Seçimi'}
                                {step === 'SELECT_PRODUCT' && 'Ürün Seçimi'}
                                {step === 'ENTER_DETAILS' && 'Kabul Detayları'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-amber-100 rounded-lg transition-colors text-amber-700 hover:text-amber-900">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'SELECT_ORDER' && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                                <input
                                    type="text"
                                    placeholder="Sipariş No veya Müşteri Adı Ara..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-amber-300 rounded-xl py-3 pl-10 pr-4 text-amber-900 text-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>

                            {isLoadingOrders ? (
                                <div className="text-center py-8 text-amber-600">Yükleniyor...</div>
                            ) : activeOrders.length === 0 ? (
                                <div className="text-center py-8 text-amber-600">Kayıt bulunamadı.</div>
                            ) : (
                                <div className="space-y-2">
                                    {activeOrders.map(order => (
                                        <button
                                            key={order.id}
                                            onClick={() => {
                                                setSelectedOrderId(order.id)
                                                setStep('SELECT_PRODUCT')
                                            }}
                                            className="w-full text-left p-4 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 transition-all"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-semibold text-amber-900">{order.orderNo}</span>
                                                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-lg border border-purple-400">
                                                            {order.products.length} Ürün
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-lg border border-blue-300">
                                                            {order.orderType === 'STOCK' ? '📦 Stok' :
                                                                order.orderType === 'CUSTOMER_SPECIFIC' ? '👤 Müşteriye Özel' :
                                                                    order.orderType === 'AFTER_SALES_SERVICE' ? '🔧 Satış Sonrası' : order.orderType}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-amber-700 mb-1">{order.prosapContractNameSurname}</div>
                                                    <div className="text-xs text-amber-600">
                                                        📅 {new Date(order.orderDate).toLocaleDateString('tr-TR')}
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-amber-600 group-hover:text-amber-900 transition-colors flex-shrink-0 mt-1" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'SELECT_PRODUCT' && selectedOrder && (
                        <div className="space-y-4">
                            <div className="p-4 bg-purple-50 border border-purple-300 rounded-xl mb-6">
                                <div className="text-sm text-purple-700">Seçili Sipariş:</div>
                                <div className="font-semibold text-amber-900">{selectedOrder.orderNo} - {selectedOrder.prosapContractNameSurname}</div>
                            </div>

                            <div className="grid gap-3">
                                {selectedOrder.products.map(product => {
                                    const remaining = product.remainingQuantity ?? product.quantity
                                    const isFullyAccepted = remaining <= 0

                                    return (
                                        <button
                                            key={product.id}
                                            disabled={isFullyAccepted}
                                            onClick={() => {
                                                setSelectedProduct(product)
                                                setStep('ENTER_DETAILS')
                                            }}
                                            className={`w-full text-left p-4 border rounded-xl flex items-center justify-between group transition-all ${isFullyAccepted
                                                ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                                                : 'bg-white/5 hover:bg-white/10 border-white/10'
                                                }`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-amber-900">{product.productName}</span>
                                                </div>
                                                <div className="text-sm text-amber-600 mb-2">{product.productCode}</div>
                                                <div className="flex items-center gap-4 text-xs">
                                                    <span className="text-amber-700">Sipariş: <span className="text-amber-900">{product.quantity}</span></span>
                                                    <span className="text-amber-700">Kalan: <span className={`font-semibold ${remaining > 0 ? 'text-green-600' : 'text-gray-400'}`}>{remaining}</span></span>
                                                </div>
                                            </div>
                                            {!isFullyAccepted && <ChevronRight className="w-5 h-5 text-amber-600 group-hover:text-amber-900 transition-colors" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {step === 'ENTER_DETAILS' && selectedProduct && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="p-4 bg-purple-50 border border-purple-300 rounded-xl mb-4">
                                <div className="text-sm text-purple-700 md:flex md:justify-between">
                                    <span>Seçili Ürün: <strong className="text-amber-900">{selectedProduct.productName}</strong></span>
                                    <span className="block mt-1 md:mt-0">Kalan Miktar: <strong className="text-green-400">{selectedProduct.remainingQuantity ?? selectedProduct.quantity}</strong></span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-1">Kabul Edilen Miktar *</label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={selectedProduct.remainingQuantity ?? selectedProduct.quantity}
                                        value={receivedQuantity}
                                        onChange={(e) => setReceivedQuantity(e.target.value)}
                                        className="w-full bg-white border border-amber-300 rounded-xl py-3 pl-10 pr-4 text-amber-900 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="Miktar giriniz"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-amber-700 mb-1">Araç Plakası</label>
                                    <div className="relative">
                                        <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                                        <select
                                            value={isManualPlate ? 'MANUEL' : vehiclePlate}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                if (val === 'MANUEL') {
                                                    setIsManualPlate(true)
                                                    setVehiclePlate('')
                                                } else {
                                                    setIsManualPlate(false)
                                                    setVehiclePlate(val)
                                                }
                                            }}
                                            className="w-full bg-white border border-amber-300 rounded-xl py-3 pl-10 pr-4 text-amber-900 focus:outline-none focus:border-amber-500 transition-colors"
                                        >
                                            <option value="">-- Araç Seçiniz --</option>
                                            {vehicles.map(vehicle => (
                                                <option key={vehicle.id} value={vehicle.licensePlate}>
                                                    {vehicle.licensePlate} - {vehicle.vehicleType}
                                                </option>
                                            ))}
                                            <option value="MANUEL">Manuel Giriş (Dış Araç)</option>
                                        </select>
                                    </div>
                                    {isManualPlate && (
                                        <input
                                            type="text"
                                            value={vehiclePlate}
                                            placeholder="Araç plakasını girin"
                                            onChange={(e) => setVehiclePlate(e.target.value)}
                                            className="w-full bg-white border border-amber-300 rounded-xl py-3 px-4 text-amber-900 focus:outline-none focus:border-amber-500 transition-colors mt-2"
                                            autoFocus
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-amber-700 mb-1">Şoför Adı</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                                        <input
                                            type="text"
                                            value={driverName}
                                            onChange={(e) => setDriverName(e.target.value)}
                                            className="w-full bg-white border border-amber-300 rounded-xl py-3 pl-10 pr-4 text-amber-900 focus:outline-none focus:border-amber-500 transition-colors"
                                            placeholder="Ad Soyad"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-1">Şoför Telefon</label>
                                <input
                                    type="tel"
                                    value={driverPhone}
                                    onChange={(e) => setDriverPhone(e.target.value)}
                                    className="w-full bg-white border border-amber-300 rounded-xl py-3 px-4 text-amber-900 focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="05XX XXX XX XX"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-1">Notlar</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 w-5 h-5 text-amber-600" />
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full bg-white border border-amber-300 rounded-xl py-3 pl-10 pr-4 text-amber-900 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                                        placeholder="Varsa notlarınız..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-1">Fotoğraflar</label>
                                <div className="relative border-2 border-dashed border-amber-300 rounded-xl p-6 text-center hover:border-amber-500 transition-colors cursor-pointer">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                                    <p className="text-sm text-amber-700">Fotoğraf yüklemek için tıklayın veya sürükleyin</p>
                                    <p className="text-xs text-purple-400 mt-1">
                                        {photos.length > 0 ? `${photos.length} dosya seçildi` : 'Dosya seçilmedi'}
                                    </p>
                                </div>
                            </div>

                            {/* Info Message about Approval */}
                            <div className="p-4 bg-blue-50 border border-blue-300 rounded-xl flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-700 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium text-blue-800">Bilgilendirme</p>
                                    <p className="text-blue-700 mt-1">
                                        {currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.role === 'DIRECTOR'
                                            ? 'Yetkiniz dahilinde bu işlem otomatik olarak ONAYLANACAKTIR.'
                                            : 'Bu işlem yönetici ONAYINA gönderilecektir.'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                {isSubmitting ? 'Kaydediliyor...' : 'Kabulü Tamamla'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
