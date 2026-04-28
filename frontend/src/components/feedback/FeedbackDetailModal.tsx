import { useState } from 'react'
import {
    X,
    Bug,
    Lightbulb,
    Sparkles,
    MessageCircle,
    Send,
    Star,
    Clock,
    User,
    AlertTriangle,
    Shield,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAppSelector } from '../../hooks/useAuth'
import {
    useGetFeedbackDetailQuery,
    useAddFeedbackResponseMutation,
    useUpdateFeedbackStatusMutation,
} from '../../services/feedbackApi'
import type { FeedbackStatus } from '../../services/feedbackApi'
import { getRoleDisplayName } from '../../constants/roles'

interface FeedbackDetailModalProps {
    feedbackId: string | null
    onClose: () => void
}

const typeConfig = {
    BUG_REPORT: { label: 'Hata Bildirimi', icon: Bug, color: 'text-red-600 bg-red-100 border-red-300' },
    FEATURE_REQUEST: { label: 'Özellik İsteği', icon: Lightbulb, color: 'text-blue-600 bg-blue-100 border-blue-300' },
    SUGGESTION: { label: 'Öneri', icon: Sparkles, color: 'text-emerald-600 bg-emerald-100 border-emerald-300' },
    GENERAL: { label: 'Genel', icon: MessageCircle, color: 'text-amber-600 bg-amber-100 border-amber-300' },
}

const statusConfig: Record<FeedbackStatus, { label: string; color: string }> = {
    NEW: { label: 'Yeni', color: 'text-amber-700 bg-amber-100 border-amber-300' },
    REVIEWED: { label: 'İncelendi', color: 'text-purple-700 bg-purple-100 border-purple-300' },
    IN_PROGRESS: { label: 'İşlemde', color: 'text-blue-700 bg-blue-100 border-blue-300' },
    IMPLEMENTED: { label: 'Uygulandı', color: 'text-green-700 bg-green-100 border-green-300' },
    WONT_FIX: { label: 'Uygulanmayacak', color: 'text-gray-700 bg-gray-100 border-gray-300' },
    CLOSED: { label: 'Kapatıldı', color: 'text-gray-600 bg-gray-100 border-gray-300' },
}

const severityConfig = {
    LOW: { label: 'Düşük', color: 'text-green-600 bg-green-50 border-green-200' },
    MEDIUM: { label: 'Orta', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    HIGH: { label: 'Yüksek', color: 'text-orange-600 bg-orange-50 border-orange-200' },
    CRITICAL: { label: 'Kritik', color: 'text-red-600 bg-red-50 border-red-200' },
}

const allStatuses: FeedbackStatus[] = ['NEW', 'REVIEWED', 'IN_PROGRESS', 'IMPLEMENTED', 'WONT_FIX', 'CLOSED']

const managerRoles = ['ADMIN', 'MANAGER', 'DIRECTOR']

export default function FeedbackDetailModal({ feedbackId, onClose }: FeedbackDetailModalProps) {
    const { user } = useAppSelector((state) => state.auth)
    const isManager = user?.role && managerRoles.includes(user.role)

    const { data: feedback, isLoading } = useGetFeedbackDetailQuery(feedbackId!, { skip: !feedbackId })
    const [addResponse, { isLoading: sendingResponse }] = useAddFeedbackResponseMutation()
    const [updateStatus, { isLoading: updatingStatus }] = useUpdateFeedbackStatusMutation()

    const [responseText, setResponseText] = useState('')
    const [newStatus, setNewStatus] = useState<FeedbackStatus | ''>('')
    const [adminNote, setAdminNote] = useState('')
    const [showAdminPanel, setShowAdminPanel] = useState(false)

    if (!feedbackId) return null

    const handleSendResponse = async () => {
        if (!responseText.trim() || !feedbackId) return
        try {
            await addResponse({ id: feedbackId, data: { message: responseText.trim() } }).unwrap()
            setResponseText('')
        } catch {
            // handled by RTK Query
        }
    }

    const handleUpdateStatus = async () => {
        if (!newStatus || !feedbackId) return
        try {
            await updateStatus({
                id: feedbackId,
                data: {
                    status: newStatus,
                    adminNote: adminNote.trim() || undefined,
                },
            }).unwrap()
            setNewStatus('')
            setAdminNote('')
            setShowAdminPanel(false)
        } catch {
            // handled by RTK Query
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-amber-900">Geri Bildirim Detayı</h2>
                    <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-amber-700" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {isLoading ? (
                        <div className="text-center py-8 text-amber-600">Yükleniyor...</div>
                    ) : feedback ? (
                        <>
                            {/* Type & Status Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                                {(() => {
                                    const tc = typeConfig[feedback.type]
                                    const Icon = tc.icon
                                    return (
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${tc.color}`}>
                                            <Icon className="w-3.5 h-3.5" />
                                            {tc.label}
                                        </span>
                                    )
                                })()}
                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${statusConfig[feedback.status].color}`}>
                                    {statusConfig[feedback.status].label}
                                </span>
                                {feedback.severity && (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${severityConfig[feedback.severity].color}`}>
                                        <AlertTriangle className="w-3 h-3" />
                                        {severityConfig[feedback.severity].label}
                                    </span>
                                )}
                            </div>

                            {/* Title & Description */}
                            <div>
                                <h3 className="text-lg font-semibold text-amber-900">{feedback.title}</h3>
                                <p className="text-amber-700 mt-2 whitespace-pre-wrap">{feedback.description}</p>
                            </div>

                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-amber-500">
                                <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />
                                    {feedback.createdByName}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true, locale: tr })}
                                </span>
                                {feedback.pageUrl && (
                                    <span className="text-amber-400">Sayfa: {feedback.pageUrl}</span>
                                )}
                            </div>

                            {/* Rating */}
                            {feedback.rating && feedback.rating > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="text-sm text-amber-600 mr-1">Puan:</span>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className={`w-4 h-4 ${star <= feedback.rating! ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                            )}

                            {/* Admin Note */}
                            {feedback.adminNote && isManager && (
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                    <p className="text-xs font-medium text-purple-600 mb-1 flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> Yönetici Notu
                                    </p>
                                    <p className="text-sm text-purple-800">{feedback.adminNote}</p>
                                </div>
                            )}

                            {/* Manager Controls */}
                            {isManager && (
                                <div>
                                    {!showAdminPanel ? (
                                        <button
                                            onClick={() => {
                                                setShowAdminPanel(true)
                                                setNewStatus(feedback.status)
                                                setAdminNote(feedback.adminNote || '')
                                            }}
                                            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                        >
                                            <Shield className="w-3.5 h-3.5" />
                                            Durum ve Not Güncelle
                                        </button>
                                    ) : (
                                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-purple-700 mb-1">Durum</label>
                                                <select
                                                    value={newStatus}
                                                    onChange={(e) => setNewStatus(e.target.value as FeedbackStatus)}
                                                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                >
                                                    <option value="">Seçin...</option>
                                                    {allStatuses.map((s) => (
                                                        <option key={s} value={s}>{statusConfig[s].label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-purple-700 mb-1">İç Not (sadece yöneticiler görür)</label>
                                                <textarea
                                                    value={adminNote}
                                                    onChange={(e) => setAdminNote(e.target.value)}
                                                    rows={2}
                                                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                                                    placeholder="Yönetici notu..."
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowAdminPanel(false)}
                                                    className="px-3 py-1.5 text-sm border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                                                >
                                                    İptal
                                                </button>
                                                <button
                                                    onClick={handleUpdateStatus}
                                                    disabled={!newStatus || updatingStatus}
                                                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                                >
                                                    {updatingStatus ? 'Kaydediliyor...' : 'Kaydet'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Responses */}
                            <div className="border-t border-amber-100 pt-4">
                                <h4 className="text-sm font-semibold text-amber-800 mb-3">
                                    Yanıtlar ({feedback.responses.length})
                                </h4>
                                {feedback.responses.length === 0 ? (
                                    <p className="text-sm text-amber-400 italic">Henüz yanıt yok.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {feedback.responses.map((resp) => {
                                            const isManagerResp = resp.createdByRole && managerRoles.includes(resp.createdByRole)
                                            return (
                                                <div
                                                    key={resp.id}
                                                    className={`p-3 rounded-xl border ${
                                                        isManagerResp
                                                            ? 'bg-purple-50 border-purple-200'
                                                            : 'bg-amber-50 border-amber-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`text-xs font-semibold ${isManagerResp ? 'text-purple-700' : 'text-amber-700'}`}>
                                                            {resp.createdByName}
                                                        </span>
                                                        {resp.createdByRole && (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                                isManagerResp ? 'bg-purple-200 text-purple-700' : 'bg-amber-200 text-amber-700'
                                                            }`}>
                                                                {getRoleDisplayName(resp.createdByRole)}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-gray-400">
                                                            {formatDistanceToNow(new Date(resp.createdAt), { addSuffix: true, locale: tr })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{resp.message}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-amber-600">Geri bildirim bulunamadı.</div>
                    )}
                </div>

                {/* Response Input */}
                {feedback && (
                    <div className="flex-shrink-0 p-4 border-t border-amber-100">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSendResponse()
                                    }
                                }}
                                className="flex-1 px-4 py-2.5 bg-white border border-amber-300 rounded-lg text-amber-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="Yanıt yazın..."
                                maxLength={2000}
                            />
                            <button
                                onClick={handleSendResponse}
                                disabled={!responseText.trim() || sendingResponse}
                                className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
