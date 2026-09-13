import React, { useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    User, FileText, CheckCircle, Clock, XCircle,
    Download, Upload, ArrowLeft, Package, Activity, Eye, Truck
} from 'lucide-react'
import {
    useGetSaleQuery,
    useGetSaleEventsQuery,
    useUpdateStatusMutation,
    useUploadContractMutation,
    useDeleteContractMutation,
    SaleStatus,
} from '../../services/saleApi'
import CreateSaleShipmentModal from '../../components/sales/CreateSaleShipmentModal'
import { useTopbar } from '../../context/TopbarContext'
import { useToast } from '../../context/ToastContext'
import ConfirmModal from '../../components/common/ConfirmModal'

const SaleDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { setTopbarContent } = useTopbar()

    const { data: sale, isLoading, refetch } = useGetSaleQuery(id!, { skip: !id })
    const { data: events = [] } = useGetSaleEventsQuery(id!, { skip: !id })

    const [updateStatus, { isLoading: isUpdating }] = useUpdateStatusMutation()
    const [uploadContract, { isLoading: isUploading }] = useUploadContractMutation()
    const [deleteContract, { isLoading: isDeleting }] = useDeleteContractMutation()
    const { success, error } = useToast()
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

    const [isShipmentModalOpen, setIsShipmentModalOpen] = React.useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleStatusChange = async (newStatus: SaleStatus) => {
        if (!id) return
        try {
            await updateStatus({ id, status: newStatus }).unwrap()
            refetch()
            success('Durum güncellendi')
        } catch (err) {
            console.error('Failed to update status', err)
            error('Durum güncellenirken bir hata oluştu')
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !id) return

        try {
            await uploadContract({ id, file }).unwrap()
            refetch()
            success('Sözleşme başarıyla yüklendi')
        } catch (err) {
            console.error('Failed to upload contract', err)
            error('Sözleşme yüklenirken bir hata oluştu')
        }
    }

    const handleConfirmDelete = async () => {
        if (!id) return
        try {
            await deleteContract(id).unwrap()
            refetch()
            success('Sözleşme silindi')
            setShowDeleteConfirm(false)
        } catch (err) {
            console.error('Failed to delete contract', err)
            error('Sözleşme silinirken bir hata oluştu')
        }
    }

    const getStatusBadge = () => {
        if (!sale) return { label: 'Bilinmiyor', icon: Clock, className: 'bg-gray-500/30 text- border-gray-400/30' }

        const status = sale.status
        if (status === 'TAMAMLANDI') return { label: 'Tamamlandı', icon: CheckCircle, className: 'bg-green-500/30 text- border-green-400/30' }
        if (status === 'IPTAL_EDILDI') return { label: 'İptal Edildi', icon: XCircle, className: 'bg-red-500/30 text- border-red-400/30' }
        return { label: 'Devam Ediyor', icon: Clock, className: 'bg-blue-500/30 text- border-blue-400/30' }
    }

    useEffect(() => {
        if (sale) {
            const statusBadge = getStatusBadge()
            const StatusIcon = statusBadge.icon

            setTopbarContent({
                title: sale.saleNo,
                description: 'Satış Detayı',
                icon: <FileText className="w-8 h-8" />,
                showFiltersInTopbar: true,
                actions: (
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium border flex items-center gap-2 ${statusBadge.className}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusBadge.label}
                        </span>
                        {sale.status === SaleStatus.DEVAM_EDIYOR && (
                            <button
                                onClick={() => handleStatusChange(SaleStatus.IPTAL_EDILDI)}
                                disabled={isUpdating}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all disabled:opacity-50"
                            >
                                <XCircle className="w-4 h-4" />
                                <span className="hidden lg:inline">İptal Et</span>
                            </button>
                        )}

                        {/* Navigate to Shipments filtered by this sale */}
                        <button
                            onClick={() => navigate(`/shipment?search=${encodeURIComponent(sale.saleNo)}`)}
                            title="Bu satışın sevkiyatlarını gör"
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors text-sm"
                        >
                            <Truck className="w-4 h-4" />
                            <span className="hidden lg:inline">Sevkiyatlar</span>
                        </button>

                    </div>
                ),
                filters: (
                    <button onClick={() => navigate('/sales')} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Geri
                    </button>
                )
            })
        }

        return () => setTopbarContent(null)
    }, [sale, setTopbarContent, navigate, isUpdating])

    if (isLoading || !sale) {
        return <div className="flex items-center justify-center min-h-screen"><p className="text-white text-xl">Yükleniyor...</p></div>
    }

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('tr-TR')

    return (
        <div className="min-h-screen">
            <div className="p-6 space-y-6">
                {/* Sale Info Card */}
                <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-amber-700 mb-1">Satış No</p>
                            <p className="text-amber-900 font-medium">{sale.saleNo}</p>
                        </div>
                        <div>
                            <p className="text-xs text-amber-700 mb-1">Satış Tarihi</p>
                            <p className="text-amber-900 font-medium">{formatDate(sale.saleDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-amber-700 mb-1">Müşteri Adı</p>
                            <p className="text-amber-900 font-medium">{sale.customerName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-amber-700 mb-1">Satış Danışmanı</p>
                            <p className="text-amber-900 font-medium">{sale.salesConsultantName}</p>
                        </div>
                    </div>
                    {sale.contractNo && (
                        <div className="mt-4 pt-4 border-t border-amber-200">
                            <div>
                                <p className="text-xs text-amber-700 mb-1">Sözleşme No</p>
                                <p className="text-amber-900 font-medium">{sale.contractNo}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2 Column Layout: Left Fixed, Right Scrollable */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column - Fixed */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Customer Info */}
                        <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Müşteri Bilgileri
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-amber-700">Ad Soyad</p>
                                    <p className="text-amber-900 font-medium">{sale.customerName}</p>
                                </div>
                                {sale.customerPhone && (
                                    <div>
                                        <p className="text-xs text-amber-700">Telefon</p>
                                        <p className="text-amber-900">{sale.customerPhone}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contract */}
                        <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Sözleşme
                            </h3>
                            {sale.contractDownloadUrl ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-green-400"><CheckCircle className="w-5 h-5" /><span>Sözleşme mevcut</span></div>
                                    <div className="flex gap-2">
                                        <a href={`/api/files/view?path=${encodeURIComponent(sale.contractDownloadUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-900 rounded-lg hover:bg-purple-200 transition-colors border border-purple-400">
                                            <Eye className="w-4 h-4" />
                                            Görüntüle
                                        </a>
                                        <a href={`/api/files/download?path=${encodeURIComponent(sale.contractDownloadUrl)}`} download className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-900 rounded-lg hover:bg-blue-200 transition-colors border border-blue-400">
                                            <Download className="w-4 h-4" />
                                            İndir
                                        </a>
                                    </div>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        disabled={isDeleting}
                                        className="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Sözleşmeyi Sil
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-amber-700 mb-3">Henüz sözleşme yüklenmemiş</p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        onChange={handleFileUpload}
                                    />
                                    <label className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-900 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer border border-purple-400">
                                        <Upload className="w-4 h-4" />
                                        {isUploading ? 'Yükleniyor...' : 'Sözleşme Yükle'}
                                        <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Scrollable */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Products */}
                        <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Ürünler ({sale.products.length})
                                </h3>
                                {sale.status === SaleStatus.DEVAM_EDIYOR && (
                                    <button
                                        onClick={() => setIsShipmentModalOpen(true)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all text-sm font-medium shadow-md"
                                    >
                                        <Package className="w-4 h-4" />
                                        Sevke Sun
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {sale.products.map((product, index) => (
                                    <div key={index} className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-amber-900">{product.productName}</p>
                                                <p className="text-sm text-amber-600">Kod: {product.productCode}</p>
                                            </div>
                                            <p className="font-bold text-amber-900">{product.quantity} Adet</p>
                                        </div>

                                        {/* Shipment Progress */}
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                                                <span className="font-medium">Sevk İlerlemesi</span>
                                                <div className="flex gap-3">
                                                    <span className="text-amber-900"><span className="font-bold">{product.quantity}</span> Toplam</span>
                                                    {(product.pendingShipmentQuantity || 0) + (product.shippedQuantity || 0) > 0 && (
                                                        <span className="text-blue-700"><span className="font-bold">{(product.pendingShipmentQuantity || 0) + (product.shippedQuantity || 0)}</span> Sevkte</span>
                                                    )}
                                                    {(product.deliveredQuantity || 0) > 0 && (
                                                        <span className="text-green-700"><span className="font-bold">{product.deliveredQuantity}</span> Teslim</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 flex overflow-hidden border border-gray-200">
                                                {/* Delivered (Green) */}
                                                <div
                                                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all"
                                                    style={{ width: `${Math.min(((product.deliveredQuantity || 0) / product.quantity) * 100, 100)}%` }}
                                                    title={`${product.deliveredQuantity} Teslim Edildi`}
                                                />
                                                {/* Shipped (Blue) */}
                                                <div
                                                    className="bg-blue-500 h-full transition-all"
                                                    style={{ width: `${Math.min(((product.shippedQuantity || 0) / product.quantity) * 100, 100)}%` }}
                                                    title={`${product.shippedQuantity} Sevkte`}
                                                />
                                                {/* Pending (Orange Striped) */}
                                                <div
                                                    className="bg-orange-400 h-full transition-all striped-bg opacity-70"
                                                    style={{ width: `${Math.min(((product.pendingShipmentQuantity || 0) / product.quantity) * 100, 100)}%` }}
                                                    title={`${product.pendingShipmentQuantity} Onay Bekliyor`}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-sm pt-2 border-t border-amber-200/50">
                                            <span className="text-amber-700">Birim Fiyat: {product.unitPriceExcludingVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                                            <span className="font-bold text-amber-900">
                                                {product.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-amber-300">
                                <div className="flex justify-between items-center">
                                    <p className="text-amber-900 font-semibold">Genel Toplam</p>
                                    <p className="text-xl font-bold text-amber-900">{sale.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                                </div>
                            </div>
                        </div>

                        {/* Activities */}
                        <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">
                            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5" />
                                Satış Olayları ({events.length})
                            </h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {events.length > 0 ? (
                                    events.map((event, index) => (
                                        <div key={event.id} className="relative pl-6">
                                            {index !== events.length - 1 && <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 to-transparent" />}
                                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-amber-600 border-2 border-white" />
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <p className="text-amber-900 font-medium text-sm">{event.description}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-amber-700">
                                                            <span className="flex items-center gap-1">
                                                                <User className="w-3 h-3" />
                                                                {event.createdByName}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(event.createdAt).toLocaleString('tr-TR')}
                                                            </span>
                                                        </div>
                                                    </div>
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

                <CreateSaleShipmentModal
                    isOpen={isShipmentModalOpen}
                    onClose={() => setIsShipmentModalOpen(false)}
                    saleId={id!}
                    products={sale.products}
                    onSuccess={() => {
                        refetch()
                    }}
                />

                <ConfirmModal
                    isOpen={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    onCancel={() => setShowDeleteConfirm(false)}
                    onConfirm={handleConfirmDelete}
                    title="Sözleşmeyi Sil"
                    message="Sözleşme dosyasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                    confirmText="Sil"
                    cancelText="İptal"
                    type="danger"
                />
            </div>
        </div >
    )
}

export default SaleDetailsPage
