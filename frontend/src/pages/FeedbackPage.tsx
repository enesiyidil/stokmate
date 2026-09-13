import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Plus,
    Bug,
    Lightbulb,
    Sparkles,
    MessageCircle,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Trash2,
    MessageSquarePlus,
    ArrowLeft,
    BarChart3,
    MessageSquare,
    AlertTriangle,
    Ban,
    Star,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAppSelector } from '../hooks/useAuth'
import { useTopbar } from '../context/TopbarContext'
import {
    useGetMyFeedbacksQuery,
    useGetAllFeedbacksQuery,
    useDeleteFeedbackMutation,
    useGetFeedbackStatsQuery,
} from '../services/feedbackApi'
import type { FeedbackType, FeedbackStatus, FeedbackSeverity } from '../services/feedbackApi'
import FeedbackFormModal from '../components/feedback/FeedbackFormModal'
import FeedbackDetailModal from '../components/feedback/FeedbackDetailModal'

const typeConfig: Record<FeedbackType, { label: string; icon: typeof Bug; color: string }> = {
    BUG_REPORT: { label: 'Hata Bildirimi', icon: Bug, color: 'text-red-600 bg-red-100 border-red-300' },
    FEATURE_REQUEST: { label: 'Özellik İsteği', icon: Lightbulb, color: 'text-blue-600 bg-blue-100 border-blue-300' },
    SUGGESTION: { label: 'Öneri', icon: Sparkles, color: 'text-emerald-600 bg-emerald-100 border-emerald-300' },
    GENERAL: { label: 'Genel', icon: MessageCircle, color: 'text-amber-600 bg-amber-100 border-amber-300' },
}

const statusConfig: Record<FeedbackStatus, { label: string; icon: typeof AlertCircle; color: string }> = {
    NEW: { label: 'Yeni', icon: AlertCircle, color: 'text-amber-600 bg-amber-100 border-amber-300' },
    REVIEWED: { label: 'İncelendi', icon: Eye, color: 'text-purple-600 bg-purple-100 border-purple-300' },
    IN_PROGRESS: { label: 'İşlemde', icon: Clock, color: 'text-blue-600 bg-blue-100 border-blue-300' },
    IMPLEMENTED: { label: 'Uygulandı', icon: CheckCircle, color: 'text-green-600 bg-green-100 border-green-300' },
    WONT_FIX: { label: 'Uygulanmayacak', icon: Ban, color: 'text-gray-500 bg-gray-100 border-gray-300' },
    CLOSED: { label: 'Kapatıldı', icon: XCircle, color: 'text-gray-500 bg-gray-100 border-gray-300' },
}

const severityConfig: Record<FeedbackSeverity, { label: string; color: string }> = {
    LOW: { label: 'Düşük', color: 'text-green-600 bg-green-50 border-green-200' },
    MEDIUM: { label: 'Orta', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    HIGH: { label: 'Yüksek', color: 'text-orange-600 bg-orange-50 border-orange-200' },
    CRITICAL: { label: 'Kritik', color: 'text-red-600 bg-red-50 border-red-200' },
}

export default function FeedbackPage() {
    const navigate = useNavigate()
    const { setTopbarContent } = useTopbar()
    const { user } = useAppSelector((state) => state.auth)
    const isManager = user?.role && ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user.role)

    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null)
    const [filterType, setFilterType] = useState<FeedbackType | ''>('')
    const [filterStatus, setFilterStatus] = useState<FeedbackStatus | ''>('')

    useEffect(() => {
        setTopbarContent({
            title: 'Geri Bildirim',
            description: 'Geri bildirim ve önerilerinizi yönetin',
            icon: <MessageSquarePlus className="w-8 h-8" />,
            showFiltersInTopbar: true,
            filters: (
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Geri
                </button>
            ),
            actions: (
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Geri Bildirim
                </button>
            ),
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setTopbarContent, navigate])

    const { data: myFeedbacks = [], isLoading: loadingMy } = useGetMyFeedbacksQuery()
    const { data: allFeedbacks = [], isLoading: loadingAll } = useGetAllFeedbacksQuery(
        {
            status: filterStatus || undefined,
            type: filterType || undefined,
        },
        { skip: !isManager }
    )
    const { data: stats } = useGetFeedbackStatsQuery(undefined, { skip: !isManager })
    const [deleteFeedback] = useDeleteFeedbackMutation()

    const feedbacks = activeTab === 'my' ? myFeedbacks : allFeedbacks
    const isLoading = activeTab === 'my' ? loadingMy : loadingAll

    const handleDelete = async (id: string) => {
        if (!confirm('Bu geri bildirimi silmek istediğinize emin misiniz?')) return
        try {
            await deleteFeedback(id).unwrap()
        } catch {
            // handled by RTK Query
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Stats (managers only) */}
            {isManager && stats && activeTab === 'all' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Toplam" value={stats.total} icon={<BarChart3 className="w-5 h-5" />} color="bg-amber-100 text-amber-700 border-amber-200" />
                    <StatCard label="Yeni" value={stats.newCount} icon={<AlertCircle className="w-5 h-5" />} color="bg-orange-100 text-orange-700 border-orange-200" />
                    <StatCard label="İşlemde" value={stats.inProgressCount} icon={<Clock className="w-5 h-5" />} color="bg-blue-100 text-blue-700 border-blue-200" />
                    <StatCard label="Uygulandı" value={stats.implementedCount} icon={<CheckCircle className="w-5 h-5" />} color="bg-green-100 text-green-700 border-green-200" />
                </div>
            )}

            {isManager && stats && activeTab === 'all' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Hata Bildirimi" value={stats.bugReportCount} icon={<Bug className="w-5 h-5" />} color="bg-red-50 text-red-600 border-red-200" />
                    <StatCard label="Özellik İsteği" value={stats.featureRequestCount} icon={<Lightbulb className="w-5 h-5" />} color="bg-blue-50 text-blue-600 border-blue-200" />
                    <StatCard label="Öneri" value={stats.suggestionCount} icon={<Sparkles className="w-5 h-5" />} color="bg-emerald-50 text-emerald-600 border-emerald-200" />
                    <StatCard label="Genel" value={stats.generalCount} icon={<MessageCircle className="w-5 h-5" />} color="bg-amber-50 text-amber-600 border-amber-200" />
                </div>
            )}

            {/* Tabs & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            activeTab === 'my'
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
                        }`}
                    >
                        Geri Bildirimlerim ({myFeedbacks.length})
                    </button>
                    {isManager && (
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                activeTab === 'all'
                                    ? 'bg-amber-600 text-white shadow-md'
                                    : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
                            }`}
                        >
                            Tüm Geri Bildirimler ({allFeedbacks.length})
                        </button>
                    )}
                </div>

                {activeTab === 'all' && isManager && (
                    <div className="flex gap-2">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as FeedbackType | '')}
                            className="px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">Tüm Türler</option>
                            <option value="BUG_REPORT">Hata Bildirimi</option>
                            <option value="FEATURE_REQUEST">Özellik İsteği</option>
                            <option value="SUGGESTION">Öneri</option>
                            <option value="GENERAL">Genel</option>
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as FeedbackStatus | '')}
                            className="px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">Tüm Durumlar</option>
                            <option value="NEW">Yeni</option>
                            <option value="REVIEWED">İncelendi</option>
                            <option value="IN_PROGRESS">İşlemde</option>
                            <option value="IMPLEMENTED">Uygulandı</option>
                            <option value="WONT_FIX">Uygulanmayacak</option>
                            <option value="CLOSED">Kapatıldı</option>
                        </select>
                    </div>
                )}

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Geri Bildirim
                </button>
            </div>

            {/* Feedback List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-amber-700">Yükleniyor...</div>
                ) : feedbacks.length === 0 ? (
                    <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-xl p-12 text-center">
                        <MessageSquarePlus className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                        <p className="text-amber-700 text-lg">Henüz geri bildirim bulunmuyor</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                        >
                            İlk geri bildiriminizi gönderin
                        </button>
                    </div>
                ) : (
                    feedbacks.map((fb) => {
                        const TypeIcon = typeConfig[fb.type].icon
                        const StatusIcon = statusConfig[fb.status].icon
                        const isOwner = fb.createdByEmail === user?.email

                        return (
                            <div
                                key={fb.id}
                                onClick={() => setSelectedFeedbackId(fb.id)}
                                className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-xl p-5 hover:shadow-2xl transition-all cursor-pointer group"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Type Icon */}
                                    <div className={`p-3 rounded-xl border flex-shrink-0 ${typeConfig[fb.type].color}`}>
                                        <TypeIcon className="w-6 h-6" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <h3 className="text-lg font-semibold text-amber-900 group-hover:text-amber-700 transition-colors truncate">
                                                    {fb.title}
                                                </h3>
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium flex-shrink-0 ${statusConfig[fb.status].color}`}>
                                                <StatusIcon className="w-4 h-4" />
                                                {statusConfig[fb.status].label}
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="flex flex-wrap items-center gap-3 mt-2.5 text-sm text-amber-600">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${typeConfig[fb.type].color}`}>
                                                {typeConfig[fb.type].label}
                                            </span>
                                            {fb.severity && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${severityConfig[fb.severity].color}`}>
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {severityConfig[fb.severity].label}
                                                </span>
                                            )}
                                            {fb.rating && fb.rating > 0 && (
                                                <span className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star key={s} className={`w-3 h-3 ${s <= fb.rating! ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                                                    ))}
                                                </span>
                                            )}
                                            <span>•</span>
                                            <span>{fb.createdByName}</span>
                                            <span>•</span>
                                            <span>{formatDistanceToNow(new Date(fb.createdAt), { addSuffix: true, locale: tr })}</span>
                                            {fb.responseCount > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="w-3 h-3" />
                                                        {fb.responseCount} yanıt
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delete (only owner, only NEW) */}
                                    {isOwner && fb.status === 'NEW' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(fb.id)
                                            }}
                                            className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Modals */}
            <FeedbackFormModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
            <FeedbackDetailModal feedbackId={selectedFeedbackId} onClose={() => setSelectedFeedbackId(null)} />
        </div>
    )
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${color}`}>
            {icon}
            <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs font-medium opacity-75">{label}</p>
            </div>
        </div>
    )
}
