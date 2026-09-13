import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
// Force HMR update
import { CheckSquare, Package, Calendar, Truck, User, Trash2 } from 'lucide-react'
import { useListAllAcceptancesQuery, useDeleteAcceptanceMutation } from '../../services/productAcceptanceApi'
import { useGetUserSummariesQuery } from '../../services/userApi'
import { useTopbar } from '../../context/TopbarContext'
import ProductAcceptanceModal from '../../components/orders/ProductAcceptanceModal'
import FilterSearchBar from '../../components/common/FilterSearchBar'
import Pagination from '../../components/common/Pagination'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useToast } from '../../context/ToastContext'
import { useAppSelector } from '../../hooks/useAuth'
import { BRAND_FILTER_OPTIONS, getBrandBadgeClass, getBrandLabel, type BrandFilter } from '../../constants/brandConstants'

export default function ProductAcceptancePage() {
    const [searchParams] = useSearchParams()
    const [showAcceptanceModal, setShowAcceptanceModal] = useState(false)
    const { setTopbarContent } = useTopbar()

    // Filter states
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
        (searchParams.get('status') as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') || 'ALL'
    )
    const [acceptedByFilter, setAcceptedByFilter] = useState<string>('ALL')
    const [brandFilter, setBrandFilter] = useState<BrandFilter>('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [page, setPage] = useState(0)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(0)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Queries
    const { data: pagedData, refetch, isLoading } = useListAllAcceptancesQuery({
        page,
        size: 50,
        search: debouncedSearch || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        brand: brandFilter === 'ALL' ? undefined : brandFilter,
        acceptedBy: acceptedByFilter === 'ALL' ? undefined : acceptedByFilter,
    })
    const acceptances = pagedData?.content || []
    const { data: users = [] } = useGetUserSummariesQuery()
    const [deleteAcceptance, { isLoading: isDeleting }] = useDeleteAcceptanceMutation()
    const { success, error } = useToast()
    const { user } = useAppSelector((state) => state.auth)

    // Admin/Manager can delete acceptances
    const canDeleteAcceptance = ['ADMIN', 'MANAGER'].includes(user?.role || '')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [acceptanceToDelete, setAcceptanceToDelete] = useState<any>(null)

    const handleDeleteAcceptance = async () => {
        if (!acceptanceToDelete) return

        try {
            await deleteAcceptance(acceptanceToDelete.id).unwrap()
            success('Ürün kabul kaydı başarıyla silindi!')
            setShowDeleteConfirm(false)
            setAcceptanceToDelete(null)
            refetch()
        } catch (err: any) {
            error('Hata: ' + (err.data?.message || err.message || 'Bir hata oluştu'))
        }
    }

    // Build acceptor options from the full user summary list so filters are not tied
    // to the current page content.
    const acceptors = useMemo(() => {
        return [...users].sort((a: any, b: any) => {
            const aName = a.displayName || `${a.firstName} ${a.lastName}`
            const bName = b.displayName || `${b.firstName} ${b.lastName}`
            return aName.localeCompare(bName, 'tr')
        })
    }, [users])

    // Reset page on filter change
    const handleStatusChange = (v: any) => { setStatusFilter(v); setPage(0); }
    const handleBrandChange = (v: any) => { setBrandFilter(v); setPage(0); }
    const handleAcceptedByChange = (v: string) => { setAcceptedByFilter(v); setPage(0); }

    useEffect(() => {
        setTopbarContent({
            title: 'Ürün Kabuller',
            description: 'Sipariş ürünlerini kabul edin ve kayıt altına alın',
            icon: <Package className="w-8 h-8" />,
            actions: (
                <button
                    onClick={() => setShowAcceptanceModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <CheckSquare className="w-5 h-5" />
                    Ürün Kabul Et
                </button>
            )
        })
    }, [setTopbarContent])

    return (
        <div className="p-6 space-y-6">
            {/* Filter and Search Bar */}
            <FilterSearchBar
                filters={[
                    {
                        label: 'Durum',
                        value: statusFilter,
                        onChange: handleStatusChange,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'PENDING', label: 'Onay Bekleyen', activeColor: 'bg-yellow-600' },
                            { key: 'APPROVED', label: 'Onaylandı', activeColor: 'bg-green-600' },
                            { key: 'REJECTED', label: 'Reddedildi', activeColor: 'bg-red-600' }
                        ]
                    },
                    {
                        label: 'Kabul Eden',
                        value: acceptedByFilter,
                        onChange: handleAcceptedByChange,
                        type: 'dropdown',
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            ...acceptors.map((u: any) => ({ key: u.id, label: u.displayName || `${u.firstName} ${u.lastName}` }))
                        ]
                    },
                    {
                        label: 'Marka',
                        value: brandFilter,
                        onChange: handleBrandChange,
                        options: BRAND_FILTER_OPTIONS
                    }
                ]}
                searchPlaceholder="Sipariş no, ürün adı veya kodu ile ara..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/95 border border-amber-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                            <Package className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Toplam Kabul (Bekleyen)</p>
                            <p className="text-3xl font-bold text-amber-900">
                                {acceptances.filter((a: any) => a.status === 'PENDING').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/95 border border-amber-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                            <CheckSquare className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Bugün Onaylanan</p>
                            <p className="text-3xl font-bold text-amber-900">
                                {acceptances.filter((a: any) => {
                                    if (a.status !== 'APPROVED') return false
                                    const today = new Date().toISOString().split('T')[0]
                                    return a.acceptanceDate?.startsWith(today)
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/95 border border-amber-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Bu Ay Toplam</p>
                            <p className="text-3xl font-bold text-amber-900">
                                {acceptances.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Acceptances Table */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-amber-200/50">
                    <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-amber-600" />
                        Ürün Kabul Listesi
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Tarih</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Sipariş No</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Ürün</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Marka</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Miktar</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Araç Plaka</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Şoför</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Kabul Eden</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Durum</th>
                                {canDeleteAcceptance && (
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">İşlemler</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={canDeleteAcceptance ? 10 : 9} className="px-6 py-12 text-center text-amber-700">Yükleniyor...</td>
                                </tr>
                            ) : acceptances.length === 0 ? (
                                <tr>
                                    <td colSpan={canDeleteAcceptance ? 10 : 9} className="px-6 py-12 text-center text-amber-700">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Package className="w-12 h-12 text-amber-200" />
                                            <p className="font-medium">Kayıt Bulunamadı</p>
                                            <p className="text-sm opacity-80">Arama kriterlerine uygun ürün kabul kaydı yok.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                acceptances.map((acceptance: any) => (
                                    <tr key={acceptance.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                                        <td className="px-6 py-4 text-amber-900 font-medium whitespace-nowrap">
                                            {new Date(acceptance.acceptanceDate).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                                                {acceptance.orderNumber}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-amber-900 font-medium">{acceptance.productName}</span>
                                                <span className="text-xs text-amber-600 font-mono mt-0.5">{acceptance.productCode}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getBrandBadgeClass(acceptance.brand)}`}>
                                                {getBrandLabel(acceptance.brand)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-amber-900 font-bold bg-amber-100 px-2 py-1 rounded">{acceptance.acceptedQuantity}</span>
                                        </td>
                                        <td className="px-6 py-4 text-amber-700">
                                            <div className="flex items-center gap-1.5">
                                                <Truck className="w-4 h-4 text-amber-400" />
                                                {acceptance.vehiclePlate}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-amber-700">
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-4 h-4 text-amber-400" />
                                                <span className="truncate max-w-[120px]" title={acceptance.driverInfo}>{acceptance.driverInfo}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-amber-700">
                                            {acceptance.acceptedByName}
                                        </td>
                                        <td className="px-6 py-4">
                                            {acceptance.status === 'APPROVED' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                                    Onaylandı
                                                </span>
                                            ) : acceptance.status === 'REJECTED' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                                    Reddedildi
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                    Bekliyor
                                                </span>
                                            )}
                                        </td>
                                        {canDeleteAcceptance && (
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => {
                                                        setAcceptanceToDelete(acceptance)
                                                        setShowDeleteConfirm(true)
                                                    }}
                                                    disabled={isDeleting}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors border border-red-200 text-sm font-medium disabled:opacity-50"
                                                    title="Kabul Kaydını Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Sil
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagedData && pagedData.totalPages > 1 && (
                <Pagination
                    page={page}
                    totalPages={pagedData.totalPages}
                    totalElements={pagedData.totalElements}
                    onPageChange={setPage}
                />
            )}

            {/* Product Acceptance Modal */}
            {showAcceptanceModal && (
                <ProductAcceptanceModal
                    onClose={() => setShowAcceptanceModal(false)}
                    onSuccess={() => {
                        setShowAcceptanceModal(false)
                        refetch()
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false)
                    setAcceptanceToDelete(null)
                }}
                onCancel={() => {
                    setShowDeleteConfirm(false)
                    setAcceptanceToDelete(null)
                }}
                onConfirm={handleDeleteAcceptance}
                title="Ürün Kabulü Sil"
                message={`"${acceptanceToDelete?.productName}" ürününün kabul kaydını silmek istediğinizden emin misiniz? Bu işlem kabul edilen miktarları geri alır ve sipariste güncelleme yapar.`}
                confirmText={isDeleting ? 'Siliniyor...' : 'Sil'}
                cancelText="Vazgeç"
                type="danger"
            />
        </div>
    )
}
