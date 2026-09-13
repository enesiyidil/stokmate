import { X, Package, Calendar, User, FileText, CheckCircle, XCircle, Clock, Upload, Download, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCancelOrderMutation, useAcceptProductsMutation, useUploadInvoiceMutation, useGetInvoiceUrlQuery, useGetOrderQuery } from '../../services/orderApi'
import { useGetOrderActivitiesQuery } from '../../services/orderActivityApi'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Props {
    orderId: string
    onClose: () => void
}

export default function OrderDetailsModal({ orderId, onClose }: Props) {
    const navigate = useNavigate()
    const { data: order, isLoading } = useGetOrderQuery(orderId)
    const { data: activities = [] } = useGetOrderActivitiesQuery(orderId)
    const [cancelOrder, { isLoading: isCanceling }] = useCancelOrderMutation()
    const [acceptProducts, { isLoading: isAccepting }] = useAcceptProductsMutation()
    const [uploadInvoice] = useUploadInvoiceMutation()
    const { data: invoiceData } = useGetInvoiceUrlQuery(orderId, { skip: !order?.hasInvoice })

    const handleCancelOrder = async () => {
        if (!confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) return
        try {
            await cancelOrder(order.id).unwrap()
        } catch (error) {
            console.error('Failed to cancel order:', error)
            alert('Sipariş iptal edilirken bir hata oluştu')
        }
    }

    const handleAcceptProducts = () => {
        navigate('/products/accept-order', {
            state: {
                orderId: order.id,
                orderNo: order.orderNo,
                products: order.products
            }
        })
        onClose()
    }

    const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            await uploadInvoice({ id: order.id, file: formData }).unwrap()
            alert('Fatura başarıyla yüklendi')
        } catch (error) {
            console.error('Failed to upload invoice:', error)
            alert('Fatura yüklenirken bir hata oluştu')
        }
    }

    if (isLoading || !order) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-12">
                    <p className="text-white">Yükleniyor...</p>
                </div>
            </div>
        )
    }

    const getStatusBadge = () => {
        switch (order.status) {
            case 'CREATED':
                return {
                    label: 'Oluşturuldu',
                    icon: Clock,
                    className: 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 border-purple-400/30'
                }
            case 'DEVAM_EDIYOR':
            case 'PENDING_ACCEPTANCE':
            case 'PARTIALLY_ACCEPTED':
            case 'PENDING_SHIPMENT_APPROVAL':
                return {
                    label: 'Devam Ediyor',
                    icon: Clock,
                    className: 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-200 border-blue-400/30'
                }
            case 'IN_SHIPMENT':
            case 'PARTIALLY_SHIPPED':
                return {
                    label: 'Sevkiyatta',
                    icon: Clock,
                    className: 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-200 border-yellow-400/30'
                }
            case 'TAMAMLANDI':
            case 'COMPLETED':
            case 'DELIVERED':
            case 'ACCEPTED':
            case 'SHIPMENT_APPROVED':
                return {
                    label: 'Tamamlandı',
                    icon: CheckCircle,
                    className: 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-200 border-green-400/30'
                }
            case 'IPTAL_EDILDI':
            case 'CANCELLED':
                return {
                    label: 'İptal Edildi',
                    icon: XCircle,
                    className: 'bg-gradient-to-r from-red-500/30 to-pink-500/30 text-red-200 border-red-400/30'
                }
            case 'PROBLEMATIC_DELIVERY':
            case 'SSH_ORDER_CREATED':
                return {
                    label: 'Özel Durum',
                    icon: Clock,
                    className: 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-orange-200 border-orange-400/30'
                }
            default:
                return {
                    label: 'Bilinmiyor',
                    icon: Clock,
                    className: 'bg-gradient-to-r from-gray-500/30 to-slate-500/30 text-gray-200 border-gray-400/30'
                }
        }
    }

    const statusBadge = getStatusBadge()
    const StatusIcon = statusBadge.icon


    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Package className="w-6 h-6" />
                            Sipariş Detayları
                        </h2>
                        <p className="text-purple-200 text-sm mt-1">{order.orderNo}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-purple-200" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
                    {/* Order Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-2 text-purple-300 mb-2">
                                <Package className="w-4 h-4" />
                                <p className="text-sm">Sipariş No</p>
                            </div>
                            <p className="text-white font-semibold">{order.orderNo}</p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-2 text-purple-300 mb-2">
                                <FileText className="w-4 h-4" />
                                <p className="text-sm">Sözleşme No</p>
                            </div>
                            <p className="text-white font-semibold">{order.prosapContractNo}</p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-2 text-purple-300 mb-2">
                                <User className="w-4 h-4" />
                                <p className="text-sm">Prosap Söz. Ad Soyad</p>
                            </div>
                            <p className="text-white font-semibold">{order.prosapContractNameSurname}</p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-2 text-purple-300 mb-2">
                                <Calendar className="w-4 h-4" />
                                <p className="text-sm">Sipariş Tarihi</p>
                            </div>
                            <p className="text-white font-semibold">
                                {new Date(order.orderDate).toLocaleDateString('tr-TR')}
                            </p>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl">
                            <p className="text-sm text-purple-300 mb-2">Durum</p>
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium border flex items-center gap-2 w-fit ${statusBadge.className}`}>
                                <StatusIcon className="w-4 h-4" />
                                {statusBadge.label}
                            </span>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl">
                            <p className="text-sm text-purple-300 mb-2">Ürünler Kabul Edildi</p>
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${order.productsAccepted
                                ? 'bg-green-500/20 text-green-200'
                                : 'bg-yellow-500/20 text-yellow-200'
                                }`}>
                                {order.productsAccepted ? 'Evet' : 'Hayır'}
                            </span>
                        </div>
                    </div>

                    {/* Customer Info (if customer-specific) */}
                    {order.customer && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-3">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Müşteri Bilgileri (Müşteriye Özel Sipariş)
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div>
                                    <p className="text-xs text-purple-300">Ad Soyad</p>
                                    <p className="text-white font-medium">{order.customer.firstName} {order.customer.lastName}</p>
                                </div>
                                {order.customer.phone && (
                                    <div>
                                        <p className="text-xs text-purple-300">Telefon</p>
                                        <p className="text-white">{order.customer.phone}</p>
                                    </div>
                                )}
                                {order.customer.email && (
                                    <div>
                                        <p className="text-xs text-purple-300">E-posta</p>
                                        <p className="text-white">{order.customer.email}</p>
                                    </div>
                                )}
                                {order.customer.city && (
                                    <div>
                                        <p className="text-xs text-purple-300">Şehir</p>
                                        <p className="text-white">{order.customer.city}</p>
                                    </div>
                                )}
                                {order.customer.fullAddress && (
                                    <div className="col-span-2 md:col-span-3">
                                        <p className="text-xs text-purple-300">Tam Adres</p>
                                        <p className="text-white">{order.customer.fullAddress}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Products */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white">Ürünler ({order.products.length})</h3>
                        <div className="space-y-2">
                            {order.products.map((product) => (
                                <div key={product.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div>
                                            <p className="text-xs text-purple-300">Ürün Kodu</p>
                                            <p className="text-white font-medium">{product.productCode}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-purple-300">Ürün Adı</p>
                                            <p className="text-white">{product.productName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-purple-300">Toplam Miktar</p>
                                            <p className="text-white font-medium">{product.quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-purple-300">Kabul Edilen</p>
                                            <p className="text-green-400 font-medium">{product.acceptedQuantity || 0}</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-xs text-purple-300 mb-1">
                                            <span>Kabul İlerlemesi</span>
                                            <span>{Math.round(((product.acceptedQuantity || 0) / product.quantity) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
                                                style={{ width: `${Math.min(((product.acceptedQuantity || 0) / product.quantity) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activities Timeline */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Sipariş Olayları ({activities.length})
                        </h3>
                        <div className="space-y-3">
                            {activities.length > 0 ? (
                                activities.map((activity, index) => (
                                    <div key={activity.id} className="relative pl-6">
                                        {index !== activities.length - 1 && (
                                            <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 to-transparent" />
                                        )}
                                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-purple-500 border-2 border-slate-900" />
                                        <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <p className="text-white font-medium text-sm">{activity.description}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-purple-300">
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            {activity.userFullName || activity.userEmail}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-purple-400 font-mono">
                                                    {(() => {
                                                        const labels: Record<string, string> = {
                                                            'CREATED': 'Oluşturuldu',
                                                            'UPDATED': 'Güncellendi',
                                                            'STATUS_CHANGED': 'Durum Değişti',
                                                            'COMPLETED': 'Tamamlandı',
                                                            'CANCELLED': 'İptal Edildi',
                                                            'INVOICE_UPLOADED': 'Fatura Yüklendi',
                                                            'INVOICE_DELETED': 'Fatura Silindi',
                                                            'PRODUCTS_ACCEPTED': 'Ürünler Kabul Edildi',
                                                            'PRODUCT_ACCEPTED': 'Ürün Kabul Edildi',
                                                            'SHIPMENT_CREATED': 'Sevkiyat Oluşturuldu',
                                                            'SHIPMENT_UPDATED': 'Sevkiyat Güncellendi',
                                                            'NOTE_ADDED': 'Not Eklendi'
                                                        }
                                                        return labels[activity.activityType] || activity.activityType.replace(/_/g, ' ')
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-purple-300 text-sm">
                                    Henüz olay kaydı yok
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Invoice Section */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white">Fatura</h3>
                        {order.hasInvoice ? (
                            <div className="p-4 bg-green-500/20 border border-green-400/30 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-green-400" />
                                    <div>
                                        <p className="text-white font-medium">Fatura yüklendi</p>
                                        <p className="text-sm text-green-200">Faturayı görüntülemek için indirin</p>
                                    </div>
                                </div>
                                {invoiceData && (
                                    <a
                                        href={invoiceData.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500/30 text-green-200 rounded-lg hover:bg-green-500/40 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        İndir
                                    </a>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <label className="cursor-pointer flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleInvoiceUpload}
                                        className="hidden"
                                    />
                                    <div className="flex items-center gap-3 flex-1">
                                        <Upload className="w-6 h-6 text-purple-300" />
                                        <div>
                                            <p className="text-white font-medium">Fatura Yükle</p>
                                            <p className="text-sm text-purple-300">PDF formatında fatura yükleyin</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-3 p-6 border-t border-white/10">
                    <div className="flex gap-2">
                        {order.status === 'DEVAM_EDIYOR' && (
                            <button
                                onClick={handleCancelOrder}
                                disabled={isCanceling}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all disabled:opacity-50"
                            >
                                <XCircle className="w-4 h-4" />
                                İptal Et
                            </button>
                        )}

                        {order.status === 'TAMAMLANDI' && !order.productsAccepted && (
                            <button
                                onClick={handleAcceptProducts}
                                disabled={isAccepting}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Ürünleri Kabul Et
                            </button>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white/10 text-purple-200 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    )
}
