import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { useUpdateBalanceLedgerMutation } from '../../services/balanceLedgerApi'
import type { BalanceLedgerResponse } from '../../services/balanceLedgerApi'

interface Props {
    ledger: BalanceLedgerResponse
    onClose: () => void
}

export default function EditBalanceLedgerModal({ ledger, onClose }: Props) {
    const [notes, setNotes] = useState(ledger.notes || '')
    const [dueDate, setDueDate] = useState(ledger.dueDate || '')
    const [error, setError] = useState('')

    const [updateLedger, { isLoading }] = useUpdateBalanceLedgerMutation()

    const handleSubmit = async () => {
        try {
            await updateLedger({
                id: ledger.id,
                data: {
                    notes,
                    dueDate: dueDate || undefined,
                }
            }).unwrap()
            onClose()
        } catch (err: any) {
            setError(err?.data?.message || 'Bir hata oluştu')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Pencil className="w-5 h-5 text-white" />
                        <h2 className="text-lg font-semibold text-white">Bakiye Düzenle</h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {/* Info */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Müşteri:</span>
                            <span className="font-medium text-gray-900">{ledger.customerFirstName} {ledger.customerLastName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Sözleşme:</span>
                            <span className="font-mono text-gray-700">{ledger.contractNo}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vade Tarihi</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                            placeholder="Not ekleyin..."
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
                            className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-sm font-medium hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Kaydediliyor...' : 'Güncelle'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
