import { useState } from 'react'
import { X, CreditCard } from 'lucide-react'
import { useAddBalancePaymentMutation } from '../../services/balanceLedgerApi'
import type { BalanceLedgerResponse } from '../../services/balanceLedgerApi'

interface Props {
    ledger: BalanceLedgerResponse
    onClose: () => void
}

export default function AddPaymentModal({ ledger, onClose }: Props) {
    const [amount, setAmount] = useState('')
    const [nextDueDate, setNextDueDate] = useState('')
    const [notes, setNotes] = useState('')
    const [error, setError] = useState('')

    const [addPayment, { isLoading }] = useAddBalancePaymentMutation()

    const paymentAmount = parseFloat(amount) || 0
    const newRemaining = ledger.remainingAmount - paymentAmount

    const handleSubmit = async () => {
        if (!amount || paymentAmount <= 0) {
            setError('Lütfen geçerli bir ödeme tutarı girin')
            return
        }
        if (paymentAmount > ledger.remainingAmount) {
            setError('Ödeme tutarı kalan bakiyeden büyük olamaz')
            return
        }
        // If there's remaining balance after this payment, require a due date
        if (newRemaining > 0 && !nextDueDate) {
            setError('Kalan bakiye için yeni vade tarihi girmelisiniz')
            return
        }

        try {
            await addPayment({
                id: ledger.id,
                data: {
                    amount: paymentAmount,
                    nextDueDate: nextDueDate || undefined,
                    notes: notes || undefined,
                }
            }).unwrap()
            onClose()
        } catch (err: any) {
            setError(err?.data?.message || 'Bir hata oluştu')
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-white" />
                        <h2 className="text-lg font-semibold text-white">Ödeme Ekle</h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {/* Ledger info */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Müşteri:</span>
                            <span className="font-medium text-gray-900">{ledger.customerFirstName} {ledger.customerLastName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Sözleşme:</span>
                            <span className="font-mono text-gray-700">{ledger.contractNo}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Kalan Bakiye:</span>
                            <span className="font-semibold text-red-600">{formatCurrency(ledger.remainingAmount)}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tutarı</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => { setAmount(e.target.value); setError('') }}
                            placeholder="0.00"
                            min="0"
                            max={ledger.remainingAmount}
                            step="0.01"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Resulting remaining */}
                    {paymentAmount > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Sonrası Kalan</label>
                            <input
                                type="text"
                                value={formatCurrency(newRemaining >= 0 ? newRemaining : 0)}
                                readOnly
                                className={`w-full px-4 py-2.5 border rounded-xl text-sm font-semibold ${newRemaining > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                            />
                        </div>
                    )}

                    {/* Next Due Date - only if there will be remaining */}
                    {newRemaining > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kalan Bakiye Yeni Vadesi <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={nextDueDate}
                                onChange={(e) => { setNextDueDate(e.target.value); setError('') }}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Not</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                            placeholder="İsteğe bağlı not..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
