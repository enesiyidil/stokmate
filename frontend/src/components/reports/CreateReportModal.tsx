import { useState } from 'react'
import { X, ClipboardList, ShoppingBag, Truck, ChevronRight, ChevronLeft, Loader2, CheckCircle, Download } from 'lucide-react'
import {
    useGenerateOrderReportMutation,
    useGenerateStockSaleReportMutation,
    useGenerateShipmentReportMutation,
    type ReportResponse
} from '../../services/reportApi'
import { useGetSalesConsultantsQuery } from '../../services/userApi'
import { useAppSelector } from '../../hooks/useAuth'
import { BRANDS, BRAND_LABELS } from '../../constants/brandConstants'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

interface Props {
    onClose: () => void
}

type ReportType = 'ORDER' | 'STOCK_SALE' | 'SHIPMENT'

const REPORT_TYPES: { type: ReportType; label: string; desc: string; icon: React.ReactNode }[] = [
    { type: 'ORDER', label: 'Sipariş Raporu', desc: 'Müşteriye özel ve SSH siparişlerinin detaylı analizi', icon: <ClipboardList size={28} /> },
    { type: 'STOCK_SALE', label: 'Stoklu Satış Raporu', desc: 'Stok satışları, maliyet ve kâr analizi', icon: <ShoppingBag size={28} /> },
    { type: 'SHIPMENT', label: 'Sevkiyat Raporu', desc: 'Sevkiyat süreçleri, zaman çizelgesi ve durum analizi', icon: <Truck size={28} /> }
]

export default function CreateReportModal({ onClose }: Props) {
    const token = useAppSelector(state => state.auth.token)
    const [step, setStep] = useState(1) // 1: type, 2: filters, 3: generating/result
    const [selectedType, setSelectedType] = useState<ReportType | null>(null)

    // Filters
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [selectedConsultants, setSelectedConsultants] = useState<string[]>([])
    const [selectedBrands, setSelectedBrands] = useState<string[]>([])
    const [shipmentScope, setShipmentScope] = useState('ALL')
    const [customTitle, setCustomTitle] = useState('')

    // Result
    const [result, setResult] = useState<ReportResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Queries
    const { data: consultants = [] } = useGetSalesConsultantsQuery()
    const [generateOrder, { isLoading: isOrderLoading }] = useGenerateOrderReportMutation()
    const [generateStockSale, { isLoading: isSaleLoading }] = useGenerateStockSaleReportMutation()
    const [generateShipment, { isLoading: isShipmentLoading }] = useGenerateShipmentReportMutation()

    const isGenerating = isOrderLoading || isSaleLoading || isShipmentLoading

    const handleGenerate = async () => {
        if (!selectedType || !startDate || !endDate) return
        setStep(3)
        setError(null)
        try {
            let response: ReportResponse
            switch (selectedType) {
                case 'ORDER':
                    response = await generateOrder({
                        startDate,
                        endDate,
                        salesConsultantIds: selectedConsultants.length > 0 ? selectedConsultants : undefined,
                        brands: selectedBrands.length > 0 ? selectedBrands : undefined,
                        title: customTitle.trim() || undefined
                    }).unwrap()
                    break
                case 'STOCK_SALE':
                    response = await generateStockSale({
                        startDate,
                        endDate,
                        salesConsultantIds: selectedConsultants.length > 0 ? selectedConsultants : undefined,
                        brands: selectedBrands.length > 0 ? selectedBrands : undefined,
                        title: customTitle.trim() || undefined
                    }).unwrap()
                    break
                case 'SHIPMENT':
                    response = await generateShipment({
                        startDate,
                        endDate,
                        shipmentScope: shipmentScope !== 'ALL' ? shipmentScope : undefined,
                        title: customTitle.trim() || undefined
                    }).unwrap()
                    break
            }
            setResult(response)
        } catch (e: any) {
            setError(e?.data?.message || e?.message || 'Rapor oluşturulurken bir hata oluştu')
        }
    }

    const handleDownload = () => {
        if (!result) return
        const url = `${API_BASE}/reports/${result.id}/download`
        fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = blobUrl
                a.download = `${result.reportNo}.pdf`
                a.click()
                URL.revokeObjectURL(blobUrl)
            })
    }

    const toggleConsultant = (id: string) => {
        setSelectedConsultants(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    const toggleBrand = (brand: string) => {
        setSelectedBrands(prev =>
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        )
    }

    const canProceed = () => {
        if (step === 1) return selectedType !== null
        if (step === 2) return startDate !== '' && endDate !== ''
        return false
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-amber-200/60 bg-amber-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-700 to-orange-700 rounded-xl flex items-center justify-center text-white">
                            <ClipboardList size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-amber-900">Rapor Oluştur</h2>
                            <p className="text-xs text-amber-600">
                                {step === 1 && 'Rapor türünü seçin'}
                                {step === 2 && 'Filtreleri ayarlayın'}
                                {step === 3 && (isGenerating ? 'Rapor oluşturuluyor...' : result ? 'Rapor hazır!' : 'Hata oluştu')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-amber-100 transition-colors">
                        <X size={20} className="text-amber-600" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-3 bg-amber-50/30 flex items-center gap-3">
                    {['Tür', 'Filtreler', 'Sonuç'].map((label, i) => (
                        <div key={label} className="flex items-center gap-2 flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i + 1 <= step ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-500'
                                }`}>
                                {i + 1}
                            </div>
                            <span className={`text-xs font-medium ${i + 1 <= step ? 'text-amber-800' : 'text-amber-400'}`}>{label}</span>
                            {i < 2 && <div className={`flex-1 h-0.5 rounded ${i + 1 < step ? 'bg-amber-500' : 'bg-amber-200'}`} />}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-220px)]">
                    {/* Step 1: Select Type */}
                    {step === 1 && (
                        <div className="grid gap-3">
                            {REPORT_TYPES.map(rt => (
                                <button
                                    key={rt.type}
                                    onClick={() => setSelectedType(rt.type)}
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${selectedType === rt.type
                                        ? 'border-amber-500 bg-amber-50 shadow-md'
                                        : 'border-amber-200 hover:border-amber-400 hover:bg-amber-50/50'
                                        }`}
                                >
                                    <div className={`p-3 rounded-xl ${selectedType === rt.type
                                        ? 'bg-gradient-to-br from-amber-700 to-orange-700 text-white'
                                        : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {rt.icon}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-amber-900">{rt.label}</p>
                                        <p className="text-sm text-amber-600 mt-0.5">{rt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 2: Filters */}
                    {step === 2 && (
                        <div className="space-y-5">
                            {/* Report Title */}
                            <div>
                                <label className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2 block">
                                    Rapor Başlığı <span className="text-amber-400 text-xs font-normal normal-case">(opsiyonel)</span>
                                </label>
                                <input
                                    type="text"
                                    value={customTitle}
                                    onChange={e => setCustomTitle(e.target.value)}
                                    placeholder={REPORT_TYPES.find(r => r.type === selectedType)?.label || 'Rapor'}
                                    className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 placeholder:text-amber-300"
                                />
                                <p className="text-xs text-amber-400 mt-1">Boş bırakırsanız otomatik oluşturulur</p>
                            </div>

                            {/* Date Range */}
                            <div>
                                <label className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2 block">
                                    Dönem <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-amber-600 mb-1 block">Başlangıç</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-amber-600 mb-1 block">Bitiş</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Consultants */}
                            {(selectedType === 'ORDER' || selectedType === 'STOCK_SALE') && (
                                <div>
                                    <label className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2 block">
                                        Satış Danışmanı <span className="text-amber-400 text-xs font-normal normal-case">(opsiyonel)</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {consultants.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => toggleConsultant(c.id)}
                                                className={`px-3 py-1.5 rounded-xl text-sm border transition-all font-medium ${selectedConsultants.includes(c.id)
                                                    ? 'border-amber-500 bg-amber-600 text-white'
                                                    : 'border-amber-200 text-amber-700 bg-white hover:border-amber-400'
                                                    }`}
                                            >
                                                {c.firstName} {c.lastName}
                                            </button>
                                        ))}
                                        {consultants.length === 0 && (
                                            <p className="text-sm text-amber-400">Satış danışmanı bulunamadı</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Brands */}
                            {(selectedType === 'ORDER' || selectedType === 'STOCK_SALE') && (
                                <div>
                                    <label className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2 block">
                                        Marka <span className="text-amber-400 text-xs font-normal normal-case">(opsiyonel)</span>
                                    </label>
                                    <div className="flex gap-2">
                                        {BRANDS.map(brand => (
                                            <button
                                                key={brand}
                                                onClick={() => toggleBrand(brand)}
                                                className={`px-4 py-2 rounded-xl text-sm border-2 transition-all font-medium ${selectedBrands.includes(brand)
                                                    ? 'border-amber-500 bg-amber-600 text-white'
                                                    : 'border-amber-200 text-amber-700 bg-white hover:border-amber-400'
                                                    }`}
                                            >
                                                {BRAND_LABELS[brand]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Shipment Scope */}
                            {selectedType === 'SHIPMENT' && (
                                <div>
                                    <label className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2 block">Kapsam</label>
                                    <div className="flex gap-2">
                                        {[
                                            { value: 'ALL', label: 'Tümü' },
                                            { value: 'ORDER', label: 'Sipariş Sevkiyatları' },
                                            { value: 'SALE', label: 'Satış Sevkiyatları' }
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setShipmentScope(opt.value)}
                                                className={`px-4 py-2 rounded-xl text-sm border-2 transition-all font-medium ${shipmentScope === opt.value
                                                    ? 'border-amber-500 bg-amber-600 text-white'
                                                    : 'border-amber-200 text-amber-700 bg-white hover:border-amber-400'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Generating / Result */}
                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center py-8">
                            {isGenerating && (
                                <div className="text-center">
                                    <Loader2 className="animate-spin text-amber-600 mx-auto mb-4" size={48} />
                                    <p className="text-lg font-semibold text-amber-900">Rapor Oluşturuluyor</p>
                                    <p className="text-sm text-amber-600 mt-1">Bu işlem birkaç saniye sürebilir...</p>
                                </div>
                            )}
                            {!isGenerating && result && (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-300">
                                        <CheckCircle className="text-green-600" size={32} />
                                    </div>
                                    <p className="text-lg font-semibold text-amber-900">Rapor Hazır!</p>
                                    <p className="text-sm text-amber-700 mt-1">{result.title}</p>
                                    <p className="text-xs text-amber-500 mt-1">Rapor No: {result.reportNo}</p>

                                    <div className="mt-6 max-w-xs mx-auto">
                                        <div className="backdrop-blur-sm bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                                            <p className="text-xs text-amber-600">Toplam Kayıt</p>
                                            <p className="text-lg font-bold text-amber-900">{result.totalRecords}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleDownload}
                                        className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl font-medium shadow-lg hover:from-amber-800 hover:to-orange-800 hover:shadow-xl transition-all duration-300 mx-auto"
                                    >
                                        <Download size={18} />
                                        PDF İndir
                                    </button>
                                </div>
                            )}
                            {!isGenerating && error && (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-300">
                                        <X className="text-red-600" size={32} />
                                    </div>
                                    <p className="text-lg font-semibold text-amber-900">Hata Oluştu</p>
                                    <p className="text-sm text-red-600 mt-1">{error}</p>
                                    <button
                                        onClick={() => { setStep(2); setError(null) }}
                                        className="mt-4 px-4 py-2 bg-amber-100 text-amber-800 rounded-xl hover:bg-amber-200 transition-colors text-sm font-medium border border-amber-200"
                                    >
                                        Geri Dön
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step < 3 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-amber-200/60 bg-amber-50/30">
                        <button
                            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                            className="flex items-center gap-1 px-4 py-2.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-xl transition-colors text-sm font-medium"
                        >
                            <ChevronLeft size={16} />
                            {step > 1 ? 'Geri' : 'İptal'}
                        </button>
                        <button
                            onClick={() => step === 2 ? handleGenerate() : setStep(step + 1)}
                            disabled={!canProceed()}
                            className="flex items-center gap-1 px-5 py-2.5 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl font-medium shadow-lg hover:from-amber-800 hover:to-orange-800 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm"
                        >
                            {step === 2 ? 'Rapor Oluştur' : 'Devam Et'}
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                {/* Close for step 3 */}
                {step === 3 && !isGenerating && (
                    <div className="flex justify-center px-6 py-4 border-t border-amber-200/60 bg-amber-50/30">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-amber-100 text-amber-800 rounded-xl font-medium hover:bg-amber-200 transition-colors text-sm border border-amber-200"
                        >
                            Kapat
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
