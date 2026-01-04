import { useState, useEffect, useMemo } from 'react'
import { ShoppingCart, Plus, Filter, CheckCircle, XCircle, Clock, FileText, Upload, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useListOrdersQuery, type OrderStatus } from '../services/orderApi'
import { useGetAllUsersQuery } from '../services/userApi'
import AddOrderModal from '../components/orders/AddOrderModal'
import BulkUploadModal from '../components/orders/BulkUploadModal'
import { useTopbar } from '../context/TopbarContext'

export default function OrdersPage() {
    const navigate = useNavigate()
    const [showAddMenu, setShowAddMenu] = useState(false)
    const [showManualModal, setShowManualModal] = useState(false)
    const [showBulkModal, setShowBulkModal] = useState(false)
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'IPTAL_EDILDI'>('ALL')
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'STOCK' | 'CUSTOMER_SPECIFIC' | 'AFTER_SALES_SERVICE'>('ALL')
    const [consultantFilter, setConsultantFilter] = useState<string>('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    const { setTopbarContent } = useTopbar()
    const { data: allOrders = [], isLoading } = useListOrdersQuery({})
    const { data: users = [] } = useGetAllUsersQuery()

    // Get sales consultants (users with role MAGAZA_CALISAN - store employees)
    const salesConsultants = useMemo(() => {
        const consultants = users.filter((user: any) => user.role === 'MAGAZA_CALISAN')
        console.log('Users:', users)
        console.log('Sales Consultants:', consultants)
        return consultants
    }, [users])

    // Filter orders based on all criteria
    const orders = useMemo(() => {
        return allOrders.filter(order => {
            // Status filter
            if (statusFilter !== 'ALL') {
                const matchesStatus = order.status === statusFilter
                if (!matchesStatus) return false
            }

            // Type filter
            if (typeFilter !== 'ALL') {
                if (order.orderType !== typeFilter) return false
            }

            // Consultant filter
            if (consultantFilter !== 'ALL') {
                if (!order.salesConsultant || order.salesConsultant.id !== consultantFilter) return false
            }

            // Search query (Turkish locale-aware)
            if (searchQuery.trim()) {
                const query = searchQuery.toLocaleLowerCase('tr-TR')
                const matchesOrderNo = order.orderNo?.toLocaleLowerCase('tr-TR').includes(query)
                const matchesContractNo = order.prosapContractNo?.toLocaleLowerCase('tr-TR').includes(query)
                const matchesCustomerName = order.customer
                    ? `${order.customer.firstName} ${order.customer.lastName}`.toLocaleLowerCase('tr-TR').includes(query)
                    : order.prosapContractNameSurname?.toLocaleLowerCase('tr-TR').includes(query)

                if (!matchesOrderNo && !matchesContractNo && !matchesCustomerName) return false
            }

            return true
        })
    }, [allOrders, statusFilter, typeFilter, consultantFilter, searchQuery])

    // Set topbar content
    useEffect(() => {
        setTopbarContent({
            title: 'Siparişler',
            description: 'Siparişleri görüntüleyin ve yönetin',
            icon: <ShoppingCart className="w-8 h-8" />,
            actions: (
                <div className="relative">
                    <button
                        onClick={() => setShowAddMenu(!showAddMenu)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        Yeni Sipariş Ekle
                    </button>
                    {showAddMenu && (
                        <div className="absolute right-0 mt-2 w-72 bg-white border border-amber-200 rounded-xl shadow-2xl overflow-hidden z-50">
                            <div className="p-2">
                                <button
                                    onClick={() => {
                                        setShowManualModal(true)
                                        setShowAddMenu(false)
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-amber-900 hover:bg-amber-50 hover:text-amber-900 rounded-lg transition-colors"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-amber-700 to-orange-700 rounded-lg flex items-center justify-center">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Manuel Ekleme</p>
                                        <p className="text-sm text-amber-600">Tek sipariş ekle</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowBulkModal(true)
                                        setShowAddMenu(false)
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-amber-900 hover:bg-amber-50 hover:text-amber-900 rounded-lg transition-colors"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-700 to-emerald-700 rounded-lg flex items-center justify-center">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Dosyadan Toplu Ekleme</p>
                                        <p className="text-sm text-amber-600">Excel dosyası yükle</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ),
            filters: (
                <div className="flex items-start gap-6 flex-wrap">
                    {/* Status Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-amber-200 text-sm font-medium">Durum:</span>
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${statusFilter === 'ALL'
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/50'
                                }`}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setStatusFilter('DEVAM_EDIYOR')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${statusFilter === 'DEVAM_EDIYOR'
                                ? 'bg-yellow-600 text-white shadow-md'
                                : 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/50'
                                }`}
                        >
                            Devam Ediyor
                        </button>
                        <button
                            onClick={() => setStatusFilter('TAMAMLANDI')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${statusFilter === 'TAMAMLANDI'
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/50'
                                }`}
                        >
                            Tamamlandı
                        </button>
                        <button
                            onClick={() => setStatusFilter('IPTAL_EDILDI')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${statusFilter === 'IPTAL_EDILDI'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/50'
                                }`}
                        >
                            İptal Edildi
                        </button>
                    </div>

                    <div className="h-8 w-px bg-amber-700/30"></div>

                    {/* Type Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-amber-200 text-sm font-medium">Tür:</span>
                        <button
                            onClick={() => setTypeFilter('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${typeFilter === 'ALL'
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/50'
                                }`}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setTypeFilter('CUSTOMER_SPECIFIC')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${typeFilter === 'CUSTOMER_SPECIFIC'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/50'
                                }`}
                        >
                            Müşteriye Özel
                        </button>
                        <button
                            onClick={() => setTypeFilter('STOCK')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${typeFilter === 'STOCK'
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/50'
                                }`}
                        >
                            Stok
                        </button>
                        <button
                            onClick={() => setTypeFilter('AFTER_SALES_SERVICE')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${typeFilter === 'AFTER_SALES_SERVICE'
                                ? 'bg-orange-600 text-white shadow-md'
                                : 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/50'
                                }`}
                        >
                            SSH
                        </button>
                    </div>

                    {/* Consultant Filter */}
                    <>
                        <div className="h-8 w-px bg-amber-700/30"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-amber-200 text-sm font-medium">Danışman:</span>
                            <select
                                value={consultantFilter}
                                onChange={(e) => setConsultantFilter(e.target.value)}
                                className="px-3 py-1.5 rounded-lg text-sm bg-amber-950/40 text-amber-200 border border-amber-700/30 hover:bg-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-all cursor-pointer"
                            >
                                <option value="ALL" className="bg-amber-950 text-amber-200">Tümü</option>
                                {salesConsultants.map(consultant => (
                                    <option
                                        key={consultant.id}
                                        value={consultant.id}
                                        className="bg-amber-950 text-amber-200"
                                    >
                                        {consultant.firstName} {consultant.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                </div>
            )
        })
    }, [showAddMenu, statusFilter, typeFilter, consultantFilter, salesConsultants, setTopbarContent])

    const getStatusBadge = (status: string) => {
        // Simplify status display for list view - detailed status shown in detail modal
        switch (status) {
            case 'TAMAMLANDI':
            case 'COMPLETED':
            case 'DELIVERED':
            case 'ACCEPTED':
            case 'SHIPMENT_APPROVED':
                return {
                    label: 'Tamamlandı',
                    icon: CheckCircle,
                    className: 'bg-green-100 text-green-800 border-green-400'
                }
            case 'IPTAL_EDILDI':
            case 'CANCELLED':
                return {
                    label: 'İptal Edildi',
                    icon: XCircle,
                    className: 'bg-red-100 text-red-800 border-red-400'
                }
            // All other statuses show as "Devam Ediyor"
            default:
                return {
                    label: 'Devam Ediyor',
                    icon: Clock,
                    className: 'bg-blue-100 text-blue-800 border-blue-400'
                }
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR')
    }

    return (
        <div className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl p-4 shadow-lg">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                    <input
                        type="text"
                        placeholder="Sipariş no, sözleşme no veya müşteri adına göre ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>
            </div>

            {/* Orders Table */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl shadow-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-amber-700">Yükleniyor...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Sipariş No</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Tür</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Sözleşme No</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Ad Soyad</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Satış Danışmanı</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Tarih</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Ürün Sayısı</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Durum</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Fatura</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-amber-700">
                                            {statusFilter ? 'Bu durumda sipariş bulunamadı' : 'Henüz sipariş bulunmuyor'}
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => {
                                        const statusBadge = getStatusBadge(order.status)
                                        const StatusIcon = statusBadge.icon

                                        // Debug: Log order data to console
                                        if (order.orderNo) {
                                            console.log(`Order ${order.orderNo}:`, {
                                                orderType: order.orderType,
                                                salesConsultant: order.salesConsultant,
                                                hasSalesConsultant: !!order.salesConsultant
                                            })
                                        }

                                        return (
                                            <tr
                                                key={order.id}
                                                onClick={() => navigate(`/orders/${order.id}`)}
                                                className={`border-b border-amber-100 hover:bg-amber-50 transition-colors cursor-pointer ${order.orderType === 'STOCK'
                                                    ? 'bg-green-500/5'
                                                    : order.orderType === 'CUSTOMER_SPECIFIC'
                                                        ? 'bg-blue-500/5'
                                                        : ''
                                                    }`}
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="text-amber-900 font-medium">{order.orderNo}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${order.orderType === 'STOCK'
                                                        ? 'bg-green-100 text-green-800 border border-green-300'
                                                        : order.orderType === 'CUSTOMER_SPECIFIC'
                                                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                            : 'bg-gray-100 text-gray-800 border border-gray-300'
                                                        }`}>
                                                        {order.orderType === 'STOCK' ? 'STOK' : order.orderType === 'CUSTOMER_SPECIFIC' ? 'MÜŞTERİ' : order.orderType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-amber-700">{order.prosapContractNo}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {order.customer ? (
                                                        <p className="text-amber-900">
                                                            {order.customer.firstName} {order.customer.lastName}
                                                        </p>
                                                    ) : (
                                                        <p className="text-amber-700">
                                                            {order.prosapContractNameSurname}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {order.salesConsultant ? (
                                                        <p className="text-amber-900">
                                                            {order.salesConsultant.firstName} {order.salesConsultant.lastName}
                                                        </p>
                                                    ) : (
                                                        <p className="text-amber-400">-</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-amber-700">{formatDate(order.orderDate)}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium">
                                                        {order.products.length} Ürün
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-lg text-sm font-medium border flex items-center gap-2 w-fit ${statusBadge.className}`}>
                                                        <StatusIcon className="w-4 h-4" />
                                                        {statusBadge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {order.hasInvoice ? (
                                                        <span className="flex items-center gap-2 text-green-400">
                                                            <FileText className="w-4 h-4" />
                                                            Var
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600">Yok</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showManualModal && (
                <AddOrderModal
                    onClose={() => setShowManualModal(false)}
                    onSuccess={() => setShowManualModal(false)}
                />
            )}

            {showBulkModal && (
                <BulkUploadModal
                    onClose={() => setShowBulkModal(false)}
                    onSuccess={() => setShowBulkModal(false)}
                />
            )}
        </div>
    )




}
