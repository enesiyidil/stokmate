import { ArrowLeft, Package, User, FileText, CheckCircle, XCircle, Clock, Upload, Download, Activity, Edit, Eye, Pencil, StickyNote, Plus, Strikethrough, AlertTriangle, Check } from 'lucide-react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useCancelOrderMutation, useApproveCancellationMutation, useUploadInvoiceMutation, useGetInvoiceUrlQuery, useGetOrderQuery, useUpdateSalesConsultantMutation, useUpdateBrandMutation, useGetOrderNotesQuery, useAddOrderNoteMutation, useStrikeOrderNoteMutation, useDeleteOrderMutation, useUpdateOrderMutation } from '../../services/orderApi'
import { useCreatePartialShipmentMutation } from '../../services/shipmentApi'
import { useGetOrderActivitiesQuery } from '../../services/orderActivityApi'
import { useListOrderReceiptsQuery } from '../../services/orderReceiptApi'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useTopbar } from '../../context/TopbarContext'
import { useEffect, useState, useMemo } from 'react'
import { useAppSelector } from '../../hooks/useAuth'
import { useGetSalesConsultantsQuery } from '../../services/userApi'
import CustomerModal from '../../components/customers/CustomerModal'
import BrandBadge from '../../components/common/BrandBadge'
import { BRANDS } from '../../constants/brandConstants'
import AddOrderModal from '../../components/orders/AddOrderModal'
import UpdateOrderModal from '../../components/orders/UpdateOrderModal'
import { Trash2, Settings } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import ConfirmModal from '../../components/common/ConfirmModal'
import OtpVerificationModal from '../../components/common/OtpVerificationModal'
import type { ProblemShipmentSummary } from '../../services/orderApi'

export default function OrderDetailsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const { setTopbarContent } = useTopbar()
    const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation()
    const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation()
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const { success, error, warning } = useToast()
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const { data: order, isLoading, refetch } = useGetOrderQuery(id!)
    const { data: activities = [] } = useGetOrderActivitiesQuery(id!)
    const { data: receipts = [] } = useListOrderReceiptsQuery({ orderId: id! })
    const [cancelOrder, { isLoading: isCanceling }] = useCancelOrderMutation()
    const [uploadInvoice] = useUploadInvoiceMutation()
    const { data: invoiceData } = useGetInvoiceUrlQuery(id!, { skip: !order?.hasInvoice })
    const [updateSalesConsultant] = useUpdateSalesConsultantMutation()
    const [updateBrand] = useUpdateBrandMutation()
    const { data: salesConsultants = [] } = useGetSalesConsultantsQuery()
    const [approveCancellation, { isLoading: isApprovingCancellation }] = useApproveCancellationMutation()


    const user = useAppSelector(state => state.auth.user)


    const [showSalesConsultantModal, setShowSalesConsultantModal] = useState(false)
    const [selectedConsultantId, setSelectedConsultantId] = useState<string>('')

    // 2FA Gate State
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

    const verifyGate = (action: () => void) => {
        if (user?.totpEnabled) {
            setPendingAction(() => action)
            setShowOtpModal(true)
        } else {
            action()
        }
    }

    // Shipment modal state
    const [showShipmentModal, setShowShipmentModal] = useState(false)
    const [shipmentQuantities, setShipmentQuantities] = useState<Record<string, number>>({})
    const [shipmentNotes, setShipmentNotes] = useState<string>('')
    const [isCreatingShipment, setIsCreatingShipment] = useState(false)
    const [createPartialShipment] = useCreatePartialShipmentMutation()

    const [showCustomerModal, setShowCustomerModal] = useState(false)
    const [showBrandModal, setShowBrandModal] = useState(false)
    const [selectedBrandForUpdate, setSelectedBrandForUpdate] = useState<string>('')

    // SSH Order Modal state
    const [showSshOrderModal, setShowSshOrderModal] = useState(false)
    const [selectedProblemShipment, setSelectedProblemShipment] = useState<ProblemShipmentSummary | null>(null)

    // Order Notes state
    const { data: orderNotes = [], refetch: refetchNotes } = useGetOrderNotesQuery(id!)
    const [addOrderNote] = useAddOrderNoteMutation()
    const [strikeOrderNote] = useStrikeOrderNoteMutation()
    const [newNoteContent, setNewNoteContent] = useState('')
    const [isAddingNote, setIsAddingNote] = useState(false)

    // Expanded price details state (tracks which product's price details are visible)
    const [expandedPriceDetails, setExpandedPriceDetails] = useState<Record<string, boolean>>({})

    const togglePriceDetails = (productId: string) => {
        setExpandedPriceDetails(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }))
    }

    // Check if user can ship products - everyone except LOGISTICS_MANAGER
    // SSH (AFTER_SALES_SERVICE) siparişleri için de sevk yapılabilir
    const canShipProducts = useMemo(() => {
        if (!order || !user) return false
        // CUSTOMER_SPECIFIC ve SSH siparişleri için sevk yapılabilir
        if (order.orderType !== 'CUSTOMER_SPECIFIC' && order.orderType !== 'AFTER_SALES_SERVICE') return false
        // Logistics manager cannot ship products (they manage shipments, not create them)
        if (user.role === 'LOGISTICS_MANAGER') return false
        return true
    }, [order, user])

    // Check if user can assign sales consultant - everyone except LOGISTICS_MANAGER and OPERATIONS_MANAGER
    const canAssignConsultant = useMemo(() => {
        if (!user) return false
        if (user.role === 'LOGISTICS_MANAGER' || user.role === 'OPERATIONS_MANAGER') return false
        return true
    }, [user])

    // Check if user is admin or manager (for edit brand button)
    const isAdminOrManager = useMemo(() => {
        return user?.role === 'ADMIN' || user?.role === 'MANAGER'
    }, [user])

    const shippableProducts = useMemo(() => {
        if (!order?.products) return []

        // Use backend-provided availableForShipmentQuantity
        return order.products.filter(p => {
            const availableQty = p.availableForShipmentQuantity || 0
            return availableQty > 0
        })
    }, [order?.products])

    // Calculate effective remaining for modal - use backend-provided value
    const getEffectiveRemaining = (product: any) => {
        // Backend already calculates availableForShipmentQuantity correctly
        // taking into account shipped, pending shipment quantities
        return product.availableForShipmentQuantity || 0
    }

    // Helper to get pending quantity
    const getPendingQuantity = (productId: string) => {
        return receipts
            .filter(r => r.orderProductId === productId && r.status === 'PENDING_APPROVAL')
            .reduce((sum, r) => sum + r.receivedQuantity, 0)
    }

    const handleCancelOrder = () => {
        verifyGate(() => setShowCancelConfirm(true))
    }

    const handleConfirmCancel = async () => {
        if (!order) return
        try {
            await cancelOrder(order.id).unwrap()
            success('Sipariş iptal onayı için gönderildi')
            setShowCancelConfirm(false)
        } catch (err) {
            error('Sipariş iptal edilirken bir hata oluştu')
        }
    }

    const handleAcceptProducts = () => {
        navigate('/products/accept-order', {
            state: { orderId: order!.id, orderNo: order!.orderNo, products: order!.products }
        })
    }

    const handleAddNote = async () => {
        if (!newNoteContent.trim() || !id) return
        setIsAddingNote(true)
        try {
            await addOrderNote({ orderId: id, content: newNoteContent.trim() }).unwrap()
            setNewNoteContent('')
            refetchNotes()
            success('Not başarıyla eklendi')
        } catch (err) {
            console.error('Failed to add note:', err)
            error('Not eklenirken bir hata oluştu')
        } finally {
            setIsAddingNote(false)
        }
    }

    const handleStrikeNote = async (noteId: string) => {
        if (!id) return
        try {
            await strikeOrderNote({ orderId: id, noteId }).unwrap()
            refetchNotes()
            success('Not işaretlendi')
        } catch (err) {
            console.error('Failed to strike note:', err)
            error('Not işaretlenirken bir hata oluştu')
        }
    }

    const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const formData = new FormData()
        formData.append('file', file)
        try {
            await uploadInvoice({ id: order!.id, file: formData }).unwrap()
            success('Fatura başarıyla yüklendi')
        } catch (err) {
            error('Fatura yüklenirken bir hata oluştu')
        }
    }

    const handleOpenSalesConsultantModal = () => {
        verifyGate(() => {
            setSelectedConsultantId(order?.salesConsultant?.id || '')
            setShowSalesConsultantModal(true)
        })
    }

    const handleSaveSalesConsultant = async () => {
        if (!id) return

        try {
            await updateSalesConsultant({
                orderId: id,
                data: {
                    salesConsultantId: selectedConsultantId || undefined
                }
            }).unwrap()
            setShowSalesConsultantModal(false)
            success('Satış danışmanı güncellendi')
        } catch (err) {
            console.error('Failed to update sales consultant:', err)
            error('Güncelleme başarısız oldu')
        }
    }

    const handleOpenShipmentModal = () => {
        const initialQuantities: Record<string, number> = {}
        // Initialize with 0
        shippableProducts.forEach(p => {
            initialQuantities[p.id] = 0
        })
        setShipmentQuantities(initialQuantities)
        setShipmentNotes('')
        setShowShipmentModal(true)
    }

    const handleSubmitShipment = async () => {
        if (!id) return

        const itemsToShip = Object.entries(shipmentQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([productId, qty]) => ({
                orderProductId: productId,
                quantityToShip: qty
            }))

        if (itemsToShip.length === 0) {
            warning('Lütfen en az bir ürün için miktar giriniz')
            return
        }

        setIsCreatingShipment(true)
        try {
            await createPartialShipment({
                orderId: id,
                productShipments: itemsToShip,
                notes: shipmentNotes
            }).unwrap()

            setShowShipmentModal(false)
            success('Sevk talebi başarıyla oluşturuldu')
            // Reload page to refresh all data including shipped quantities
            setTimeout(() => window.location.reload(), 1500)
        } catch (err) {
            console.error('Failed to create shipment:', err)
            error('Sevk talebi oluşturulamadı')
        } finally {
            setIsCreatingShipment(false)
        }
    }

    const handleDeleteOrder = async () => {
        if (!order) return
        try {
            await deleteOrder(order.id).unwrap()
            success('Sipariş ve ilişkili sevkiyatlar başarıyla silindi')
            setShowDeleteConfirm(false)
            navigate('/orders')
        } catch (err) {
            console.error('Delete failed:', err)
            error('Sipariş silinirken bir hata oluştu')
        }
    }

    const handleUpdateOrder = async (data: any) => {
        if (!order) return
        try {
            await updateOrder({ id: order.id, data }).unwrap()
            success('Sipariş bilgileri güncellendi')
            setShowUpdateModal(false)
            refetch()
        } catch (err) {
            console.error('Update failed:', err)
            error('Güncelleme işlemi başarısız')
        }
    }

    useEffect(() => {
        if (order) {
            setTopbarContent({
                title: order.orderNo,
                description: 'Sipariş Detayı',
                icon: <Package className="w-8 h-8" />,
                showFiltersInTopbar: true,
                actions: (
                    <div className="flex items-center gap-3">
                        {/* Problem Shipment SSH Buttons */}
                        {order.problemShipments && order.problemShipments.length > 0 && order.problemShipments.map((ps, idx) => (
                            <button
                                key={ps.shipmentId}
                                onClick={() => {
                                    if (!ps.hasSshOrder) {
                                        setSelectedProblemShipment(ps)
                                        setShowSshOrderModal(true)
                                    } else {
                                        navigate(`/orders/${ps.sshOrderId}`)
                                    }
                                }}
                                title={ps.hasSshOrder ? `SSH Sipariş: Görüntüle` : `Sorunlu Sevk #${idx + 1}: SSH Oluştur`}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${ps.hasSshOrder
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30'
                                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/30 animate-pulse'
                                    }`}
                            >
                                <AlertTriangle className="w-4 h-4" />
                                <span className="hidden lg:inline">
                                    {ps.hasSshOrder ? 'SSH' : `SSH #${idx + 1}`}
                                </span>
                            </button>
                        ))}

                        {/* Cancel Approve Button - Admin/Manager/Director */}
                        {order.status === 'CANCELLATION_PENDING_APPROVAL' && (user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'DIRECTOR') && (
                            <button
                                onClick={() => verifyGate(async () => {
                                    try {
                                        await approveCancellation(order.id).unwrap()
                                        success('İptal talebi onaylandı')
                                    } catch (err) {
                                        error('Onaylama işlemi başarısız')
                                    }
                                })}
                                disabled={isApprovingCancellation}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" />
                                <span className="hidden lg:inline">İptali Onayla</span>
                            </button>
                        )}

                        {order.status !== 'IPTAL_EDILDI' && order.status !== 'CANCELLED' && order.status !== 'TAMAMLANDI' && order.status !== 'COMPLETED' && order.status !== 'CANCELLATION_PENDING_APPROVAL' && (
                            <button onClick={handleCancelOrder} disabled={isCanceling} className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all disabled:opacity-50">
                                <XCircle className="w-4 h-4" />
                                <span className="hidden lg:inline">İptal Et</span>
                            </button>
                        )}
                        {(order.status === 'TAMAMLANDI' || order.status === 'COMPLETED') && !order.productsAccepted && (
                            <button onClick={handleAcceptProducts} className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                                <CheckCircle className="w-4 h-4" />
                                <span className="hidden lg:inline">Ürünleri Kabul Et</span>
                            </button>
                        )}

                    </div>
                ),
                filters: (
                    <button onClick={() => {
                        // Priority: 1. Previous page from state (e.g. Events), 2. Parent Order, 3. Order List
                        const state = location.state as { from?: string } | null;
                        if (state?.from) {
                            navigate(state.from)
                        } else if (order.parentOrderId) {
                            navigate(`/orders/${order.parentOrderId}`)
                        } else {
                            navigate('/orders')
                        }
                    }} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        {((location.state as any)?.from) ? 'Geri Dön' : (order.parentOrderId ? 'Ana Siparişe Dön' : 'Geri')}
                    </button>
                )
            })
        }

        return () => setTopbarContent(null)
    }, [order, setTopbarContent, navigate, isCanceling, shippableProducts, isAdminOrManager, canShipProducts, canAssignConsultant])

    if (isLoading || !order) {
        return <div className="flex items-center justify-center min-h-screen"><p className="text-white text-xl">Yükleniyor...</p></div>
    }

    const getStatusBadge = () => {
        const status = order.status
        if (status === 'CREATED') return { label: 'Oluşturuldu', icon: Clock, className: 'bg-purple-500/30 to-indigo-500/30 text- border-purple-400/30' }
        if (['DEVAM_EDIYOR', 'PENDING_ACCEPTANCE', 'PARTIALLY_ACCEPTED'].includes(status)) {
            return { label: 'Devam Ediyor', icon: Clock, className: 'bg-blue-500/30 to-cyan-500/30 text- border-blue-400/30' }
        }
        if (status === 'PENDING_SHIPMENT_APPROVAL') {
            return { label: 'Sevk Onayı Bekliyor', icon: Clock, className: 'bg-orange-500/30 to-amber-500/30 text- border-orange-400/30 animate-pulse' }
        }
        if (status === 'SHIPMENT_APPROVED') {
            return { label: 'Sevke Hazır', icon: CheckCircle, className: 'bg-teal-500/30 to-emerald-500/30 text- border-teal-400/30' }
        }
        if (['IN_SHIPMENT', 'PARTIALLY_SHIPPED'].includes(status)) {
            return { label: 'Sevkiyatta', icon: Clock, className: 'bg-yellow-500/30 to-orange-500/30 text- border-yellow-400/30' }
        }
        if (['TAMAMLANDI', 'COMPLETED', 'DELIVERED', 'ACCEPTED'].includes(status)) {
            return { label: 'Tamamlandı', icon: CheckCircle, className: 'bg-green-500/30 to-emerald-500/30 text- border-green-400/30' }
        }
        if (status === 'CANCELLATION_PENDING_APPROVAL') {
            return { label: 'İptal Onayı Bekliyor', icon: AlertTriangle, className: 'bg-red-500/30 to-orange-500/30 text- border-red-400/30 animate-pulse' }
        }
        if (['IPTAL_EDILDI', 'CANCELLED'].includes(status)) {
            return { label: 'İptal Edildi', icon: XCircle, className: 'bg-red-500/30 to-pink-500/30 text- border-red-400/30' }
        }
        return { label: 'Bilinmiyor', icon: Clock, className: 'bg-gray-500/30 to-slate-500/30 text- border-gray-400/30' }
    }

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('tr-TR')

    return (
        <div className="min-h-screen">
            <div className="p-6 space-y-6">
                {/* Order Info Card */}
                <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-amber-900">Sipariş Bilgileri</h3>
                        {isAdminOrManager && (
                            <button
                                onClick={() => {
                                    setSelectedBrandForUpdate(order.products[0]?.brand || '')
                                    setShowBrandModal(true)
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-all text-xs font-medium"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Düzenle
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <p className="text-xs text-amber-700 mb-1">Sözleşme No</p>
                            <p className="text-amber-900 font-medium">{order.prosapContractNo}</p>
                        </div>
                        <div>
                            <p className="text-xs text-amber-700 mb-1">Sipariş Tarihi</p>
                            <p className="text-amber-900 font-medium">{formatDate(order.orderDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-amber-700 mb-1">Sözleşme Ad Soyad</p>
                            <p className="text-amber-900 font-medium">{order.prosapContractNameSurname}</p>
                        </div>
                        <div>
                            <p className="text-xs text-amber-700 mb-1">Sipariş Tipi</p>
                            <p className="text-amber-900 font-medium">
                                {order.orderType === 'STOCK' ? '📦 Stok Siparişi' :
                                    order.orderType === 'CUSTOMER_SPECIFIC' ? '👤 Müşteriye Özel' :
                                        order.orderType === 'AFTER_SALES_SERVICE' ? '🔧 Satış Sonrası Hizmet' : order.orderType}
                            </p>
                            {/* Müşteriden stoğa dönüştürülen sipariş için açıklama */}
                            {order.convertedFromCustomer && (
                                <p className="text-xs text-red-600 mt-1 font-medium">
                                    ⚠️ Müşteriden iptal edilen, stoğa çevrilen sipariş
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-amber-700 mb-1">Marka</p>
                            {order.products && order.products.length > 0 && order.products[0].brand ? (
                                <BrandBadge brand={order.products[0].brand} />
                            ) : (
                                <p className="text-amber-400">-</p>
                            )}
                        </div>
                    </div>

                    {/* Sales Consultant Info - Only for CUSTOMER_SPECIFIC orders */}
                    {order.orderType === 'CUSTOMER_SPECIFIC' && (
                        <div className="mt-4 pt-4 border-t border-amber-200">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-amber-800">👨‍💼 Satış Danışmanı</p>
                                {canAssignConsultant && (
                                    <button
                                        onClick={handleOpenSalesConsultantModal}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-all text-xs font-medium"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        {order.salesConsultant ? 'Değiştir' : 'Ata'}
                                    </button>
                                )}
                            </div>
                            {order.salesConsultant ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-amber-700 mb-1">Ad Soyad</p>
                                        <p className="text-amber-900 font-medium">{order.salesConsultant.firstName} {order.salesConsultant.lastName}</p>
                                    </div>
                                    {order.salesConsultant.email && (
                                        <div>
                                            <p className="text-xs text-amber-700 mb-1">E-posta</p>
                                            <p className="text-amber-900 font-medium">{order.salesConsultant.email}</p>
                                        </div>
                                    )}
                                    {order.salesConsultant.phone && (
                                        <div>
                                            <p className="text-xs text-amber-700 mb-1">Telefon</p>
                                            <p className="text-amber-900 font-medium">{order.salesConsultant.phone}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-amber-700 text-sm">Henüz satış danışmanı atanmamış</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* SSH Orders Card - Show if parent order has SSH children */}
                {order.childSshOrders && order.childSshOrders.length > 0 && (
                    <div className="backdrop-blur-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300 rounded-2xl shadow-2xl p-6">
                        <h3 className="text-lg font-semibold text-orange-900 flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            SSH Siparişleri ({order.childSshOrders.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {order.childSshOrders.map((ssh) => (
                                <div
                                    key={ssh.id}
                                    onClick={() => navigate(`/orders/${ssh.id}`)}
                                    className="p-4 bg-white/70 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100/50 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-orange-900">{ssh.orderNo}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ssh.problemType === 'FACTORY_DEFECT'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {ssh.problemType === 'FACTORY_DEFECT' ? 'Fabrika Hatası' : 'Nakliye/Montaj'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-orange-700">
                                        Oluşturma: {new Date(ssh.orderDate).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2 Column Layout: Left Fixed, Right Scrollable */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Left Column - Fixed */}
                    <div className="lg:col-span-4 space-y-6 flex flex-col">
                        {/* Customer Info */}
                        {order.customer && (
                            <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Müşteri Bilgileri
                                    </h3>
                                    <button
                                        onClick={() => verifyGate(() => setShowCustomerModal(true))}
                                        className="p-1.5 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
                                        title="Müşteri Bilgilerini Düzenle"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-amber-700">Ad Soyad</p>
                                        <p className="text-amber-900 font-medium">{order.customer.firstName} {order.customer.lastName}</p>
                                    </div>
                                    {order.customer.phone && (
                                        <div>
                                            <p className="text-xs text-amber-700">Telefon</p>
                                            <p className="text-amber-900">{order.customer.phone}</p>
                                        </div>
                                    )}
                                    {order.customer.email && (
                                        <div>
                                            <p className="text-xs text-amber-700">E-posta</p>
                                            <p className="text-amber-900">{order.customer.email}</p>
                                        </div>
                                    )}
                                    {order.customer.city && (
                                        <div>
                                            <p className="text-xs text-amber-700">Şehir</p>
                                            <p className="text-amber-900">{order.customer.city}</p>
                                        </div>
                                    )}
                                    {order.customer.fullAddress && (
                                        <div>
                                            <p className="text-xs text-amber-700">Adres</p>
                                            <p className="text-amber-900 text-sm">{order.customer.fullAddress}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Management Actions - Admin/Manager Only */}
                        {isAdminOrManager && (
                            <div className="backdrop-blur-xl bg-gradient-to-br from-gray-50 to-amber-50 border border-amber-200 rounded-2xl shadow-xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-amber-700" />
                                    Yönetim İşlemleri
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => verifyGate(() => setShowUpdateModal(true))}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-50 transition-all font-medium shadow-sm hover:shadow-md"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Düzenle
                                    </button>
                                    <button
                                        onClick={() => verifyGate(() => setShowDeleteConfirm(true))}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-all font-medium shadow-sm hover:shadow-md hover:border-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Sil
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Invoice */}
                        <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Fatura
                            </h3>
                            {order.hasInvoice ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-green-400"><CheckCircle className="w-5 h-5" /><span>Fatura mevcut</span></div>
                                    {invoiceData && (
                                        <div className="flex gap-2">
                                            <a href={invoiceData.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-900 rounded-lg hover:bg-purple-200 transition-colors border border-purple-400">
                                                <Eye className="w-4 h-4" />
                                                Görüntüle
                                            </a>
                                            <a href={invoiceData.url} download className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-900 rounded-lg hover:bg-blue-200 transition-colors border border-blue-400">
                                                <Download className="w-4 h-4" />
                                                İndir
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-amber-700 mb-3">Henüz fatura yüklenmemiş</p>
                                    <label className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-900 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer border border-purple-400">
                                        <Upload className="w-4 h-4" />
                                        Fatura Yükle
                                        <input type="file" className="hidden" onChange={handleInvoiceUpload} accept=".pdf,.jpg,.jpeg,.png" />
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Order Notes / Not Defteri */}
                        <div className="flex-1 backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6 flex flex-col">
                            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2 mb-4">
                                <StickyNote className="w-5 h-5" />
                                Not Defteri ({orderNotes.length})
                            </h3>

                            {/* Add Note Input */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                    placeholder="Yeni not ekle..."
                                    className="flex-1 px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                    maxLength={1000}
                                />
                                <button
                                    onClick={handleAddNote}
                                    disabled={isAddingNote || !newNoteContent.trim()}
                                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ekle
                                </button>
                            </div>

                            {/* Notes List */}
                            <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                                {orderNotes.length > 0 ? (
                                    orderNotes.map((note) => (
                                        <div
                                            key={note.id}
                                            className={`p-3 border rounded-lg flex items-start justify-between gap-3 ${note.strikethrough
                                                ? 'bg-gray-100 border-gray-300'
                                                : 'bg-amber-50 border-amber-200'
                                                }`}
                                        >
                                            <div className="flex-1">
                                                <p className={`text-sm ${note.strikethrough
                                                    ? 'text-gray-500 line-through'
                                                    : 'text-amber-900'
                                                    }`}>
                                                    {note.content}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-amber-700">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {note.createdByName}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, locale: tr })}
                                                    </span>
                                                    {note.strikethrough && note.strikethroughByName && (
                                                        <span className="text-gray-500">
                                                            (Çizen: {note.strikethroughByName})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {!note.strikethrough && (
                                                <button
                                                    onClick={() => handleStrikeNote(note.id)}
                                                    title="Üstünü Çiz"
                                                    className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-200 rounded transition-colors"
                                                >
                                                    <Strikethrough className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-amber-700 py-8">Henüz not bulunmuyor</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Scrollable */}
                    <div className="lg:col-span-8 space-y-6 flex flex-col">
                        {/* Products */}
                        <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Ürünler ({order.products.length})
                                </h3>
                                {shippableProducts.length > 0 && canShipProducts && (
                                    <button
                                        onClick={handleOpenShipmentModal}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all text-sm font-medium shadow-md"
                                    >
                                        <Package className="w-4 h-4" />
                                        Sevke Sun
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {order.products.map((product) => {
                                    const pendingReceiptQty = getPendingQuantity(product.id)
                                    const acceptedQty = product.acceptedQuantity || 0
                                    const totalQty = product.quantity
                                    const shippedQty = product.shippedQuantity || 0
                                    const pendingShipQty = product.pendingShipmentQuantity || 0
                                    const availableQty = product.availableForShipmentQuantity || 0
                                    const isCustomerSpecific = order.orderType === 'CUSTOMER_SPECIFIC'

                                    return (
                                        <div key={product.id} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                                <div className="col-span-2 md:col-span-1">
                                                    <p className="text-xs text-amber-700">Ürün Adı</p>
                                                    <p className="text-amber-900 font-medium">{product.productName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-amber-700">Sipariş</p>
                                                    <p className="text-amber-900 font-medium">{totalQty}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-amber-700">Kabul</p>
                                                    <p className="text-green-600 font-medium">{acceptedQty}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-amber-700">Durum</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {shippedQty > 0 && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                ✓ {shippedQty} Sevk
                                                            </span>
                                                        )}
                                                        {pendingShipQty > 0 && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse">
                                                                ⏳ {pendingShipQty} Onayda
                                                            </span>
                                                        )}
                                                        {availableQty > 0 && isCustomerSpecific && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                📦 {availableQty} Hazır
                                                            </span>
                                                        )}
                                                        {pendingReceiptQty > 0 && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                                                🔄 {pendingReceiptQty} Kabul Onayda
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Price Details - Only for Admin/Manager */}
                                            {/* Price Details Accordion - Only for Admin/Manager */}
                                            {isAdminOrManager && (product.grossPrice || product.netPrice) && (
                                                <div className="mt-3">
                                                    <button
                                                        onClick={() => togglePriceDetails(product.id)}
                                                        className="w-full flex items-center justify-between p-2 bg-amber-100/50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors"
                                                    >
                                                        <span className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                                                            💰 Fiyat Bilgileri (Sadece Yöneticiler)
                                                        </span>
                                                        <span className={`text-amber-600 transition-transform ${expandedPriceDetails[product.id] ? 'rotate-180' : ''}`}>
                                                            ▼
                                                        </span>
                                                    </button>
                                                    {expandedPriceDetails[product.id] && (
                                                        <div className="mt-2 p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
                                                            {/* Row 1: Main prices */}
                                                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                                                                <div className="bg-white/70 p-2 rounded border border-amber-200">
                                                                    <p className="text-amber-700 text-[10px]">Brüt Fiyat</p>
                                                                    <p className="font-bold text-amber-900">₺{Number(product.grossPrice || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div className="bg-white/70 p-2 rounded border border-amber-200">
                                                                    <p className="text-amber-700 text-[10px]">Net Fiyat</p>
                                                                    <p className="font-bold text-amber-900">₺{Number(product.netPrice || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div className="bg-white/70 p-2 rounded border border-amber-200">
                                                                    <p className="text-amber-700 text-[10px]">Sabit İskonto</p>
                                                                    <p className="font-semibold text-amber-900">₺{Number(product.fixedDiscount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div className="bg-white/70 p-2 rounded border border-amber-200">
                                                                    <p className="text-amber-700 text-[10px]">Nakit İskonto</p>
                                                                    <p className="font-semibold text-amber-900">₺{Number(product.cashDiscount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div className="bg-white/70 p-2 rounded border border-amber-200">
                                                                    <p className="text-amber-700 text-[10px]">Teşhir İskonto</p>
                                                                    <p className="font-semibold text-amber-900">₺{Number(product.displayDiscount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div className="bg-white/70 p-2 rounded border border-amber-200">
                                                                    <p className="text-amber-700 text-[10px]">KDV (%)</p>
                                                                    <p className="font-semibold text-amber-900">{Number(product.vat || 0) * 100}</p>
                                                                </div>
                                                            </div>
                                                            {/* Row 2: Discounts */}
                                                            <div className="grid grid-cols-5 gap-2 text-xs mt-2">
                                                                <div className="bg-orange-100/50 p-2 rounded border border-orange-300">
                                                                    <p className="text-orange-700 text-[10px]">İskonto 1</p>
                                                                    <p className="font-semibold text-orange-900">₺{Number(product.discount1 || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div className="bg-orange-100/50 p-2 rounded border border-orange-300">
                                                                    <p className="text-orange-700 text-[10px]">İskonto 2</p>
                                                                    <p className="font-semibold text-orange-900">₺{Number(product.discount2 || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div className="bg-orange-100/50 p-2 rounded border border-orange-300">
                                                                    <p className="text-orange-700 text-[10px]">İskonto 3</p>
                                                                    <p className="font-semibold text-orange-900">₺{Number(product.discount3 || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div className="bg-orange-100/50 p-2 rounded border border-orange-300">
                                                                    <p className="text-orange-700 text-[10px]">İskonto 4</p>
                                                                    <p className="font-semibold text-orange-900">₺{Number(product.discount4 || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div className="bg-orange-100/50 p-2 rounded border border-orange-300">
                                                                    <p className="text-orange-700 text-[10px]">İskonto 5</p>
                                                                    <p className="font-semibold text-orange-900">₺{Number(product.discount5 || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                            </div>
                                                            {/* Row 3: Calculated values */}
                                                            <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                                                                <div className="bg-amber-100/50 p-2 rounded border border-amber-300">
                                                                    <p className="text-amber-700 text-[10px]">KDV Tutar</p>
                                                                    <p className="font-semibold text-amber-900">₺{(Number(product.netPrice || 0) * Number(product.vat || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div className="bg-amber-100/50 p-2 rounded border border-amber-300">
                                                                    <p className="text-amber-700 text-[10px]">KDV Dahil Fiyat</p>
                                                                    <p className="font-bold text-amber-900">₺{(Number(product.netPrice || 0) * (1 + Number(product.vat || 0))).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                                <div className="bg-amber-100/50 p-2 rounded border border-amber-300">
                                                                    <p className="text-amber-700 text-[10px]">Kalan Tutar</p>
                                                                    <p className="font-semibold text-amber-900">₺{(Number(product.grossPrice || 0) - Number(product.netPrice || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                            </div>
                                                            {product.paymentConditionDefinition && (
                                                                <div className="mt-2 pt-2 border-t border-amber-300">
                                                                    <span className="text-xs text-amber-700">Ödeme Koşulu:</span>
                                                                    <span className="ml-1 text-xs font-medium text-amber-900">{product.paymentConditionDefinition}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {/* Acceptance Progress */}
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-xs text-amber-700 mb-1">
                                                    <span>Kabul İlerlemesi</span>
                                                    <div className="flex gap-2">
                                                        <span>{Math.round(((Number(acceptedQty)) / Number(totalQty)) * 100)}%</span>
                                                        {pendingReceiptQty > 0 && <span className="text-yellow-400">({Math.round(((Number(acceptedQty) + pendingReceiptQty) / Number(totalQty)) * 100)}%)</span>}
                                                    </div>
                                                </div>
                                                <div className="w-full bg-amber-200/50 rounded-full h-2 flex overflow-hidden border border-amber-300">
                                                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all" style={{ width: `${Math.min(((Number(acceptedQty)) / Number(totalQty)) * 100, 100)}%` }} />
                                                    {pendingReceiptQty > 0 && (
                                                        <div className="bg-yellow-500/50 h-full transition-all striped-bg" style={{ width: `${Math.min((pendingReceiptQty / Number(totalQty)) * 100, 100)}%` }} />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Shipment Progress - Only for Customer Specific Orders */}
                                            {isCustomerSpecific && acceptedQty > 0 && (
                                                <>
                                                    <div className="mt-3">
                                                        <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                                                            <span>Sevk İlerlemesi</span>
                                                            <div className="flex gap-2">
                                                                <span>{Math.round((shippedQty / acceptedQty) * 100)}%</span>
                                                                {pendingShipQty > 0 && <span className="text-cyan-500">({Math.round(((shippedQty + pendingShipQty) / acceptedQty) * 100)}%)</span>}
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-blue-200/50 rounded-full h-2 flex overflow-hidden border border-blue-300">
                                                            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 h-full transition-all" style={{ width: `${Math.min((shippedQty / acceptedQty) * 100, 100)}%` }} />
                                                            {pendingShipQty > 0 && (
                                                                <div className="bg-cyan-400/50 h-full transition-all striped-bg" style={{ width: `${Math.min((pendingShipQty / acceptedQty) * 100, 100)}%` }} />
                                                            )}
                                                        </div>
                                                    </div>

                                                </>
                                            )}
                                        </div>
                                    )
                                })}</div>
                        </div>

                        {/* Activities */}
                        <div className="flex-1 backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6 flex flex-col">
                            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5" />
                                Sipariş Olayları ({activities.length})
                            </h3>
                            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                                {activities.length > 0 ? (
                                    activities.map((activity, index) => (
                                        <div key={activity.id} className="relative pl-6">
                                            {index !== activities.length - 1 && <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 to-transparent" />}
                                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-amber-600 border-2 border-white" />
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <p className="text-amber-900 font-medium text-sm">{activity.description}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-amber-700">
                                                            <span className="flex items-center gap-1">
                                                                <User className="w-3 h-3" />
                                                                {activity.userFullName || activity.userEmail}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr })} · {new Date(activity.createdAt).toLocaleDateString('tr-TR')} - {new Date(activity.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-purple-400 font-mono">
                                                        {(() => {
                                                            const labels: Record<string, string> = {
                                                                'CREATED': 'Oluşturuldu', 'UPDATED': 'Güncellendi', 'STATUS_CHANGED': 'Durum Değişti',
                                                                'COMPLETED': 'Tamamlandı', 'CANCELLED': 'İptal Edildi', 'INVOICE_UPLOADED': 'Fatura Yüklendi',
                                                                'INVOICE_DELETED': 'Fatura Silindi', 'PRODUCTS_ACCEPTED': 'Ürünler Kabul Edildi',
                                                                'PRODUCT_ACCEPTED': 'Ürün Kabul Edildi', 'SHIPMENT_CREATED': 'Sevkiyat Oluşturuldu',
                                                                'SHIPMENT_UPDATED': 'Sevkiyat Güncellendi', 'NOTE_ADDED': 'Not Eklendi',
                                                                'NOTE_STRIKETHROUGH': 'Not Çizildi', 'ORDER_UPDATED': 'Sipariş Güncellendi', 'SHIPMENT_APPROVED': 'Sevk Onaylandı'
                                                            }
                                                            return labels[activity.activityType] || activity.activityType.replace(/_/g, ' ')
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-amber-700 py-8">Henüz aktivite bulunmuyor</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>


                {/* Sales Consultant Selection Modal */}
                {showSalesConsultantModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-bold text-amber-900 mb-4">Satış Danışmanı Seç</h3>
                            <select
                                value={selectedConsultantId}
                                onChange={(e) => setSelectedConsultantId(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
                            >
                                <option value="">-- Seçiniz (Kaldır) --</option>
                                {salesConsultants.map(sc => (
                                    <option key={sc.id} value={sc.id}>
                                        {sc.firstName} {sc.lastName}
                                    </option>
                                ))}
                            </select>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSalesConsultantModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSaveSalesConsultant}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all font-medium"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Shipment Modal */}
                {showShipmentModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-blue-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b border-blue-100">
                                <h3 className="text-xl font-bold text-blue-900">Kısmi Sevk Talebi</h3>
                                <p className="text-sm text-blue-600 mt-1">Sevk etmek istediğiniz ürünlerin miktarını giriniz.</p>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                {/* Products List */}
                                <div className="space-y-4">
                                    {shippableProducts.map(product => {
                                        const accepted = product.acceptedQuantity || 0
                                        const effectiveRemaining = getEffectiveRemaining(product)
                                        const currentQty = shipmentQuantities[product.id] || 0

                                        return (
                                            <div key={product.id} className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-blue-900">{product.productName}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-sm">
                                                            <span className="text-blue-600">Sevk Edilebilir: <span className="font-bold">{effectiveRemaining}</span></span>
                                                            <span className="text-gray-400">|</span>
                                                            <span className="text-gray-600">Kabul: {accepted}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full md:w-32">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={effectiveRemaining}
                                                            value={currentQty}
                                                            onChange={(e) => {
                                                                const val = Math.min(Math.max(0, Number(e.target.value)), effectiveRemaining)
                                                                setShipmentQuantities(prev => ({ ...prev, [product.id]: val }))
                                                            }}
                                                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-medium"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-blue-900 mb-2">
                                        Notlar (Opsiyonel)
                                    </label>
                                    <textarea
                                        value={shipmentNotes}
                                        onChange={(e) => setShipmentNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Sevk ile ilgili notlar..."
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-blue-100 bg-gray-50 rounded-b-2xl flex gap-3">
                                <button
                                    onClick={() => setShowShipmentModal(false)}
                                    disabled={isCreatingShipment}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSubmitShipment}
                                    disabled={isCreatingShipment}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-700 text-white rounded-lg hover:from-blue-700 hover:to-cyan-800 transition-all font-medium disabled:opacity-50 shadow-lg shadow-blue-500/30"
                                >
                                    {isCreatingShipment ? 'Gönderiliyor...' : 'Sevke Sun'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Brand Update Modal */}
                {showBrandModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-bold text-amber-900 mb-4">Marka Güncelle</h3>
                            <select
                                value={selectedBrandForUpdate}
                                onChange={(e) => setSelectedBrandForUpdate(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
                            >
                                <option value="">-- Marka Seçiniz --</option>
                                {BRANDS.map(brand => (
                                    <option key={brand} value={brand}>
                                        {brand}
                                    </option>
                                ))}
                            </select>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowBrandModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!selectedBrandForUpdate) {
                                            alert('Lütfen bir marka seçiniz')
                                            return
                                        }
                                        try {
                                            await updateBrand({
                                                orderId: id!,
                                                brand: selectedBrandForUpdate
                                            }).unwrap()
                                            setShowBrandModal(false)
                                            alert('Marka başarıyla güncellendi')
                                            refetch()
                                        } catch (error) {
                                            console.error('Failed to update brand:', error)
                                            alert('Güncelleme başarısız oldu')
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all font-medium"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Customer Modal */}
                {order?.customer && (
                    <CustomerModal
                        isOpen={showCustomerModal}
                        onClose={() => {
                            setShowCustomerModal(false)
                            refetch()
                        }}
                        customer={order.customer}
                    />
                )}

                {/* SSH Order Modal - Opens from problematic shipment button */}
                {showSshOrderModal && selectedProblemShipment && order && (
                    <AddOrderModal
                        isOpen={showSshOrderModal}
                        onClose={() => {
                            setShowSshOrderModal(false)
                            setSelectedProblemShipment(null)
                            refetch()
                        }}
                        prefillData={{
                            orderType: 'AFTER_SALES_SERVICE',
                            customerId: order.customer?.id,
                            salesConsultantId: order.salesConsultant?.id,
                            brand: order.brand,
                            parentOrderId: order.id,
                            linkedShipmentId: selectedProblemShipment.shipmentId,
                            hidden: true,
                            problemType: selectedProblemShipment.problemType
                        }}
                    />
                )}

                <ConfirmModal
                    isOpen={showCancelConfirm}
                    onClose={() => setShowCancelConfirm(false)}
                    onCancel={() => setShowCancelConfirm(false)}
                    onConfirm={handleConfirmCancel}
                    title="Siparişi İptal Et"
                    message="Bu siparişi iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                    confirmText="Evet, İptal Et"
                    cancelText="Hayır, Vazgeç"
                    type="danger"
                />
            </div>
            {/* OTP Verification Modal */}
            <OtpVerificationModal
                isOpen={showOtpModal}
                onClose={() => {
                    setShowOtpModal(false)
                    setPendingAction(null)
                }}
                onVerify={() => {
                    setShowOtpModal(false)
                    if (pendingAction) {
                        pendingAction()
                        setPendingAction(null)
                    }
                }}
            />
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteOrder}
                title="Siparişi Sil"
                message="Bu işlem siparişi ve bağlı tüm sevkiyatları kalıcı olarak silecektir. Bu işlem geri alınamaz. Emin misiniz?"
                confirmText={isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
                cancelText="İptal"
                type="danger"
            />

            {/* Update Order Modal */}
            <UpdateOrderModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                onSubmit={handleUpdateOrder}
                isLoading={isUpdating}
                initialData={{
                    orderNo: order?.orderNo || '',
                    prosapContractNo: order?.prosapContractNo,
                    prosapContractNameSurname: order?.prosapContractNameSurname || '',
                    orderDate: order?.orderDate || '',
                    customerId: order?.customer?.id,
                    salesConsultantId: order?.salesConsultant?.id,
                    orderNotes: order?.orderNotes || undefined
                }}
            />
        </div>
    )
}
