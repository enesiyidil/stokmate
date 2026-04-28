import { useState, useEffect, useMemo, useCallback } from 'react'
import { ShoppingCart, Plus, CheckCircle, XCircle, Clock, Upload, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useListOrdersQuery } from '../services/orderApi'
import { useGetUserSummariesQuery } from '../services/userApi'
import { useTopbar } from '../context/TopbarContext'
import BrandBadge from '../components/common/BrandBadge'
import AddOrderModal from '../components/orders/AddOrderModal'
import BulkUploadModal from '../components/orders/BulkUploadModal'
import OtpVerificationModal from '../components/common/OtpVerificationModal'
import FilterSearchBar from '../components/common/FilterSearchBar'
import Pagination from '../components/common/Pagination'
import type { Brand } from '../constants/brandConstants'
import { useAppSelector } from '../hooks/useAuth'

export default function OrdersPage() {
    const navigate = useNavigate()
    const { setTopbarContent } = useTopbar()
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [typeFilter, setTypeFilter] = useState('ALL')
    const [consultantFilter, setConsultantFilter] = useState('ALL')
    const [brandFilter, setBrandFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [page, setPage] = useState(0)
    const [showAddMenu, setShowAddMenu] = useState(false)
    const [showManualModal, setShowManualModal] = useState(false)
    const [showBulkModal, setShowBulkModal] = useState(false)
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)
    const user = useAppSelector(state => state.auth.user)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(0)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Reset page when filters change
    const handleStatusFilter = useCallback((val: string) => { setStatusFilter(val); setPage(0) }, [])
    const handleTypeFilter = useCallback((val: string) => { setTypeFilter(val); setPage(0) }, [])
    const handleConsultantFilter = useCallback((val: string) => { setConsultantFilter(val); setPage(0) }, [])
    const handleBrandFilter = useCallback((val: string) => { setBrandFilter(val); setPage(0) }, [])

    const verifyGate = (action: () => void) => {
        if (user?.totpEnabled) {
            setPendingAction(() => action)
            setShowOtpModal(true)
        } else {
            action()
        }
    }

    const { data: ordersData, isLoading } = useListOrdersQuery({
        page,
        size: 50,
        search: debouncedSearch || undefined,
        statusGroup: statusFilter !== 'ALL' ? statusFilter : undefined,
        orderType: typeFilter !== 'ALL' && typeFilter !== 'HAS_SSH' ? typeFilter : undefined,
        brand: brandFilter !== 'ALL' ? brandFilter : undefined,
        consultantId: consultantFilter !== 'ALL' ? consultantFilter : undefined,
        includeHidden: true,
    })

    const orders = ordersData?.content ?? []
    const { data: users = [] } = useGetUserSummariesQuery()

    // Get sales consultants (users with role STORE_EMPLOYEE)
    const salesConsultants = useMemo(() => {
        return users.filter((user) => user.role === 'STORE_EMPLOYEE')
    }, [users])

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
                                        setShowAddMenu(false)
                                        verifyGate(() => setShowManualModal(true))
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
                                        setShowAddMenu(false)
                                        verifyGate(() => setShowBulkModal(true))
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
            )
        })
    }, [showAddMenu, setTopbarContent])

    const getStatusBadge = (status: string) => {
        // Simplified 3-state status system: IN_PROGRESS, COMPLETED, CANCELLED
        switch (status) {
            case 'TAMAMLANDI':
            case 'COMPLETED':
            case 'DELIVERED':
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
            // All other statuses (IN_PROGRESS, legacy statuses) show as "Devam Ediyor"
            case 'IN_PROGRESS':
            case 'DEVAM_EDIYOR':
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
            {/* Filter and Search Bar */}
            <FilterSearchBar
                filters={[
                    {
                        label: 'Durum',
                        value: statusFilter,
                        onChange: handleStatusFilter,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'DEVAM_EDIYOR', label: 'Devam Ediyor', activeColor: 'bg-yellow-600' },
                            { key: 'TAMAMLANDI', label: 'Tamamlandı', activeColor: 'bg-green-600' },
                            { key: 'IPTAL_EDILDI', label: 'İptal Edildi', activeColor: 'bg-red-600' }
                        ]
                    },
                    {
                        label: 'Tür',
                        value: typeFilter,
                        onChange: handleTypeFilter,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'CUSTOMER_SPECIFIC', label: 'Müşteriye Özel', activeColor: 'bg-blue-600' },
                            { key: 'STOCK', label: 'Stok', activeColor: 'bg-green-600' },
                            { key: 'AFTER_SALES_SERVICE', label: 'SSH', activeColor: 'bg-orange-600' },
                        ]
                    },
                    {
                        label: 'Danışman',
                        value: consultantFilter,
                        onChange: handleConsultantFilter,
                        type: 'dropdown',
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            ...salesConsultants.map(c => ({ key: c.id, label: `${c.firstName} ${c.lastName}` }))
                        ]
                    },
                    {
                        label: 'Marka',
                        value: brandFilter,
                        onChange: handleBrandFilter,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'OAK', label: 'Doğtaş', activeColor: 'bg-red-600' },
                            { key: 'MAPLE', label: 'Maple', activeColor: 'bg-blue-600' },
                            { key: 'PINE', label: 'Pine', activeColor: 'bg-purple-600' },
                        ]
                    }
                ]}
                searchPlaceholder="Sipariş no, sözleşme no, müşteri adı, danışman adı..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            />

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
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Marka</th>
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
                                        <td colSpan={10} className="px-6 py-12 text-center text-amber-700">
                                            {statusFilter !== 'ALL' ? 'Bu durumda sipariş bulunamadı' : 'Henüz sipariş bulunmuyor'}
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => {
                                        const statusBadge = getStatusBadge(order.status)
                                        const StatusIcon = statusBadge.icon


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
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${order.orderType === 'STOCK'
                                                            ? 'bg-green-100 text-green-800 border border-green-300'
                                                            : order.orderType === 'CUSTOMER_SPECIFIC'
                                                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                                : order.orderType === 'AFTER_SALES_SERVICE'
                                                                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                                                    : 'bg-gray-100 text-gray-800 border border-gray-300'
                                                            }`}>
                                                            {order.orderType === 'STOCK' ? 'STOK' : order.orderType === 'CUSTOMER_SPECIFIC' ? 'MÜŞTERİ' : order.orderType === 'AFTER_SALES_SERVICE' ? 'SSH' : order.orderType}
                                                        </span>
                                                        {/* İptal Stoğu etiketi - müşteriden stoğa dönüştürülen siparişler için */}
                                                        {order.convertedFromCustomer && (
                                                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded text-xs font-bold">
                                                                İPTAL STOĞU
                                                            </span>
                                                        )}
                                                        {order.childSshOrders && order.childSshOrders.length > 0 && (
                                                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded text-xs font-bold">
                                                                +{order.childSshOrders.length} SSH
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {order.brand ? (
                                                        <BrandBadge brand={order.brand as Brand} />
                                                    ) : (
                                                        <span className="text-amber-400">-</span>
                                                    )}
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

                {/* Pagination */}
                {ordersData && (
                    <Pagination
                        page={page}
                        totalPages={ordersData.totalPages}
                        totalElements={ordersData.totalElements}
                        onPageChange={setPage}
                        itemLabel="sipariş"
                    />
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

            <OtpVerificationModal
                isOpen={showOtpModal}
                onClose={() => {
                    setShowOtpModal(false)
                    setPendingAction(null)
                }}
                onVerify={() => {
                    setShowOtpModal(false)
                    if (pendingAction) {
                        pendingAction()
                        setPendingAction(null)
                    }
                }}
            />
        </div>
    )
}
