import { X, Wallet, CreditCard } from 'lucide-react'
import { useGetBalanceLedgerQuery } from '../../services/balanceLedgerApi'

interface Props {
    ledgerId: string
    onClose: () => void
}

export default function BalanceLedgerDetailModal({ ledgerId, onClose }: Props) {
    const { data: ledger, isLoading } = useGetBalanceLedgerQuery(ledgerId)

    const formatCurrency = (val: number) => {
        if (val == null) return '0 ₺'
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('tr-TR')
    }

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString('tr-TR')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-white" />
                        <h2 className="text-lg font-semibold text-white">Bakiye Detayı</h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 overflow-y-auto flex-1">
                    {isLoading || !ledger ? (
                        <div className="text-center text-gray-500 py-8">Yükleniyor...</div>
                    ) : (
                        <div className="space-y-5">
                            {/* Info Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">Müşteri</div>
                                    <div className="text-sm font-semibold text-gray-900">{ledger.customerFirstName} {ledger.customerLastName}</div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">Sözleşme No</div>
                                    <div className="text-sm font-mono font-semibold text-gray-900">{ledger.contractNo}</div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">Sözleşme Türü</div>
                                    <div className="text-sm font-semibold text-gray-900">
                                        {ledger.contractType === 'SALE' ? 'Stoklu Satış' : 'Müşteri Özel Sipariş'}
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">Durum</div>
                                    <div className={`text-sm font-semibold ${ledger.status === 'OPEN' ? 'text-emerald-600' : 'text-gray-600'}`}>
                                        {ledger.status === 'OPEN' ? 'Açık' : 'Kapalı'}
                                    </div>
                                </div>
                            </div>

                            {/* Amount Summary */}
                            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-xs text-amber-600 mb-1">Toplam</div>
                                        <div className="text-lg font-bold text-amber-800">{formatCurrency(ledger.totalAmount)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-emerald-600 mb-1">Ödenen</div>
                                        <div className="text-lg font-bold text-emerald-700">{formatCurrency(ledger.paidAmount)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-red-600 mb-1">Kalan</div>
                                        <div className={`text-lg font-bold ${ledger.remainingAmount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                            {formatCurrency(ledger.remainingAmount)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Due Date & Notes */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">Vade Tarihi</div>
                                    <div className="text-sm font-semibold text-gray-900">{formatDate(ledger.dueDate)}</div>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">Oluşturma Tarihi</div>
                                    <div className="text-sm font-semibold text-gray-900">{formatDate(ledger.createdAt)}</div>
                                </div>
                            </div>

                            {ledger.notes && (
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">Notlar</div>
                                    <div className="text-sm text-gray-700">{ledger.notes}</div>
                                </div>
                            )}

                            {/* Payment History */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-emerald-600" />
                                    Ödeme Geçmişi ({ledger.payments?.length || 0})
                                </h3>
                                {(!ledger.payments || ledger.payments.length === 0) ? (
                                    <div className="text-sm text-gray-500 text-center py-4">Henüz ödeme kaydı yok</div>
                                ) : (
                                    <div className="space-y-2">
                                        {ledger.payments.map((payment, index) => (
                                            <div key={payment.id} className="p-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-200 transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                                                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(payment.amount)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span>{payment.paidByFirstName} {payment.paidByLastName}</span>
                                                    <span>{formatDateTime(payment.createdAt)}</span>
                                                </div>
                                                {payment.nextDueDate && (
                                                    <div className="text-xs text-amber-600 mt-1">
                                                        Yeni vade: {formatDate(payment.nextDueDate)}
                                                    </div>
                                                )}
                                                {payment.notes && (
                                                    <div className="text-xs text-gray-500 mt-1 italic">
                                                        {payment.notes}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    )
}
