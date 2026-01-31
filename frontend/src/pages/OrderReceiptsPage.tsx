import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Package, Truck, User, ClipboardCheck, Plus, Eye } from 'lucide-react'
import { useListOrderReceiptsQuery, useApproveOrderReceiptMutation, useRejectOrderReceiptMutation, type OrderReceiptStatus, type OrderReceiptResponse } from '../services/orderReceiptApi'
import { useAppSelector } from '../hooks/useAuth'
import { useTopbar } from '../context/TopbarContext'
import AddOrderReceiptModal from '../components/orders/AddOrderReceiptModal'
import AddProductModal from '../components/products/AddProductModal'
import { useGetProductQuery } from '../services/productApi'
import FilterSearchBar from '../components/common/FilterSearchBar'
import { useGetUserSummariesQuery } from '../services/userApi'
import OrderReceiptDetailModal from '../components/orders/OrderReceiptDetailModal'
import OtpVerificationModal from '../components/common/OtpVerificationModal'
import ConfirmModal from '../components/common/ConfirmModal'

export default function OrderReceiptsPage() {
    const [searchParams] = useSearchParams()
    // Local filters
    const [statusFilter, setStatusFilter] = useState<'ALL' | OrderReceiptStatus>(
        (searchParams.get('status') as 'ALL' | OrderReceiptStatus) || 'ALL'
    )
    const [acceptedByFilter, setAcceptedByFilter] = useState<string>('ALL')
    const [approvedByFilter, setApprovedByFilter] = useState<string>('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [enrichProductId, setEnrichProductId] = useState<string | null>(null)
    const { data: productToEnrich } = useGetProductQuery(enrichProductId!, { skip: !enrichProductId })

    // 2FA Gate State
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

    // Modal States
    const [confirmModalState, setConfirmModalState] = useState<{ isOpen: boolean; receiptId: string | null }>({
        isOpen: false,
        receiptId: null
    })
    const [rejectModalState, setRejectModalState] = useState<{ isOpen: boolean; receiptId: string | null }>({
        isOpen: false,
        receiptId: null
    })
    const [rejectionNote, setRejectionNote] = useState('')

    const currentUser = useAppSelector((state) => state.auth.user)

    const verifyGate = (action: () => void) => {
        if (currentUser?.totpEnabled) {
            setPendingAction(() => action)
            setShowOtpModal(true)
        } else {
            action()
        }
    }
    const canApprove = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER' || currentUser?.role === 'DIRECTOR'
    const { setTopbarContent } = useTopbar()

    // Fetch ALL receipts to filter client-side
    const { data: allReceipts = [], isLoading, refetch } = useListOrderReceiptsQuery({})
    const { data: users = [] } = useGetUserSummariesQuery()

    const [approveReceipt] = useApproveOrderReceiptMutation()
    const [rejectReceipt] = useRejectOrderReceiptMutation()

    // Derive filter options
    const acceptors = useMemo(() => {
        const uniqueIds = [...new Set(allReceipts.map((r) => r.receivedBy?.id).filter(Boolean))]
        return users.filter((u) => uniqueIds.includes(u.id))
    }, [allReceipts, users])

    const approvers = useMemo(() => {
        const uniqueIds = [...new Set(allReceipts.map((r) => r.approvedBy?.id).filter(Boolean))]
        return users.filter((u) => uniqueIds.includes(u.id))
    }, [allReceipts, users])

    // Filter Logic
    const filteredReceipts = useMemo(() => {
        return allReceipts.filter((receipt) => {
            // Status
            if (statusFilter !== 'ALL' && receipt.status !== statusFilter) return false

            // Accepted By
            if (acceptedByFilter !== 'ALL' && receipt.receivedBy?.id !== acceptedByFilter) return false

            // Approved By
            if (approvedByFilter !== 'ALL' && receipt.approvedBy?.id !== approvedByFilter) return false

            // Search
            if (searchQuery.trim()) {
                const query = searchQuery.toLocaleLowerCase('tr-TR')
                const matchOrder = receipt.orderNo?.toLocaleLowerCase('tr-TR').includes(query)
                const matchProduct = receipt.productName?.toLocaleLowerCase('tr-TR').includes(query) ||
                    receipt.productCode?.toLocaleLowerCase('tr-TR').includes(query)
                const matchDriver = receipt.driverName?.toLocaleLowerCase('tr-TR').includes(query)

                if (!matchOrder && !matchProduct && !matchDriver) return false
            }

            return true
        })
    }, [allReceipts, statusFilter, acceptedByFilter, approvedByFilter, searchQuery])


    // Update Topbar
    useEffect(() => {
        setTopbarContent({
            title: 'Ürün Kabuller',
            description: 'Ürün kabul işlemlerini görüntüleyin ve yönetin',
            icon: <ClipboardCheck className="w-8 h-8" />,
            actions: (
                <button
                    onClick={() => verifyGate(() => setIsAddModalOpen(true))}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    <span>Ürün Kabul Et</span>
                </button>
            )
        })
    }, [setTopbarContent])

    const handleApprove = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        verifyGate(() => {
            setConfirmModalState({ isOpen: true, receiptId: id })
        })
    }

    const performApprove = async () => {
        if (!confirmModalState.receiptId) return
        try {
            await approveReceipt({ id: confirmModalState.receiptId }).unwrap()
            refetch()
            setConfirmModalState({ isOpen: false, receiptId: null })
        } catch (error) {
            console.error('Failed to approve receipt:', error)
            alert('Onaylama sırasında bir hata oluştu')
        }
    }

    const handleReject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        verifyGate(() => {
            setRejectionNote('')
            setRejectModalState({ isOpen: true, receiptId: id })
        })
    }

    const performReject = async () => {
        if (!rejectModalState.receiptId) return
        try {
            await rejectReceipt({
                id: rejectModalState.receiptId,
                request: rejectionNote ? { approvalNotes: rejectionNote } : undefined
            }).unwrap()
            refetch()
            setRejectModalState({ isOpen: false, receiptId: null })
        } catch (error) {
            console.error('Failed to reject receipt:', error)
            alert('Reddetme sırasında bir hata oluştu')
        }
    }

    return (
        <div className="p-6 space-y-6">
            <AddOrderReceiptModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={(receipt?: OrderReceiptResponse) => {
                    refetch()
                    if (receipt?.productId) {
                        setEnrichProductId(receipt.productId)
                    }
                    setIsAddModalOpen(false)
                }}
            />

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

            {/* Filter Search Bar */}
            <FilterSearchBar
                filters={[
                    {
                        label: 'Durum',
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'PENDING_APPROVAL', label: 'Onay Bekleyenler', activeColor: 'bg-yellow-600' },
                            { key: 'APPROVED', label: 'Onaylananlar', activeColor: 'bg-green-600' },
                            { key: 'REJECTED', label: 'Reddedilenler', activeColor: 'bg-red-600' }
                        ]
                    },
                    {
                        label: 'Kabul Eden',
                        value: acceptedByFilter,
                        onChange: setAcceptedByFilter,
                        type: 'dropdown',
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            ...acceptors.map(u => ({ key: u.id, label: u.displayName || `${u.firstName} ${u.lastName}` }))
                        ]
                    },
                    {
                        label: 'Onaylayan',
                        value: approvedByFilter,
                        onChange: setApprovedByFilter,
                        type: 'dropdown',
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            ...approvers.map(u => ({ key: u.id, label: u.displayName || `${u.firstName} ${u.lastName}` }))
                        ]
                    }
                ]}
                searchPlaceholder="Sipariş no, ürün adı, ürün kodu veya şoför adı..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Detail Modal */}
            <OrderReceiptDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false)
                    setSelectedReceiptId(null)
                }}
                receipt={allReceipts.find(r => r.id === selectedReceiptId) || null}
            />

            {/* Table View */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-amber-200/50">
                    <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-amber-600" />
                        Ürün Kabul Listesi
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Tarih</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Sipariş No</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Ürün</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Miktar</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Teslimat</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Kabul Eden</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Durum</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-amber-900">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-amber-700">Yükleniyor...</td>
                                </tr>
                            ) : filteredReceipts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-amber-700">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Package className="w-12 h-12 text-amber-200" />
                                            <p className="font-medium">Kayıt Bulunamadı</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredReceipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((receipt) => (
                                    <tr key={receipt.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                                        <td className="px-6 py-4 text-amber-900 font-medium whitespace-nowrap">
                                            {new Date(receipt.createdAt).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                                                {receipt.orderNo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-amber-900 font-medium">{receipt.productName}</span>
                                                <span className="text-xs text-amber-600 font-mono mt-0.5">{receipt.productCode}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-amber-900 font-bold bg-amber-100 px-3 py-1 rounded-lg">
                                                {receipt.receivedQuantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-amber-700">
                                                {receipt.vehiclePlate && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Truck className="w-3.5 h-3.5 text-amber-400" />
                                                        <span>{receipt.vehiclePlate}</span>
                                                    </div>
                                                )}
                                                {receipt.driverName && (
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="w-3.5 h-3.5 text-amber-400" />
                                                        <span title={receipt.driverName} className="truncate max-w-[120px]">
                                                            {receipt.driverName}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-amber-700">
                                            <div className="flex flex-col">
                                                <span>{receipt.receivedBy?.firstName} {receipt.receivedBy?.lastName}</span>
                                                {receipt.approvedBy && (
                                                    <span className="text-xs text-green-600 mt-1">
                                                        Onay: {receipt.approvedBy.firstName} {receipt.approvedBy.lastName}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {receipt.status === 'APPROVED' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Onaylandı
                                                </span>
                                            ) : receipt.status === 'REJECTED' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold border border-red-200">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Reddedildi
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold border border-yellow-200">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Bekliyor
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedReceiptId(receipt.id)
                                                        setIsDetailModalOpen(true)
                                                    }}
                                                    className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 shadow-sm"
                                                    title="Detayları Görüntüle"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>

                                                {canApprove && receipt.status === 'PENDING_APPROVAL' && (
                                                    <>
                                                        <button
                                                            onClick={(e) => handleApprove(receipt.id, e)}
                                                            className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-200 shadow-sm"
                                                            title="Onayla"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleReject(receipt.id, e)}
                                                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200 shadow-sm"
                                                            title="Reddet"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* OTP Modal */}
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

            {/* Confirm Approve Modal */}
            <ConfirmModal
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState({ isOpen: false, receiptId: null })}
                onCancel={() => setConfirmModalState({ isOpen: false, receiptId: null })}
                onConfirm={performApprove}
                title="Ürün Kabul Onayı"
                message="Bu ürün kabul işlemini onaylamak istediğinizden emin misiniz?"
                confirmText="Onayla"
                type="success"
            />

            {/* Reject Modal */}
            {rejectModalState.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-red-200 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-red-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-red-900 flex items-center gap-2">
                                <XCircle className="w-6 h-6" />
                                Kabulü Reddet
                            </h3>
                            <button
                                onClick={() => setRejectModalState({ isOpen: false, receiptId: null })}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <XCircle className="w-5 h-5 text-red-300" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-red-800">Bu kabul işlemini reddetmek üzeresiniz.</p>
                            <div>
                                <label className="block text-sm font-medium text-red-900 mb-1">
                                    Ret Nedeni (İsteğe bağlı)
                                </label>
                                <textarea
                                    value={rejectionNote}
                                    onChange={(e) => setRejectionNote(e.target.value)}
                                    className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none h-32 resize-none"
                                    placeholder="Neden reddedildiğini açıklayın..."
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-red-100 bg-red-50/30">
                            <button
                                onClick={() => setRejectModalState({ isOpen: false, receiptId: null })}
                                className="px-4 py-2 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={performReject}
                                className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 shadow-lg transition-all"
                            >
                                Reddet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
