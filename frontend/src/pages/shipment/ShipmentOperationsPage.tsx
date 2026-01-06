import { Package, Truck, CheckCircle, Clock, Calendar } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListReadyShipmentsQuery, useListPendingShipmentsQuery, useListAwaitingPlanningShipmentsQuery, useGetCompletedAwaitingApprovalQuery, useGetApprovedShipmentsQuery, useFinalizeShipmentMutation, useApproveInitialShipmentMutation } from '../../services/shipmentApi'
import { useTopbar } from '../../context/TopbarContext'

type TabKey = 'pending' | 'awaiting' | 'ready' | 'completed'

const TABS = [
    {
        key: 'pending',
        label: 'Onay Bekleyenler',
        icon: Clock,
        activeClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl border-amber-600',
        inactiveClass: 'bg-white border-amber-400 text-amber-900 hover:bg-amber-50',
        contentBg: 'bg-amber-50',
        iconColor: 'text-amber-600'
    },
    {
        key: 'awaiting',
        label: 'Planlanmayı Bekleyen',
        icon: Calendar,
        activeClass: 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl border-orange-600',
        inactiveClass: 'bg-white border-orange-400 text-orange-900 hover:bg-orange-50',
        contentBg: 'bg-orange-50',
        iconColor: 'text-orange-600'
    },
    {
        key: 'ready',
        label: 'Sevke Hazır',
        icon: Package,
        activeClass: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl border-green-600',
        inactiveClass: 'bg-white border-green-400 text-green-900 hover:bg-green-50',
        contentBg: 'bg-green-50',
        iconColor: 'text-green-600'
    },
    {
        key: 'completed',
        label: 'Tamamlananlar',
        icon: CheckCircle,
        activeClass: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-xl border-purple-600',
        inactiveClass: 'bg-white border-purple-400 text-purple-900 hover:bg-purple-50',
        contentBg: 'bg-purple-50',
        iconColor: 'text-purple-600'
    },
] as const

const ShipmentOperationsPage: React.FC = () => {
    const { setTopbarContent } = useTopbar()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<TabKey>('pending')

    // Queries
    const { data: pendingShipments = [], isLoading: loadingPending, refetch: refetchPending } = useListPendingShipmentsQuery()
    const { data: awaitingShipments = [], isLoading: loadingAwaiting, refetch: refetchAwaiting } = useListAwaitingPlanningShipmentsQuery()
    const { data: readyShipments = [], isLoading: loadingReady } = useListReadyShipmentsQuery()
    const { data: completedShipments = [], isLoading: loadingCompleted, refetch: refetchCompleted } = useGetCompletedAwaitingApprovalQuery()
    const { data: finalizedShipments = [], isLoading: loadingFinalized, refetch: refetchFinalized } = useGetApprovedShipmentsQuery()

    // Mutations
    const [approveInitialMutation] = useApproveInitialShipmentMutation()
    const [finalizeShipmentMutation] = useFinalizeShipmentMutation()

    const dataMap = useMemo(() => ({
        pending: Array.isArray(pendingShipments) ? pendingShipments : [],
        awaiting: Array.isArray(awaitingShipments) ? awaitingShipments : [],
        ready: Array.isArray(readyShipments) ? readyShipments : [],
        completed: [...(Array.isArray(completedShipments) ? completedShipments : []), ...(Array.isArray(finalizedShipments) ? finalizedShipments : [])]
    }), [pendingShipments, awaitingShipments, readyShipments, completedShipments, finalizedShipments])

    const activeData = dataMap[activeTab]

    const loading = activeTab === 'pending' ? loadingPending
        : activeTab === 'awaiting' ? loadingAwaiting
            : activeTab === 'ready' ? loadingReady
                : (loadingCompleted || loadingFinalized)

    // First approval: PENDING -> APPROVED
    const handleApproveInitial = async (shipmentId: string) => {
        if (!confirm('Bu sevkiyatı onaylamak istediğinizden emin misiniz?')) return
        try {
            await approveInitialMutation(shipmentId).unwrap()
            alert('Sevkiyat başarıyla onaylandı!')
            refetchPending()
            refetchAwaiting()
        } catch (error: any) {
            alert('Hata: ' + (error.data?.message || 'Onaylama başarısız'))
        }
    }

    // Final approval: COMPLETED -> FINALIZED
    const handleFinalizeShipment = async (shipmentId: string) => {
        if (!confirm('Bu sevkiyatı onaylamak istediğinizden emin misiniz?')) return
        try {
            await finalizeShipmentMutation(shipmentId).unwrap()
            alert('Sevkiyat başarıyla onaylandı!')
            refetchCompleted()
            refetchFinalized()
        } catch (error: any) {
            alert('Hata: ' + (error.data?.message || 'Onaylama başarısız'))
        }
    }

    useEffect(() => {
        const activeTabConfig = TABS.find(t => t.key === activeTab)
        const count = dataMap[activeTab].length

        setTopbarContent({
            title: 'Sevkiyat İşlemleri',
            description: `${count} sevkiyat ${activeTabConfig?.label.toLowerCase()}`,
            icon: <Truck className="w-8 h-8" />
        })

        return () => setTopbarContent(null)
    }, [setTopbarContent, activeTab, dataMap])

    // Render table
    const renderTable = (data: any[]) => (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-amber-100">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700 w-64">Sevk / Kaynak</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700">Müşteri</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700 w-32">Tarih</th>
                        {activeTab === 'completed' && <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700 w-32">Durum</th>}
                        <th className="text-right py-3 px-4 text-sm font-semibold text-amber-700 w-40">İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((shipment: any) => (
                        <tr key={shipment.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                            <td className="py-3 px-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-mono text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200 w-fit">#{shipment.id?.substring(0, 8)}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${shipment.shipmentType === 'SALE'
                                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                                            : 'bg-blue-100 text-blue-700 border-blue-200'
                                            }`}>
                                            {shipment.shipmentType === 'SALE' ? 'SATIŞ' : 'SİPARİŞ'}
                                        </span>
                                        <span className="text-amber-900 font-medium text-sm">{shipment.orderNo || shipment.saleNo}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <span className="text-amber-900">{shipment.customerName || '-'}</span>
                            </td>
                            <td className="py-3 px-4">
                                <span className="text-amber-700">
                                    {shipment.plannedShipmentDate
                                        ? new Date(shipment.plannedShipmentDate).toLocaleDateString('tr-TR')
                                        : shipment.orderDate
                                            ? new Date(shipment.orderDate).toLocaleDateString('tr-TR')
                                            : '-'}
                                </span>
                            </td>
                            {activeTab === 'completed' && (
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${shipment.status === 'FINALIZED'
                                        ? 'bg-green-400 text-green-900 border-green-600'
                                        : 'bg-blue-400 text-blue-900 border-blue-600'
                                        }`}>
                                        {shipment.status === 'FINALIZED' ? 'Onaylandı' : 'Onay Bekliyor'}
                                    </span>
                                </td>
                            )}
                            <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {activeTab === 'pending' && (
                                        <button
                                            onClick={() => handleApproveInitial(shipment.id)}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                                        >
                                            Onayla
                                        </button>
                                    )}
                                    {activeTab === 'awaiting' && (
                                        <button
                                            onClick={() => navigate(`/shipment/${shipment.id}?type=SHIPMENT`)}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                                        >
                                            Planla
                                        </button>
                                    )}
                                    {activeTab === 'ready' && (
                                        <button
                                            onClick={() => navigate(`/shipment/${shipment.id}?type=SHIPMENT`)}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                                        >
                                            Tamamla
                                        </button>
                                    )}
                                    {activeTab === 'completed' && shipment.status === 'COMPLETED' && (
                                        <button
                                            onClick={() => handleFinalizeShipment(shipment.id)}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all"
                                        >
                                            Onayla
                                        </button>
                                    )}
                                    <button
                                        onClick={() => navigate(`/shipment/${shipment.id}?type=SHIPMENT`)}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all"
                                    >
                                        Detay
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

    const activeTabConfig = TABS.find(t => t.key === activeTab)!

    return (
        <div className="relative z-10">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 relative z-20">
                {TABS.map((tab) => {
                    const count = dataMap[tab.key].length
                    const Icon = tab.icon
                    const isActive = activeTab === tab.key

                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as TabKey)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md flex items-center gap-2 border-2 ${isActive ? tab.activeClass : tab.inactiveClass
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label} ({count})
                        </button>
                    )
                })}
            </div>

            {/* Content */}
            <div className="bg-white/90 backdrop-blur-md border border-amber-200 rounded-2xl shadow-xl overflow-hidden relative z-10">
                <div className={`p-6 border-b border-amber-200 ${activeTabConfig.contentBg}`}>
                    <div className="flex items-center gap-3">
                        <activeTabConfig.icon className={`w-6 h-6 ${activeTabConfig.iconColor}`} />
                        <h2 className="text-xl font-semibold text-amber-900">
                            {activeTabConfig.label}
                        </h2>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                    </div>
                ) : activeData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-amber-400" />
                        </div>
                        <p className="text-amber-600 text-lg">Bu kategoride sevkiyat bulunmuyor</p>
                    </div>
                ) : (
                    <div className="p-6">
                        {renderTable(activeData)}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ShipmentOperationsPage
