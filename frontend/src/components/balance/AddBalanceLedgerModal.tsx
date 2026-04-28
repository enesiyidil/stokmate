import { useState } from 'react'
import { X, Wallet, ChevronRight } from 'lucide-react'
import { useListCustomersQuery } from '../../services/customerApi'
import { useGetContractsByCustomerQuery, useCreateBalanceLedgerMutation } from '../../services/balanceLedgerApi'
import type { ContractOption } from '../../services/balanceLedgerApi'

interface Props {
    onClose: () => void
}

export default function AddBalanceLedgerModal({ onClose }: Props) {
    const [step, setStep] = useState(1) // 1: customer, 2: contract, 3: payment details
    const [customerId, setCustomerId] = useState('')
    const [selectedContract, setSelectedContract] = useState<ContractOption | null>(null)
    const [paidAmount, setPaidAmount] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [notes, setNotes] = useState('')
    const [error, setError] = useState('')

    const { data: customers = [] } = useListCustomersQuery()
    const { data: contracts = [], isFetching: contractsLoading } = useGetContractsByCustomerQuery(customerId, {
        skip: !customerId
    })
    const [createLedger, { isLoading: creating }] = useCreateBalanceLedgerMutation()

    const totalAmount = selectedContract?.totalAmount || 0
    const paid = parseFloat(paidAmount) || 0
    const remaining = totalAmount - paid

    const handleSubmit = async () => {
        if (!customerId || !selectedContract || !paidAmount || !dueDate) {
            setError('Lütfen tüm zorunlu alanları doldurun')
            return
        }
        if (paid > totalAmount) {
            setError('Ödenen tutar toplam tutardan büyük olamaz')
            return
        }
        if (paid < 0) {
            setError('Ödenen tutar negatif olamaz')
            return
        }

        try {
            await createLedger({
                customerId,
                contractType: selectedContract.type,
                contractId: selectedContract.id,
                paidAmount: paid,
                dueDate,
                notes: notes || undefined,
            }).unwrap()
            onClose()
        } catch (err: any) {
            setError(err?.data?.message || 'Bir hata oluştu')
        }
    }

    const selectedCustomer = customers.find(c => c.id === customerId)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-white" />
                        <h2 className="text-lg font-semibold text-white">Bakiye Ekle</h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-6 pt-4 pb-2 flex items-center gap-2 text-xs">
                    <span className={`px-3 py-1 rounded-full font-medium transition-all ${step >= 1 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                        1. Müşteri
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className={`px-3 py-1 rounded-full font-medium transition-all ${step >= 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                        2. Sözleşme
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className={`px-3 py-1 rounded-full font-medium transition-all ${step >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                        3. Ödeme
                    </span>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Customer Selection */}
                    {step === 1 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Müşteri Seçin</label>
                            <select
                                value={customerId}
                                onChange={(e) => { setCustomerId(e.target.value); setSelectedContract(null); setError('') }}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            >
                                <option value="">Müşteri seçin...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                ))}
                            </select>
                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={() => { if (customerId) setStep(2); else setError('Lütfen müşteri seçin') }}
                                    className="px-5 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
                                >
                                    İleri
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Contract Selection */}
                    {step === 2 && (
                        <div>
                            <div className="mb-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                                <span className="text-xs text-amber-600 font-medium">Müşteri:</span>
                                <span className="text-sm text-amber-800 ml-2 font-semibold">
                                    {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                                </span>
                            </div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sözleşme Seçin</label>
                            {contractsLoading ? (
                                <div className="text-sm text-gray-500 py-4 text-center">Sözleşmeler yükleniyor...</div>
                            ) : contracts.length === 0 ? (
                                <div className="text-sm text-gray-500 py-4 text-center">Bu müşteriye ait sözleşme bulunamadı</div>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {contracts.map(c => (
                                        <button
                                            key={`${c.type}-${c.id}`}
                                            onClick={() => { setSelectedContract(c); setError('') }}
                                            className={`w-full text-left p-3 border rounded-xl transition-all text-sm ${selectedContract?.id === c.id && selectedContract?.type === c.type
                                                ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
                                                : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                                                }`}
                                        >
                                            <div className="font-medium text-gray-900">{c.label}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Toplam: <span className="font-semibold text-gray-700">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(c.totalAmount)}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-between mt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Geri
                                </button>
                                <button
                                    onClick={() => { if (selectedContract) setStep(3); else setError('Lütfen sözleşme seçin') }}
                                    className="px-5 py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
                                >
                                    İleri
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Payment Details */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-amber-600">Müşteri:</span>
                                    <span className="font-semibold text-amber-800">{selectedCustomer?.firstName} {selectedCustomer?.lastName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-amber-600">Sözleşme:</span>
                                    <span className="font-semibold text-amber-800">{selectedContract?.contractNo}</span>
                                </div>
                            </div>

                            {/* Total Amount (readonly) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Bakiye</label>
                                <input
                                    type="text"
                                    value={new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalAmount)}
                                    readOnly
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 font-semibold"
                                />
                            </div>

                            {/* Paid Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ödenen Miktar</label>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => { setPaidAmount(e.target.value); setError('') }}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>

                            {/* Remaining (auto) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kalan Bakiye</label>
                                <input
                                    type="text"
                                    value={new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(remaining >= 0 ? remaining : 0)}
                                    readOnly
                                    className={`w-full px-4 py-2.5 border rounded-xl text-sm font-semibold ${remaining > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
                                />
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Vadesi</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => { setDueDate(e.target.value); setError('') }}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                                    placeholder="İsteğe bağlı not..."
                                />
                            </div>

                            <div className="flex justify-between pt-2">
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Geri
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={creating}
                                    className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-sm font-medium hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50"
                                >
                                    {creating ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
