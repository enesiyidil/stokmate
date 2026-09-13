import { useRef } from 'react'
import { X, Package, Truck, User, Calendar, FileText, CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react'
import type { OrderReceiptResponse } from '../../services/orderReceiptApi'

interface OrderReceiptDetailModalProps {
    isOpen: boolean
    onClose: () => void
    receipt: OrderReceiptResponse | null
}

export default function OrderReceiptDetailModal({ isOpen, onClose, receipt }: OrderReceiptDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)

    if (!isOpen || !receipt) return null

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose()
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-200">
                        <CheckCircle className="w-4 h-4" />
                        Onaylandı
                    </span>
                )
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold border border-red-200">
                        <XCircle className="w-4 h-4" />
                        Reddedildi
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold border border-yellow-200">
                        <Clock className="w-4 h-4" />
                        Onay Bekliyor
                    </span>
                )
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-white/95 border border-amber-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-amber-200/50 flex items-center justify-between bg-amber-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-amber-900">Ürün Kabul Detayı</h2>
                            <p className="text-sm text-amber-700">Sipariş No: <span className="font-mono font-medium">{receipt.orderNo}</span></p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-amber-100/50 rounded-lg text-amber-700 hover:text-amber-900 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Main Info Section */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Column: Product Info */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-amber-600" />
                                    Ürün Bilgileri
                                </h3>
                                <div className="bg-white border border-amber-100 rounded-xl p-4 space-y-3 shadow-sm">
                                    <div>
                                        <p className="text-xs text-amber-600 font-medium">Ürün Adı</p>
                                        <p className="text-amber-900 font-semibold">{receipt.productName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-amber-600 font-medium">Ürün Kodu</p>
                                        <p className="text-amber-900 font-mono text-sm">{receipt.productCode}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-xs text-amber-600 font-medium">Kabul Edilen Miktar</p>
                                            <p className="text-2xl font-bold text-amber-900">{receipt.receivedQuantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-600 font-medium">Durum</p>
                                            <div className="mt-1">{getStatusBadge(receipt.status)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                    Zaman Bilgileri
                                </h3>
                                <div className="bg-white border border-amber-100 rounded-xl p-4 space-y-2 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-amber-700">Kabul Tarihi:</span>
                                        <span className="font-medium text-amber-900">
                                            {new Date(receipt.createdAt).toLocaleString('tr-TR')}
                                        </span>
                                    </div>
                                    {receipt.updatedAt && receipt.updatedAt !== receipt.createdAt && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-amber-700">Son Güncelleme:</span>
                                            <span className="font-medium text-amber-900">
                                                {new Date(receipt.updatedAt).toLocaleString('tr-TR')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Logistics & People */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-amber-600" />
                                    Lojistik & Teslimat
                                </h3>
                                <div className="bg-white border border-amber-100 rounded-xl p-4 space-y-3 shadow-sm">
                                    <div>
                                        <p className="text-xs text-amber-600 font-medium">Araç Plakası</p>
                                        <p className="text-amber-900 font-medium">{receipt.vehiclePlate || '-'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-amber-600 font-medium">Şoför Adı</p>
                                            <p className="text-amber-900 font-medium">{receipt.driverName || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-600 font-medium">Şoför Telefon</p>
                                            <p className="text-amber-900 font-medium">{receipt.driverPhone || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4 text-amber-600" />
                                    İlgili Kişiler
                                </h3>
                                <div className="bg-white border border-amber-100 rounded-xl p-4 space-y-3 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs ring-2 ring-white">
                                            {receipt.receivedBy?.firstName?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-xs text-amber-600 font-medium">Kabul Eden</p>
                                            <p className="text-sm text-amber-900 font-semibold">{receipt.receivedBy?.firstName} {receipt.receivedBy?.lastName}</p>
                                            <p className="text-xs text-amber-500">{receipt.receivedBy?.role}</p>
                                        </div>
                                    </div>
                                    {receipt.approvedBy && (
                                        <div className="flex items-center gap-3 pt-3 border-t border-amber-50">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs ring-2 ring-white">
                                                {receipt.approvedBy?.firstName?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xs text-green-600 font-medium">Onaylayan</p>
                                                <p className="text-sm text-amber-900 font-semibold">{receipt.approvedBy.firstName} {receipt.approvedBy.lastName}</p>
                                                <p className="text-xs text-amber-500">{receipt.approvedBy.role}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    {(receipt.notes || receipt.approvalNotes) && (
                        <div>
                            <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-600" />
                                Notlar
                            </h3>
                            <div className="grid gap-4">
                                {receipt.notes && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 relative">
                                        <p className="text-xs text-amber-600 font-bold uppercase mb-1">Kabul Notu</p>
                                        <p className="text-amber-900">{receipt.notes}</p>
                                    </div>
                                )}
                                {receipt.approvalNotes && (
                                    <div className={`border rounded-xl p-4 relative ${receipt.status === 'REJECTED' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                                        }`}>
                                        <p className={`text-xs font-bold uppercase mb-1 ${receipt.status === 'REJECTED' ? 'text-red-600' : 'text-green-600'
                                            }`}>{receipt.status === 'REJECTED' ? 'Ret Nedeni' : 'Onay Notu'}</p>
                                        <p className={`${receipt.status === 'REJECTED' ? 'text-red-900' : 'text-green-900'}`}>
                                            {receipt.approvalNotes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Photos Section */}
                    {receipt.photos && receipt.photos.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-amber-600" />
                                Fotoğraflar ({receipt.photos.length})
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {receipt.photos.map((photo) => (
                                    <a
                                        key={photo.id}
                                        href={`/api/files/view?path=${encodeURIComponent(photo.downloadUrl)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative aspect-square rounded-xl overflow-hidden border border-amber-200 hover:border-amber-400 transition-all shadow-sm hover:shadow-md"
                                    >
                                        <img
                                            src={`/api/files/view?path=${encodeURIComponent(photo.downloadUrl)}`}
                                            alt="Receipt Photo"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <div className="bg-white/90 rounded-full p-2 shadow-lg backdrop-blur-sm">
                                                <ImageIcon className="w-5 h-5 text-amber-900" />
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
