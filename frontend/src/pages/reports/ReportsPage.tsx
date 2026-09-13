import { useState, useEffect, useMemo } from 'react'
import { FileText, Plus, Download, Trash2, ClipboardList, ShoppingBag, Truck, Loader2 } from 'lucide-react'
import { useTopbar } from '../../context/TopbarContext'
import { useListReportsQuery, useDeleteReportMutation, type ReportResponse } from '../../services/reportApi'
import CreateReportModal from '../../components/reports/CreateReportModal'
import FilterSearchBar from '../../components/common/FilterSearchBar'
import { useAppSelector } from '../../hooks/useAuth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const REPORT_TYPE_LABELS: Record<string, string> = {
    ORDER: 'Sipariş',
    STOCK_SALE: 'Stoklu Satış',
    SHIPMENT: 'Sevkiyat'
}

const REPORT_TYPE_ICONS: Record<string, React.ReactNode> = {
    ORDER: <ClipboardList size={14} />,
    STOCK_SALE: <ShoppingBag size={14} />,
    SHIPMENT: <Truck size={14} />
}

const STATUS_LABELS: Record<string, string> = {
    GENERATING: 'Oluşturuluyor',
    COMPLETED: 'Tamamlandı',
    FAILED: 'Hata'
}

export default function ReportsPage() {
    const { setTopbarContent } = useTopbar()
    const token = useAppSelector(state => state.auth.token)
    const [typeFilter, setTypeFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    const { data: reports = [], isLoading, refetch } = useListReportsQuery({
        type: typeFilter !== 'ALL' ? typeFilter : undefined
    })

    const [deleteReport, { isLoading: isDeleting }] = useDeleteReportMutation()

    // Set topbar content
    useEffect(() => {
        setTopbarContent({
            title: 'Raporlar',
            description: 'Raporları görüntüleyin ve yönetin',
            icon: <FileText className="w-8 h-8" />,
            actions: (
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    Rapor Oluştur
                </button>
            )
        })
        return () => setTopbarContent(null)
    }, [setTopbarContent])

    // Filter reports by search
    const filteredReports = useMemo(() => {
        if (!searchQuery.trim()) return reports
        const q = searchQuery.toLocaleLowerCase('tr-TR')
        return reports.filter(r =>
            r.reportNo.toLocaleLowerCase('tr-TR').includes(q) ||
            r.title.toLocaleLowerCase('tr-TR').includes(q) ||
            r.createdByName.toLocaleLowerCase('tr-TR').includes(q)
        )
    }, [reports, searchQuery])

    const handleDownload = (report: ReportResponse) => {
        const url = `${API_BASE}/reports/${report.id}/download`
        fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = blobUrl
                a.download = `${report.reportNo}.pdf`
                a.click()
                URL.revokeObjectURL(blobUrl)
            })
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteReport(id).unwrap()
            setDeleteConfirmId(null)
        } catch (e) {
            console.error('Delete failed', e)
        }
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        })
    }

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }



    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800 border border-green-300'
            case 'GENERATING':
                return 'bg-blue-100 text-blue-800 border border-blue-300'
            case 'FAILED':
                return 'bg-red-100 text-red-800 border border-red-300'
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-300'
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Filter Bar */}
            <FilterSearchBar
                filters={[
                    {
                        label: 'Tür',
                        value: typeFilter,
                        onChange: setTypeFilter,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'ORDER', label: 'Sipariş', activeColor: 'bg-amber-600' },
                            { key: 'STOCK_SALE', label: 'Stoklu Satış', activeColor: 'bg-green-600' },
                            { key: 'SHIPMENT', label: 'Sevkiyat', activeColor: 'bg-blue-600' }
                        ]
                    }
                ]}
                searchPlaceholder="Rapor no, başlık veya oluşturan kişi ara..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Reports Table */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl shadow-xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="animate-spin text-amber-600" size={32} />
                        <span className="ml-3 text-amber-700 font-medium">Yükleniyor...</span>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-amber-700">
                        <FileText size={48} className="mb-3 opacity-40" />
                        <p className="text-lg font-medium">Henüz rapor oluşturulmamış</p>
                        <p className="text-sm text-amber-500 mt-1">Yukarıdaki "Rapor Oluştur" butonuna tıklayarak başlayabilirsiniz</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Rapor No</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Tür</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Başlık</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Dönem</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-amber-900">Kayıt</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Durum</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Oluşturan</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Tarih</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-amber-900">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="border-b border-amber-100 hover:bg-amber-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <p className="text-amber-900 font-mono font-medium">{report.reportNo}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 text-xs font-medium">
                                                {REPORT_TYPE_ICONS[report.reportType]}
                                                {REPORT_TYPE_LABELS[report.reportType] || report.reportType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-amber-900 max-w-[200px] truncate">{report.title}</td>
                                        <td className="px-6 py-4 text-amber-700 text-sm">
                                            {formatDate(report.startDate)} - {formatDate(report.endDate)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-amber-900 font-medium">{report.totalRecords}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusBadge(report.status)}`}>
                                                {STATUS_LABELS[report.status] || report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-amber-700 text-sm">{report.createdByName}</td>
                                        <td className="px-6 py-4 text-amber-700 text-sm">{formatDateTime(report.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {report.status === 'COMPLETED' && (
                                                    <button
                                                        onClick={() => handleDownload(report)}
                                                        className="p-2 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
                                                        title="PDF İndir"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                )}
                                                {deleteConfirmId === report.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleDelete(report.id)}
                                                            disabled={isDeleting}
                                                            className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                        >
                                                            {isDeleting ? '...' : 'Sil'}
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirmId(null)}
                                                            className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
                                                        >
                                                            İptal
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirmId(report.id)}
                                                        className="p-2 rounded-lg text-amber-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={16} />
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



            {/* Create Report Modal */}
            {showCreateModal && (
                <CreateReportModal
                    onClose={() => {
                        setShowCreateModal(false)
                        refetch()
                    }}
                />
            )}
        </div>
    )
}
