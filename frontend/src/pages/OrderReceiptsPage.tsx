import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Package, Image as ImageIcon, Truck, User, ClipboardCheck, Plus } from 'lucide-react'
import { useListOrderReceiptsQuery, useApproveOrderReceiptMutation, useRejectOrderReceiptMutation, type OrderReceiptStatus, type OrderReceiptResponse } from '../services/orderReceiptApi'
import { useAppSelector } from '../hooks/useAuth'
import { useTopbar } from '../context/TopbarContext'
import AddOrderReceiptModal from '../components/orders/AddOrderReceiptModal'
import AddProductModal from '../components/products/AddProductModal'
import { useGetProductQuery } from '../services/productApi'

export default function OrderReceiptsPage() {
    const [statusFilter, setStatusFilter] = useState<OrderReceiptStatus | 'ALL'>('ALL')
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [enrichProductId, setEnrichProductId] = useState<string | null>(null)
    const { data: productToEnrich } = useGetProductQuery(enrichProductId!, { skip: !enrichProductId })

    const currentUser = useAppSelector((state) => state.auth.user)
    const canApprove = currentUser?.role === 'ADMIN' || currentUser?.role === 'MUDUR' || currentUser?.role === 'DEPO_SORUMLU'
    const { setTopbarContent } = useTopbar()

    const { data: receipts = [], isLoading, refetch } = useListOrderReceiptsQuery({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
    })

    const [approveReceipt] = useApproveOrderReceiptMutation()
    const [rejectReceipt] = useRejectOrderReceiptMutation()

    // Set topbar content with filters
    useEffect(() => {
        setTopbarContent({
            title: 'Ürün Kabuller',
            description: 'Ürün kabul işlemlerini görüntüleyin ve yönetin',
            icon: <ClipboardCheck className="w-6 h-6" />,
            actions: (
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    <span>Ürün Kabul Et</span>
                </button>
            ),
            filters: (
                <>
                    {(['ALL', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${statusFilter === status
                                ? status === 'ALL'
                                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                                    : status === 'PENDING_APPROVAL'
                                        ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-md'
                                        : status === 'APPROVED'
                                            ? 'bg-gradient-to-r from-green-700 to-emerald-700 text-white shadow-md'
                                            : 'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-md'
                                : 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/50'
                                }`}
                        >
                            {status === 'ALL' ? 'Tümü' :
                                status === 'PENDING_APPROVAL' ? 'Onay Bekleyenler' :
                                    status === 'APPROVED' ? 'Onaylananlar' : 'Reddedilenler'}
                        </button>
                    ))}
                </>
            ),
        })

        return () => setTopbarContent(null)
    }, [setTopbarContent, statusFilter])

    const handleApprove = async (id: string) => {
        if (!confirm('Bu kabulü onaylamak istediğinizden emin misiniz?')) return

        try {
            await approveReceipt({ id }).unwrap()
            refetch()
        } catch (error) {
            console.error('Failed to approve receipt:', error)
            alert('Onaylama sırasında bir hata oluştu')
        }
    }

    const handleReject = async (id: string) => {
        const notes = prompt('Ret nedeni (isteğe bağlı):')

        try {
            await rejectReceipt({
                id,
                request: notes ? { approvalNotes: notes } : undefined
            }).unwrap()
            refetch()
        } catch (error) {
            console.error('Failed to reject receipt:', error)
            alert('Reddetme sırasında bir hata oluştu')
        }
    }

    const getStatusBadge = (status: OrderReceiptStatus) => {
        switch (status) {
            case 'PENDING_APPROVAL':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-400">
                        <Clock className="w-3 h-3" />
                        Onay Bekliyor
                    </span>
                )
            case 'APPROVED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Onaylandı
                    </span>
                )
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium border border-red-400">
                        <XCircle className="w-3 h-3" />
                        Reddedildi
                    </span>
                )
        }
    }

    return (
        <div className="p-6 space-y-6">
            <AddOrderReceiptModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={(receipt?: OrderReceiptResponse) => {
                    refetch()
                    // If STOCK order and productId is available, open product enrichment modal
                    if (receipt?.productId) {
                        setEnrichProductId(receipt.productId)
                    }
                    setIsAddModalOpen(false)
                }}
            />

            {/* Product Enrichment Modal */}
            {enrichProductId && productToEnrich && (
                <AddProductModal
                    product={productToEnrich}
                    onClose={() => setEnrichProductId(null)}
                    onSuccess={() => {
                        setEnrichProductId(null)
                        refetch()
                    }}
                />
            )}

            {/* Receipts List */}
            {isLoading ? (
                <div className="text-center py-12 text-amber-700">Yükleniyor...</div>
            ) : receipts.length === 0 ? (
                <div className="text-center py-12">
                    <Package className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                    <p className="text-amber-700">Henüz kabul kaydı bulunmuyor</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {[...receipts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((receipt) => (
                        <div
                            key={receipt.id}
                            className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-xl p-6 hover:border-amber-400 transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-amber-900">
                                            {receipt.productName}
                                        </h3>
                                        {getStatusBadge(receipt.status)}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-amber-700">Sipariş:</span>
                                            <span className="text-amber-900 ml-2">{receipt.orderNo}</span>
                                        </div>
                                        <div>
                                            <span className="text-amber-700">Ürün Kodu:</span>
                                            <span className="text-amber-900 ml-2">{receipt.productCode}</span>
                                        </div>
                                        <div>
                                            <span className="text-amber-700">Kabul Edilen:</span>
                                            <span className="text-green-300 ml-2 font-semibold">{receipt.receivedQuantity}</span>
                                        </div>
                                        <div>
                                            <span className="text-amber-700">Tarih:</span>
                                            <span className="text-amber-900 ml-2">
                                                {new Date(receipt.createdAt).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions for pending receipts */}
                                {canApprove && receipt.status === 'PENDING_APPROVAL' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(receipt.id)}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Onayla
                                        </button>
                                        <button
                                            onClick={() => handleReject(receipt.id)}
                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reddet
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Additional Info */}
                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-amber-200 text-sm">
                                {receipt.vehiclePlate && (
                                    <div className="flex items-center gap-2 text-amber-700">
                                        <Truck className="w-4 h-4" />
                                        <span>{receipt.vehiclePlate}</span>
                                    </div>
                                )}
                                {receipt.driverName && (
                                    <div className="flex items-center gap-2 text-amber-700">
                                        <User className="w-4 h-4" />
                                        <span>{receipt.driverName}</span>
                                    </div>
                                )}
                                {receipt.photos.length > 0 && (
                                    <div className="flex items-center gap-2 text-amber-700">
                                        <ImageIcon className="w-4 h-4" />
                                        <span>{receipt.photos.length} Fotoğraf</span>
                                    </div>
                                )}
                            </div>

                            {/* Receiver and Approver Info */}
                            <div className="mt-4 pt-4 border-t border-amber-200 text-xs">
                                <div className="flex justify-between text-amber-700">
                                    <div>
                                        <span>Kabul Eden: </span>
                                        <span className="text-amber-900">
                                            {receipt.receivedBy.firstName} {receipt.receivedBy.lastName} ({receipt.receivedBy.role})
                                        </span>
                                    </div>
                                    {receipt.approvedBy && (
                                        <div>
                                            <span>Onaylayan: </span>
                                            <span className="text-amber-900">
                                                {receipt.approvedBy.firstName} {receipt.approvedBy.lastName}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Photos Preview */}
                            {receipt.photos.length > 0 && selectedReceipt === receipt.id && (
                                <div className="mt-4 grid grid-cols-4 gap-2">
                                    {receipt.photos.map((photo) => (
                                        <a
                                            key={photo.id}
                                            href={photo.downloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block"
                                        >
                                            <img
                                                src={photo.downloadUrl}
                                                alt={photo.fileName}
                                                className="w-full h-24 object-cover rounded-lg border border-amber-200 hover:border-amber-400 transition-all"
                                            />
                                        </a>
                                    ))}
                                </div>
                            )}

                            {receipt.photos.length > 0 && (
                                <button
                                    onClick={() => setSelectedReceipt(selectedReceipt === receipt.id ? null : receipt.id)}
                                    className="mt-4 text-amber-700 hover:text-amber-900 text-sm transition-colors font-medium"
                                >
                                    {selectedReceipt === receipt.id ? 'Fotoğrafları Gizle' : 'Fotoğrafları Göster'}
                                </button>
                            )}

                            {/* Notes */}
                            {receipt.notes && (
                                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <span className="text-xs text-amber-700 font-medium">Not: </span>
                                    <span className="text-sm text-amber-900">{receipt.notes}</span>
                                </div>
                            )}

                            {/* Approval Notes */}
                            {receipt.approvalNotes && (
                                <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                                    <span className="text-xs text-yellow-700 font-medium">Onay Notu: </span>
                                    <span className="text-sm text-yellow-900">{receipt.approvalNotes}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
