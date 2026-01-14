import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Monitor, Building2, FileText, AlertCircle, Clock, CheckCircle, XCircle, X, Send, Trash2, MessageSquare, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useAppSelector } from '../hooks/useAuth'
import { useTopbar } from '../context/TopbarContext'
import {
    useGetMyRequestsQuery,
    useGetAllRequestsQuery,
    useCreateRequestMutation,
    useUpdateRequestStatusMutation,
    useCancelRequestMutation,
    useDeleteRequestMutation,
} from '../services/supportRequestApi'
import type {
    SupportRequestResponse,
    CreateSupportRequestRequest,
} from '../services/supportRequestApi'

const categoryConfig = {
    IT: { label: 'IT / Bilişim', icon: Monitor, color: 'text-blue-600 bg-blue-100 border-blue-300' },
    FACILITY: { label: 'Tesis / Bina', icon: Building2, color: 'text-green-600 bg-green-100 border-green-300' },
    OTHER: { label: 'Diğer', icon: FileText, color: 'text-gray-600 bg-gray-100 border-gray-300' },
}

const statusConfig = {
    OPEN: { label: 'Açık', icon: AlertCircle, color: 'text-amber-600 bg-amber-100 border-amber-300' },
    IN_PROGRESS: { label: 'İşlemde', icon: Clock, color: 'text-blue-600 bg-blue-100 border-blue-300' },
    RESOLVED: { label: 'Çözüldü', icon: CheckCircle, color: 'text-green-600 bg-green-100 border-green-300' },
    CANCELLED: { label: 'İptal', icon: XCircle, color: 'text-gray-500 bg-gray-100 border-gray-300' },
}

const priorityConfig = {
    LOW: { label: 'Düşük', color: 'text-green-600 bg-green-50 border-green-200' },
    MEDIUM: { label: 'Orta', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    HIGH: { label: 'Yüksek', color: 'text-red-600 bg-red-50 border-red-200' },
}

export default function SupportRequestsPage() {
    const navigate = useNavigate()
    const { setTopbarContent } = useTopbar()
    const { user } = useAppSelector((state) => state.auth)
    const isManager = user?.role && ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user.role)

    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showResolveModal, setShowResolveModal] = useState<SupportRequestResponse | null>(null)
    const [resolution, setResolution] = useState('')

    useEffect(() => {
        setTopbarContent({
            title: 'Talepler',
            description: 'Destek Taleplerini Yönetin',
            icon: <MessageSquare className="w-8 h-8" />,
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
                    Yeni Talep
                </button>
            )
        })

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setTopbarContent, navigate])

    const { data: myRequests = [], isLoading: loadingMy } = useGetMyRequestsQuery()
    const { data: allRequests = [], isLoading: loadingAll } = useGetAllRequestsQuery(undefined, { skip: !isManager })

    const [createRequest, { isLoading: creating }] = useCreateRequestMutation()
    const [updateStatus, { isLoading: updating }] = useUpdateRequestStatusMutation()
    const [cancelRequest] = useCancelRequestMutation()
    const [deleteRequest] = useDeleteRequestMutation()

    const [form, setForm] = useState<CreateSupportRequestRequest>({
        title: '',
        description: '',
        category: 'IT',
        priority: 'MEDIUM',
    })

    const requests = activeTab === 'my' ? myRequests : allRequests
    const isLoading = activeTab === 'my' ? loadingMy : loadingAll

    const handleCreate = async () => {
        if (!form.title.trim()) return
        try {
            await createRequest(form).unwrap()
            setShowCreateModal(false)
            setForm({ title: '', description: '', category: 'IT', priority: 'MEDIUM' })
        } catch (err) {
            // Error handled silently
        }
    }

    const handleResolve = async () => {
        if (!showResolveModal) return
        try {
            await updateStatus({
                id: showResolveModal.id,
                data: { status: 'RESOLVED', resolution },
            }).unwrap()
            setShowResolveModal(null)
            setResolution('')
        } catch (err) {
            // Error handled silently
        }
    }

    const handleStartProgress = async (request: SupportRequestResponse) => {
        try {
            await updateStatus({
                id: request.id,
                data: { status: 'IN_PROGRESS' },
            }).unwrap()
        } catch (err) {
            // Error handled silently
        }
    }

    const handleCancel = async (id: string) => {
        if (!confirm('Bu talebi iptal etmek istediğinize emin misiniz?')) return
        try {
            await cancelRequest(id).unwrap()
        } catch (err) {
            // Error handled silently
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return
        try {
            await deleteRequest(id).unwrap()
        } catch (err) {
            // Error handled silently
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Tabs and Actions */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'my'
                            ? 'bg-amber-600 text-white shadow-md'
                            : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
                            }`}
                    >
                        Taleplerim ({myRequests.length})
                    </button>
                    {isManager && (
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'all'
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
                                }`}
                        >
                            Tüm Talepler ({allRequests.length})
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Talep
                </button>
            </div>

            {/* Request List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-amber-700">Yükleniyor...</div>
                ) : requests.length === 0 ? (
                    <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-xl p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                        <p className="text-amber-700 text-lg">Henüz talep bulunmuyor</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                        >
                            İlk talebinizi oluşturun
                        </button>
                    </div>
                ) : (
                    requests.map((request) => {
                        const CategoryIcon = categoryConfig[request.category].icon
                        const StatusIcon = statusConfig[request.status].icon
                        const isOwner = request.createdById === user?.id

                        return (
                            <div
                                key={request.id}
                                className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-xl p-5 hover:shadow-2xl transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Category Icon */}
                                    <div className={`p-3 rounded-xl border ${categoryConfig[request.category].color}`}>
                                        <CategoryIcon className="w-6 h-6" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-amber-900">{request.title}</h3>
                                                {request.description && (
                                                    <p className="text-amber-700 mt-1 line-clamp-2">{request.description}</p>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${statusConfig[request.status].color}`}>
                                                <StatusIcon className="w-4 h-4" />
                                                {statusConfig[request.status].label}
                                            </div>
                                        </div>

                                        {/* Meta Info */}
                                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-amber-600">
                                            <span className={`px-2 py-0.5 rounded border ${priorityConfig[request.priority].color}`}>
                                                {priorityConfig[request.priority].label}
                                            </span>
                                            <span>{categoryConfig[request.category].label}</span>
                                            <span>•</span>
                                            <span>{request.createdByName}</span>
                                            <span>•</span>
                                            <span>{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: tr })}</span>
                                        </div>

                                        {/* Resolution */}
                                        {request.resolution && (
                                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <p className="text-sm text-green-800"><strong>Çözüm:</strong> {request.resolution}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {isManager && request.status === 'OPEN' && (
                                            <button
                                                onClick={() => handleStartProgress(request)}
                                                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                            >
                                                Başla
                                            </button>
                                        )}
                                        {isManager && (request.status === 'OPEN' || request.status === 'IN_PROGRESS') && (
                                            <button
                                                onClick={() => setShowResolveModal(request)}
                                                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                            >
                                                Çöz
                                            </button>
                                        )}
                                        {isOwner && request.status === 'OPEN' && (
                                            <>
                                                <button
                                                    onClick={() => handleCancel(request.id)}
                                                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                    İptal
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(request.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Create Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-amber-900">Yeni Talep Oluştur</h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-amber-700" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-amber-700 mb-1">Başlık *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="Talep başlığı..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-amber-700 mb-1">Açıklama</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                        placeholder="Detaylı açıklama..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-1">Kategori</label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value as 'IT' | 'FACILITY' | 'OTHER' })}
                                            className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="IT">🖥️ IT / Bilişim</option>
                                            <option value="FACILITY">🏢 Tesis / Bina</option>
                                            <option value="OTHER">📋 Diğer</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-1">Öncelik</label>
                                        <select
                                            value={form.priority}
                                            onChange={(e) => setForm({ ...form, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                                            className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="LOW">🟢 Düşük</option>
                                            <option value="MEDIUM">🟡 Orta</option>
                                            <option value="HIGH">🔴 Yüksek</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={creating || !form.title.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                    {creating ? 'Gönderiliyor...' : 'Gönder'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Resolve Modal */}
            {
                showResolveModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-amber-900">Talebi Çöz</h2>
                                <button onClick={() => setShowResolveModal(null)} className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-amber-700" />
                                </button>
                            </div>

                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="font-medium text-amber-900">{showResolveModal.title}</p>
                                {showResolveModal.description && (
                                    <p className="text-sm text-amber-700 mt-1">{showResolveModal.description}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-1">Çözüm Notu</label>
                                <textarea
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                    placeholder="Yapılan işlem veya çözüm açıklaması..."
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowResolveModal(null)}
                                    className="flex-1 px-4 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleResolve}
                                    disabled={updating}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {updating ? 'Kaydediliyor...' : 'Çözüldü Olarak İşaretle'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
