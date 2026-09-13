import { useState, useEffect } from 'react'
import { Wallet, Plus, CreditCard, Eye, Pencil, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useTopbar } from '../context/TopbarContext'
import { useAppSelector } from '../hooks/useAuth'
import { useListBalanceLedgerQuery, useDeleteBalanceLedgerMutation } from '../services/balanceLedgerApi'
import FilterSearchBar from '../components/common/FilterSearchBar'
import Pagination from '../components/common/Pagination'
import AddBalanceLedgerModal from '../components/balance/AddBalanceLedgerModal'
import AddPaymentModal from '../components/balance/AddPaymentModal'
import BalanceLedgerDetailModal from '../components/balance/BalanceLedgerDetailModal'
import EditBalanceLedgerModal from '../components/balance/EditBalanceLedgerModal'
import type { BalanceLedgerResponse } from '../services/balanceLedgerApi'

export default function BalanceLedgerPage() {
    const { setTopbarContent } = useTopbar()
    const user = useAppSelector(state => state.auth.user)
    const userRole = user?.role || ''

    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [dueDateFrom, setDueDateFrom] = useState('')
    const [dueDateTo, setDueDateTo] = useState('')
    const [page, setPage] = useState(0)

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [selectedLedger, setSelectedLedger] = useState<BalanceLedgerResponse | null>(null)

    const canEdit = ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(userRole)
    const canDelete = ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(userRole)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(0)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const { data: pagedData, isLoading } = useListBalanceLedgerQuery({
        page,
        size: 50,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        dueDateFrom: dueDateFrom || undefined,
        dueDateTo: dueDateTo || undefined,
    })
    const ledgers = pagedData?.content || []

    const [deleteLedger] = useDeleteBalanceLedgerMutation()

    useEffect(() => {
        setTopbarContent({
            title: 'Bakiye Defteri',
            description: 'Müşteri bakiye takibi ve ödeme yönetimi',
            icon: <Wallet className="w-8 h-8 text-amber-500" />,
            actions: (
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300"
                >
                    <Plus className="w-4 h-4" />
                    <span>Bakiye Ekle</span>
                </button>
            ),
        })
        return () => setTopbarContent(null)
    }, [setTopbarContent])

    const handleDelete = async () => {
        if (!selectedLedger) return
        try {
            await deleteLedger(selectedLedger.id).unwrap()
            setShowDeleteConfirm(false)
            setSelectedLedger(null)
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('tr-TR')
    }

    const formatCurrency = (val: number) => {
        if (val == null) return '0 ₺'
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
    }

    const getStatusBadge = (status: string) => {
        if (status === 'OPEN') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Açık
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 text-xs font-medium">
                <XCircle className="w-3.5 h-3.5" />
                Kapalı
            </span>
        )
    }

    const getContractTypeBadge = (type: string) => {
        if (type === 'SALE') {
            return <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium">Stoklu Satış</span>
        }
        return <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">Müşteri Özel</span>
    }

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <FilterSearchBar
                searchPlaceholder="Müşteri adı/soyadı veya sözleşme no ara..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                    {
                        label: 'Durum',
                        value: statusFilter,
                        onChange: (v: string) => { setStatusFilter(v); setPage(0); },
                        options: [
                            { key: '', label: 'Tümü' },
                            { key: 'OPEN', label: 'Açık' },
                            { key: 'CLOSED', label: 'Kapalı' },
                        ]
                    }
                ]}
                extraContent={
                    <div className="flex flex-col gap-2">
                        <span className="text-amber-800 text-xs font-bold uppercase tracking-wider pl-1">Vade Aralığı</span>
                        <div className="flex gap-3 items-center flex-wrap">
                            <input
                                type="date"
                                value={dueDateFrom}
                                onChange={(e) => { setDueDateFrom(e.target.value); setPage(0); }}
                                className="px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                            />
                            <span className="text-amber-400 text-xs font-medium">—</span>
                            <input
                                type="date"
                                value={dueDateTo}
                                onChange={(e) => { setDueDateTo(e.target.value); setPage(0); }}
                                className="px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
                            />
                            {(dueDateFrom || dueDateTo) && (
                                <button
                                    onClick={() => { setDueDateFrom(''); setDueDateTo('') }}
                                    className="text-xs text-amber-600 hover:text-amber-800 underline font-medium"
                                >
                                    Temizle
                                </button>
                            )}
                        </div>
                    </div>
                }
            />

            {/* Content Card */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-lg overflow-hidden backdrop-blur-md bg-opacity-90">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">Yükleniyor...</div>
                ) : ledgers.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Wallet className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Bakiye Kaydı Bulunamadı</h3>
                        <p className="text-sm text-gray-500 mt-1">Yeni bir bakiye kaydı ekleyerek başlayın.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-amber-50/50 border-b border-amber-100/50 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-5 py-4">Müşteri</th>
                                    <th className="px-5 py-4">Sözleşme</th>
                                    <th className="px-5 py-4">Tür</th>
                                    <th className="px-5 py-4 text-right">Toplam</th>
                                    <th className="px-5 py-4 text-right">Ödenen</th>
                                    <th className="px-5 py-4 text-right">Kalan</th>
                                    <th className="px-5 py-4">Vade</th>
                                    <th className="px-5 py-4">Durum</th>
                                    <th className="px-5 py-4 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {ledgers.map((ledger) => (
                                    <tr key={ledger.id} className="hover:bg-amber-50/30 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                    {ledger.customerFirstName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 text-sm">{ledger.customerFirstName} {ledger.customerLastName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-mono text-gray-700">{ledger.contractNo}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {getContractTypeBadge(ledger.contractType)}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(ledger.totalAmount)}</span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className="text-sm font-medium text-emerald-600">{formatCurrency(ledger.paidAmount)}</span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={`text-sm font-semibold ${ledger.remainingAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                {formatCurrency(ledger.remainingAmount)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm text-gray-600">{formatDate(ledger.dueDate)}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {getStatusBadge(ledger.status)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1 justify-end">
                                                {/* Add Payment - only for OPEN */}
                                                {ledger.status === 'OPEN' && (
                                                    <button
                                                        onClick={() => { setSelectedLedger(ledger); setShowPaymentModal(true) }}
                                                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                                                        title="Ödeme Ekle"
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {/* Detail */}
                                                <button
                                                    onClick={() => { setSelectedLedger(ledger); setShowDetailModal(true) }}
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                                                    title="Detay"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {/* Edit */}
                                                {canEdit && (
                                                    <button
                                                        onClick={() => { setSelectedLedger(ledger); setShowEditModal(true) }}
                                                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 hover:text-amber-700 transition-colors"
                                                        title="Düzenle"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {/* Delete */}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => { setSelectedLedger(ledger); setShowDeleteConfirm(true) }}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagedData && pagedData.totalPages > 1 && (
                <Pagination
                    page={page}
                    totalPages={pagedData.totalPages}
                    totalElements={pagedData.totalElements}
                    onPageChange={setPage}
                />
            )}

            {/* Modals */}
            {showAddModal && (
                <AddBalanceLedgerModal onClose={() => setShowAddModal(false)} />
            )}

            {showPaymentModal && selectedLedger && (
                <AddPaymentModal
                    ledger={selectedLedger}
                    onClose={() => { setShowPaymentModal(false); setSelectedLedger(null) }}
                />
            )}

            {showDetailModal && selectedLedger && (
                <BalanceLedgerDetailModal
                    ledgerId={selectedLedger.id}
                    onClose={() => { setShowDetailModal(false); setSelectedLedger(null) }}
                />
            )}

            {showEditModal && selectedLedger && (
                <EditBalanceLedgerModal
                    ledger={selectedLedger}
                    onClose={() => { setShowEditModal(false); setSelectedLedger(null) }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedLedger && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Bakiye Kaydını Sil</h3>
                                <p className="text-sm text-gray-500">Bu işlem geri alınamaz</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-6">
                            <strong>{selectedLedger.customerFirstName} {selectedLedger.customerLastName}</strong> müşterisinin
                            <strong> {selectedLedger.contractNo}</strong> sözleşmesine ait bakiye kaydını silmek istediğinize emin misiniz?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                            >
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
