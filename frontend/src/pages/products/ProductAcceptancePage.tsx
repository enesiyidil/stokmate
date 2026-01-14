import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
// Force HMR update
import { CheckSquare, Package, Calendar, Truck, User } from 'lucide-react'
import { useGetOrderAcceptancesQuery } from '../../services/productAcceptanceApi'
import { useGetUserSummariesQuery } from '../../services/userApi'
import { useTopbar } from '../../context/TopbarContext'
import ProductAcceptanceModal from '../../components/orders/ProductAcceptanceModal'
import FilterSearchBar from '../../components/common/FilterSearchBar'

export default function ProductAcceptancePage() {
    const [searchParams] = useSearchParams()
    const [showAcceptanceModal, setShowAcceptanceModal] = useState(false)
    const { setTopbarContent } = useTopbar()

    // Filter states
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
        (searchParams.get('status') as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') || 'ALL'
    )
    const [acceptedByFilter, setAcceptedByFilter] = useState<string>('ALL')
    const [approvedByFilter, setApprovedByFilter] = useState<string>('ALL')
    const [brandFilter, setBrandFilter] = useState<'ALL' | 'OAK' | 'MAPLE' | 'PINE' | 'MARKASIZ'>('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    // Queries
    // Passing empty string to get all acceptances (assuming endpoint supports this or returns all if empty)
    const { data: allAcceptances = [], refetch, isLoading } = useGetOrderAcceptancesQuery('')
    const { data: users = [] } = useGetUserSummariesQuery()

    // Get unique users who have accepted/approved products
    const acceptors = useMemo(() => {
        const uniqueIds = [...new Set(allAcceptances.map((a: any) => a.acceptedById).filter(Boolean))]
        return users.filter((u) => uniqueIds.includes(u.id))
    }, [allAcceptances, users])

    const approvers = useMemo(() => {
        const uniqueIds = [...new Set(allAcceptances.map((a: any) => a.approvedById).filter(Boolean))]
        return users.filter((u) => uniqueIds.includes(u.id))
    }, [allAcceptances, users])

    // Filter acceptances
    const acceptances = useMemo(() => {
        return allAcceptances.filter((acceptance: any) => {
            // Status filter
            if (statusFilter !== 'ALL') {
                if (statusFilter === 'PENDING' && acceptance.status !== 'PENDING') return false
                if (statusFilter === 'APPROVED' && acceptance.status !== 'APPROVED') return false
                if (statusFilter === 'REJECTED' && acceptance.status !== 'REJECTED') return false
            }

            // Accepted by filter
            if (acceptedByFilter !== 'ALL') {
                if (acceptance.acceptedById !== acceptedByFilter) return false
            }

            // Approved by filter
            if (approvedByFilter !== 'ALL') {
                if (acceptance.approvedById !== approvedByFilter) return false
            }

            // Brand filter
            if (brandFilter !== 'ALL') {
                if (brandFilter === 'MARKASIZ') {
                    if (acceptance.brand && acceptance.brand !== '') return false
                } else {
                    if (acceptance.brand !== brandFilter) return false
                }
            }

            // Search
            if (searchQuery.trim()) {
                const query = searchQuery.toLocaleLowerCase('tr-TR')
                const matchesProduct = acceptance.productName?.toLocaleLowerCase('tr-TR').includes(query) ||
                    acceptance.productCode?.toLocaleLowerCase('tr-TR').includes(query)
                const matchesOrder = acceptance.orderNumber?.toLocaleLowerCase('tr-TR').includes(query)

                if (!matchesProduct && !matchesOrder) return false
            }

            return true
        })
    }, [allAcceptances, statusFilter, acceptedByFilter, approvedByFilter, brandFilter, searchQuery])

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
                        onChange: setStatusFilter,
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
                        onChange: setAcceptedByFilter,
                        type: 'dropdown',
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            ...acceptors.map((u: any) => ({ key: u.id, label: u.displayName || `${u.firstName} ${u.lastName}` }))
                        ]
                    },
                    {
                        label: 'Onaylayan',
                        value: approvedByFilter,
                        onChange: setApprovedByFilter,
                        type: 'dropdown',
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            ...approvers.map((u: any) => ({ key: u.id, label: u.displayName || `${u.firstName} ${u.lastName}` }))
                        ]
                    },
                    {
                        label: 'Marka',
                        value: brandFilter,
                        onChange: setBrandFilter,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'OAK', label: 'Doğtaş', activeColor: 'bg-red-600' },
                            { key: 'MAPLE', label: 'Maple', activeColor: 'bg-blue-600' },
                            { key: 'PINE', label: 'Pine', activeColor: 'bg-purple-600' },
                            { key: 'MARKASIZ', label: 'Markasız', activeColor: 'bg-gray-600' }
                        ]
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
                                {allAcceptances.filter((a: any) => a.status === 'PENDING').length}
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
                                {allAcceptances.filter((a: any) => {
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
                                {allAcceptances.length}
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
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-amber-700">Yükleniyor...</td>
                                </tr>
                            ) : acceptances.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-amber-700">
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
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${acceptance.brand === 'OAK' ? 'bg-red-50 text-red-700 border-red-100' :
                                                acceptance.brand === 'MAPLE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    acceptance.brand === 'PINE' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                        'bg-gray-50 text-gray-700 border-gray-100'
                                                }`}>
                                                {acceptance.brand === 'OAK' ? 'Doğtaş' :
                                                    acceptance.brand === 'MAPLE' ? 'Maple' :
                                                        acceptance.brand === 'PINE' ? 'Pine' : 'Markasız'}
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
        </div>
    )
}
