import React, { useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    User, FileText, CheckCircle, Clock, XCircle,
    Download, Upload, ArrowLeft, Package, Activity, Eye
} from 'lucide-react'
import {
    useGetSaleQuery,
    useGetSaleEventsQuery,
    useUpdateStatusMutation,
    useUploadContractMutation,
    useDeleteContractMutation,
    SaleStatus,
} from '../../services/saleApi'
import { useTopbar } from '../../context/TopbarContext'

const SaleDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { setTopbarContent } = useTopbar()

    const { data: sale, isLoading, refetch } = useGetSaleQuery(id!, { skip: !id })
    const { data: events = [] } = useGetSaleEventsQuery(id!, { skip: !id })

    const [updateStatus, { isLoading: isUpdating }] = useUpdateStatusMutation()
    const [uploadContract, { isLoading: isUploading }] = useUploadContractMutation()
    const [deleteContract, { isLoading: isDeleting }] = useDeleteContractMutation()

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleStatusChange = async (newStatus: SaleStatus) => {
        if (!id) return
        try {
            await updateStatus({ id, status: newStatus }).unwrap()
            refetch()
            alert('Durum güncellendi')
        } catch (error) {
            console.error('Failed to update status', error)
            alert('Durum güncellenirken bir hata oluştu')
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !id) return

        try {
            await uploadContract({ id, file }).unwrap()
            refetch()
            alert('Sözleşme başarıyla yüklendi')
        } catch (error) {
            console.error('Failed to upload contract', error)
            alert('Sözleşme yüklenirken bir hata oluştu')
        }
    }

    const handleContractDelete = async () => {
        if (!id || !confirm('Sözleşme dosyasını silmek istediğinize emin misiniz?')) return
        try {
            await deleteContract(id).unwrap()
            refetch()
            alert('Sözleşme silindi')
        } catch (error) {
            console.error('Failed to delete contract', error)
            alert('Sözleşme silinirken bir hata oluştu')
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
                            <>
                                <button
                                    onClick={() => handleStatusChange(SaleStatus.TAMAMLANDI)}
                                    disabled={isUpdating}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="hidden lg:inline">Tamamla</span>
                                </button>
                                <button
                                    onClick={() => handleStatusChange(SaleStatus.IPTAL_EDILDI)}
                                    disabled={isUpdating}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" />
                                    <span className="hidden lg:inline">İptal Et</span>
                                </button>
                            </>
                        )}
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
                                        <a href={sale.contractDownloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-900 rounded-lg hover:bg-purple-200 transition-colors border border-purple-400">
                                            <Eye className="w-4 h-4" />
                                            Görüntüle
                                        </a>
                                        <a href={sale.contractDownloadUrl} download className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-900 rounded-lg hover:bg-blue-200 transition-colors border border-blue-400">
                                            <Download className="w-4 h-4" />
                                            İndir
                                        </a>
                                    </div>
                                    <button
                                        onClick={handleContractDelete}
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
                            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2 mb-4">
                                <Package className="w-5 h-5" />
                                Ürünler ({sale.products.length})
                            </h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {sale.products.map((product, index) => (
                                    <div key={index} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="md:col-span-2">
                                                <p className="text-xs text-amber-700">Ürün Adı</p>
                                                <p className="text-amber-900 font-medium">{product.productName}</p>
                                                <p className="text-xs text-amber-500 font-mono mt-1">{product.productCode}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-amber-700">Miktar</p>
                                                <p className="text-amber-900 font-medium">{product.quantity}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-amber-700">Toplam</p>
                                                <p className="text-amber-900 font-medium">{product.totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                                            </div>
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
            </div>
        </div>
    )
}

export default SaleDetailsPage
