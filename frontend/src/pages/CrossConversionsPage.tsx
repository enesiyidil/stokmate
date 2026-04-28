import { useState, useEffect } from 'react'
import { Repeat, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useTopbar } from '../context/TopbarContext'
import { useAppSelector } from '../hooks/useAuth'
import { useListCrossConversionsQuery, useDeleteCrossConversionMutation, type CrossConversionResponse } from '../services/crossConversionApi'
import FilterSearchBar from '../components/common/FilterSearchBar'
import Pagination from '../components/common/Pagination'
import BrandBadge from '../components/common/BrandBadge'
import AddCrossConversionModal from '../components/crossconversion/AddCrossConversionModal'
import EditCrossConversionModal from '../components/crossconversion/EditCrossConversionModal'
import type { Brand } from '../constants/brandConstants'

export default function CrossConversionsPage() {
    const { setTopbarContent } = useTopbar()
    const user = useAppSelector(state => state.auth.user)
    const userRole = user?.role || ''

    const [sourceBrandFilter, setSourceBrandFilter] = useState('ALL')
    const [targetBrandFilter, setTargetBrandFilter] = useState('ALL')
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [page, setPage] = useState(0)

    const [showAddModal, setShowAddModal] = useState(false)
    const [editItem, setEditItem] = useState<CrossConversionResponse | null>(null)
    const [deleteItem, setDeleteItem] = useState<CrossConversionResponse | null>(null)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(0)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const { data: pagedData, isLoading } = useListCrossConversionsQuery({
        page,
        size: 50,
        search: debouncedSearch || undefined,
        sourceBrand: sourceBrandFilter !== 'ALL' ? sourceBrandFilter : undefined,
        targetBrand: targetBrandFilter !== 'ALL' ? targetBrandFilter : undefined,
    })
    const [deleteCrossConversion, { isLoading: isDeleting }] = useDeleteCrossConversionMutation()

    // Permission checks
    const canCreate = ['ADMIN', 'MANAGER', 'DIRECTOR', 'STORE_MANAGER', 'STORE_EMPLOYEE'].includes(userRole)
    const canUpdate = ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(userRole)
    const canDelete = ['ADMIN', 'MANAGER'].includes(userRole)

    const items = pagedData?.content || []

    const handleSourceBrandChange = (v: string) => { setSourceBrandFilter(v); setPage(0); }
    const handleTargetBrandChange = (v: string) => { setTargetBrandFilter(v); setPage(0); }

    const handleDelete = async () => {
        if (!deleteItem) return
        try {
            await deleteCrossConversion(deleteItem.id).unwrap()
            setDeleteItem(null)
        } catch (error: any) {
            console.error('Failed to delete:', error)
            alert(error?.data?.message || 'Silme işlemi başarısız')
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR')
    }

    const getOrderTypeLabel = (type: string) => {
        switch (type) {
            case 'CUSTOMER_SPECIFIC': return 'Müşteriye Özel'
            case 'STOCK': return 'Stoklu Satış'
            default: return type
        }
    }

    // Set topbar content
    useEffect(() => {
        setTopbarContent({
            title: 'Çapraz Dönüştürme',
            description: 'Markalar arası dönüştürme kayıtlarını yönetin',
            icon: <Repeat className="w-8 h-8" />,
            actions: canCreate ? (
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Ekle
                </button>
            ) : undefined
        })
    }, [setTopbarContent, canCreate])

    return (
        <div className="p-6 space-y-6">
            {/* Filters */}
            <FilterSearchBar
                filters={[
                    {
                        label: 'Nereden',
                        value: sourceBrandFilter,
                        onChange: handleSourceBrandChange,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'OAK', label: 'Doğtaş', activeColor: 'bg-red-600' },
                            { key: 'MAPLE', label: 'Maple', activeColor: 'bg-blue-600' },
                            { key: 'PINE', label: 'Pine', activeColor: 'bg-purple-600' },
                        ]
                    },
                    {
                        label: 'Nereye',
                        value: targetBrandFilter,
                        onChange: handleTargetBrandChange,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'OAK', label: 'Doğtaş', activeColor: 'bg-red-600' },
                            { key: 'MAPLE', label: 'Maple', activeColor: 'bg-blue-600' },
                            { key: 'PINE', label: 'Pine', activeColor: 'bg-purple-600' },
                        ]
                    },
                ]}
                searchPlaceholder="Müşteri adı, sözleşme no veya sipariş no..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Table */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl shadow-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-amber-700">Yükleniyor...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Müşteri</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Sözleşme No</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Sözleşme Tipi</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Nereden</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Nereye</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Tarih</th>
                                    {(canUpdate || canDelete) && (
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">İşlemler</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={canUpdate || canDelete ? 7 : 6} className="px-6 py-12 text-center text-amber-700">
                                            Henüz çapraz dönüştürme kaydı bulunmuyor
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-amber-100 hover:bg-amber-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-amber-900 font-medium">
                                                    {item.customerFirstName} {item.customerLastName}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-amber-700">{item.contractNo || item.orderNo}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${item.orderType === 'CUSTOMER_SPECIFIC'
                                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                    : 'bg-green-100 text-green-800 border border-green-300'
                                                    }`}>
                                                    {getOrderTypeLabel(item.orderType)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <BrandBadge brand={item.sourceBrand as Brand} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <BrandBadge brand={item.targetBrand as Brand} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-amber-700">{formatDate(item.createdAt)}</p>
                                            </td>
                                            {(canUpdate || canDelete) && (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {canUpdate && (
                                                            <button
                                                                onClick={() => setEditItem(item)}
                                                                className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                                                title="Düzenle"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button
                                                                onClick={() => setDeleteItem(item)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Sil"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagedData && (
                <Pagination
                    page={page}
                    totalPages={pagedData.totalPages}
                    totalElements={pagedData.totalElements}
                    onPageChange={setPage}
                />
            )}

            {/* Add Modal */}
            {showAddModal && (
                <AddCrossConversionModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => setShowAddModal(false)}
                />
            )}

            {/* Edit Modal */}
            {editItem && (
                <EditCrossConversionModal
                    item={editItem}
                    onClose={() => setEditItem(null)}
                    onSuccess={() => setEditItem(null)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-red-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-red-900">Silme Onayı</h3>
                                    <p className="text-sm text-red-600">Bu işlem geri alınamaz!</p>
                                </div>
                            </div>
                            <p className="text-amber-800">
                                <strong>{deleteItem.customerFirstName} {deleteItem.customerLastName}</strong> müşterisine ait çapraz dönüştürme kaydını silmek istediğinizden emin misiniz?
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setDeleteItem(null)}
                                    className="flex-1 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
