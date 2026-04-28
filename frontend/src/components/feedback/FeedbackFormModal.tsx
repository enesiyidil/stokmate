import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
    X,
    Bug,
    Lightbulb,
    Sparkles,
    MessageCircle,
    ChevronRight,
    ChevronLeft,
    Send,
    Star,
    AlertTriangle,
    Eye,
} from 'lucide-react'
import { useCreateFeedbackMutation } from '../../services/feedbackApi'
import type { FeedbackType, FeedbackSeverity } from '../../services/feedbackApi'

interface FeedbackFormModalProps {
    isOpen: boolean
    onClose: () => void
}

const typeOptions: { value: FeedbackType; label: string; icon: typeof Bug; color: string; desc: string }[] = [
    { value: 'BUG_REPORT', label: 'Hata Bildirimi', icon: Bug, color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100', desc: 'Bir sorun veya hata mı buldunuz?' },
    { value: 'FEATURE_REQUEST', label: 'Özellik İsteği', icon: Lightbulb, color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100', desc: 'Yeni bir özellik mi istiyorsunuz?' },
    { value: 'SUGGESTION', label: 'Öneri', icon: Sparkles, color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100', desc: 'İyileştirme öneriniz mi var?' },
    { value: 'GENERAL', label: 'Genel Geri Bildirim', icon: MessageCircle, color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100', desc: 'Genel düşüncelerinizi paylaşın' },
]

const severityOptions: { value: FeedbackSeverity; label: string; color: string }[] = [
    { value: 'LOW', label: 'Düşük', color: 'text-green-700 bg-green-50 border-green-300' },
    { value: 'MEDIUM', label: 'Orta', color: 'text-amber-700 bg-amber-50 border-amber-300' },
    { value: 'HIGH', label: 'Yüksek', color: 'text-orange-700 bg-orange-50 border-orange-300' },
    { value: 'CRITICAL', label: 'Kritik', color: 'text-red-700 bg-red-50 border-red-300' },
]

export default function FeedbackFormModal({ isOpen, onClose }: FeedbackFormModalProps) {
    const location = useLocation()
    const [step, setStep] = useState(1)
    const [type, setType] = useState<FeedbackType | null>(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [severity, setSeverity] = useState<FeedbackSeverity>('MEDIUM')
    const [rating, setRating] = useState<number>(0)
    const [hoverRating, setHoverRating] = useState<number>(0)

    const [createFeedback, { isLoading }] = useCreateFeedbackMutation()

    const resetForm = () => {
        setStep(1)
        setType(null)
        setTitle('')
        setDescription('')
        setSeverity('MEDIUM')
        setRating(0)
        setHoverRating(0)
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleSubmit = async () => {
        if (!type || !title.trim() || !description.trim()) return
        try {
            await createFeedback({
                title: title.trim(),
                description: description.trim(),
                type,
                severity: type === 'BUG_REPORT' ? severity : undefined,
                pageUrl: location.pathname,
                rating: type === 'GENERAL' && rating > 0 ? rating : undefined,
            }).unwrap()
            handleClose()
        } catch {
            // handled by RTK Query
        }
    }

    const canProceedStep2 = type !== null
    const canProceedStep3 = title.trim().length > 0 && description.trim().length >= 20

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-100">
                    <div>
                        <h2 className="text-xl font-bold text-amber-900">Geri Bildirim Gönder</h2>
                        <div className="flex items-center gap-2 mt-1">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-1">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                        s === step ? 'bg-amber-600 text-white' :
                                        s < step ? 'bg-amber-200 text-amber-700' :
                                        'bg-gray-100 text-gray-400'
                                    }`}>
                                        {s}
                                    </div>
                                    {s < 3 && <div className={`w-6 h-0.5 ${s < step ? 'bg-amber-300' : 'bg-gray-200'}`} />}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-amber-700" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Step 1: Type Selection */}
                    {step === 1 && (
                        <div className="space-y-3">
                            <p className="text-sm text-amber-700 mb-4">Ne tür bir geri bildirim göndermek istiyorsunuz?</p>
                            {typeOptions.map((opt) => {
                                const Icon = opt.icon
                                const selected = type === opt.value
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setType(opt.value)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                            selected
                                                ? 'border-amber-500 bg-amber-50 shadow-md'
                                                : `border-gray-200 ${opt.color}`
                                        }`}
                                    >
                                        <div className={`p-2.5 rounded-lg ${selected ? 'bg-amber-100' : ''}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm">{opt.label}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                                        </div>
                                        {selected && <div className="w-3 h-3 rounded-full bg-amber-500" />}
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Step 2: Details */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-1">Başlık *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="Kısa ve açıklayıcı bir başlık..."
                                    maxLength={200}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-1">
                                    Açıklama * <span className="text-amber-400 font-normal">(min. 20 karakter)</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                    placeholder="Detaylı açıklama yazın..."
                                    maxLength={5000}
                                />
                                <p className="text-xs text-amber-400 mt-1">{description.length}/5000</p>
                            </div>

                            {type === 'BUG_REPORT' && (
                                <div>
                                    <label className="block text-sm font-medium text-amber-700 mb-2">
                                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                                        Ciddiyet
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {severityOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setSeverity(opt.value)}
                                                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                                                    severity === opt.value
                                                        ? `${opt.color} border-2 shadow-sm`
                                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {type === 'GENERAL' && (
                                <div>
                                    <label className="block text-sm font-medium text-amber-700 mb-2">
                                        Memnuniyet Puanı <span className="text-amber-400 font-normal">(opsiyonel)</span>
                                    </label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setRating(rating === star ? 0 : star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="p-1 transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={`w-7 h-7 ${
                                                        star <= (hoverRating || rating)
                                                            ? 'text-amber-500 fill-amber-500'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Preview */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Eye className="w-4 h-4 text-amber-600" />
                                <p className="text-sm font-medium text-amber-700">Önizleme</p>
                            </div>
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    {type && (() => {
                                        const opt = typeOptions.find(o => o.value === type)!
                                        const Icon = opt.icon
                                        return (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${opt.color}`}>
                                                <Icon className="w-3.5 h-3.5" />
                                                {opt.label}
                                            </span>
                                        )
                                    })()}
                                    {type === 'BUG_REPORT' && (
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                            severityOptions.find(s => s.value === severity)?.color
                                        }`}>
                                            {severityOptions.find(s => s.value === severity)?.label}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-semibold text-amber-900">{title}</h3>
                                <p className="text-sm text-amber-700 whitespace-pre-wrap">{description}</p>
                                {type === 'GENERAL' && rating > 0 && (
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} className={`w-4 h-4 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-amber-400">Sayfa: {location.pathname}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 pt-0">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex items-center gap-1.5 px-4 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Geri
                        </button>
                    )}
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                        İptal
                    </button>
                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={step === 1 ? !canProceedStep2 : !canProceedStep3}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            İleri
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            {isLoading ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
