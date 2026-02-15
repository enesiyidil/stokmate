import { Package, Truck, CheckCircle, Clock, Calendar, List, Eye } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListReadyShipmentsQuery, useListPendingShipmentsQuery, useListAwaitingPlanningShipmentsQuery, useGetCompletedAwaitingApprovalQuery, useGetApprovedShipmentsQuery, useFinalizeShipmentMutation, useApproveInitialShipmentMutation, useCompleteShipmentMutation, usePlanShipmentMutation } from '../../services/shipmentApi'
import { useTopbar } from '../../context/TopbarContext'
import CompleteShipmentModal from '../../components/shipment/CompleteShipmentModal'
import PlanShipmentModal from '../../components/shipment/PlanShipmentModal'
import OtpVerificationModal from '../../components/common/OtpVerificationModal'
import FilterSearchBar from '../../components/common/FilterSearchBar'
import ConfirmModal from '../../components/common/ConfirmModal'
import BrandBadge from '../../components/common/BrandBadge'
import { useAppSelector } from '../../hooks/useAuth'
import { useToast } from '../../context/ToastContext'
import type { Brand } from '../../constants/brandConstants'

type TabKey = 'all' | 'pending' | 'awaiting' | 'ready' | 'completed'

const ShipmentOperationsPage: React.FC = () => {
    const { setTopbarContent } = useTopbar()
    const navigate = useNavigate()
    const { user } = useAppSelector((state) => state.auth)
    const [activeTab, setActiveTab] = useState<TabKey>('all')

    // Permissions
    const canPlan = ['ADMIN', 'MANAGER', 'DIRECTOR', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER'].includes(user?.role || '')
    const canComplete = ['ADMIN', 'MANAGER', 'DIRECTOR', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER'].includes(user?.role || '')
    const canApprove = ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user?.role || '')
    const canFinalize = ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user?.role || '')

    // Modal states
    const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null)
    const [showPlanModal, setShowPlanModal] = useState(false)
    const [showCompleteModal, setShowCompleteModal] = useState(false)

    const [showOtpModal, setShowOtpModal] = useState(false)
    const [pendingOtpAction, setPendingOtpAction] = useState<(() => void) | null>(null)

    // Confirmation Modal State
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean
        type: 'APPROVE' | 'FINALIZE' | null
        shipmentId: string | null
    }>({ isOpen: false, type: null, shipmentId: null })

    const { success, error } = useToast()

    const verifyGate = (action: () => void) => {
        if (user?.totpEnabled) {
            setPendingOtpAction(() => action)
            setShowOtpModal(true)
        } else {
            action()
        }
    }

    // Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [deliveryFilter, setDeliveryFilter] = useState<'ALL' | 'PROBLEM_FREE' | 'PROBLEMATIC' | 'NOT_DELIVERED'>('ALL')
    const [brandFilter, setBrandFilter] = useState<'ALL' | 'OAK' | 'PINE' | 'MAPLE' | 'MARKASIZ'>('ALL')

    // Queries
    const { data: pendingShipments = [], isLoading: loadingPending, refetch: refetchPending } = useListPendingShipmentsQuery()
    const { data: awaitingShipments = [], isLoading: loadingAwaiting, refetch: refetchAwaiting } = useListAwaitingPlanningShipmentsQuery()
    const { data: readyShipments = [], isLoading: loadingReady } = useListReadyShipmentsQuery()
    const { data: completedShipments = [], isLoading: loadingCompleted, refetch: refetchCompleted } = useGetCompletedAwaitingApprovalQuery()
    const { data: finalizedShipments = [], isLoading: loadingFinalized, refetch: refetchFinalized } = useGetApprovedShipmentsQuery()

    // Mutations
    const [approveInitialMutation] = useApproveInitialShipmentMutation()
    const [finalizeShipmentMutation] = useFinalizeShipmentMutation()
    const [completeShipmentMutation, { isLoading: isCompletingShipment }] = useCompleteShipmentMutation()
    const [planShipmentMutation, { isLoading: isPlanningShipment }] = usePlanShipmentMutation()

    const dataMap = useMemo(() => {
        const pending = Array.isArray(pendingShipments) ? pendingShipments : []
        const awaiting = Array.isArray(awaitingShipments) ? awaitingShipments : []
        const ready = Array.isArray(readyShipments) ? readyShipments : []
        const completed = [...(Array.isArray(completedShipments) ? completedShipments : []), ...(Array.isArray(finalizedShipments) ? finalizedShipments : [])]

        // Sort function: oldest first by orderDate
        const sortOldestFirst = (a: any, b: any) => {
            const dateA = new Date(a.orderDate || a.createdAt || 0).getTime()
            const dateB = new Date(b.orderDate || b.createdAt || 0).getTime()
            return dateA - dateB
        }

        // Sort function: newest first by actualShipmentDate or completedAt
        const sortNewestFirst = (a: any, b: any) => {
            const dateA = new Date(a.actualShipmentDate || a.completedAt || a.orderDate || 0).getTime()
            const dateB = new Date(b.actualShipmentDate || b.completedAt || b.orderDate || 0).getTime()
            return dateB - dateA
        }

        // Incomplete shipments: sorted oldest first
        const incompleteShipments = [...pending, ...awaiting, ...ready].sort(sortOldestFirst)

        // Completed shipments: sorted newest first
        const completedSorted = [...completed].sort(sortNewestFirst)

        // All: incomplete first (oldest-newest), then completed (newest-oldest)
        const all = [...incompleteShipments, ...completedSorted]

        // Filter function for search and delivery status
        const filterShipments = (shipments: any[]) => {
            return shipments.filter((s: any) => {
                // Search filter
                if (searchQuery.trim()) {
                    const query = searchQuery.toLocaleLowerCase('tr-TR')
                    const matchesShipmentNo = s.shipmentNo?.toLocaleLowerCase('tr-TR').includes(query)
                    const matchesOrderNo = s.orderNo?.toLocaleLowerCase('tr-TR').includes(query)
                    const matchesSaleNo = s.saleNo?.toLocaleLowerCase('tr-TR').includes(query)
                    const matchesCustomer = s.customerName?.toLocaleLowerCase('tr-TR').includes(query)
                    const matchesProduct = s.products?.some((p: any) =>
                        p.name?.toLocaleLowerCase('tr-TR').includes(query) ||
                        p.code?.toLocaleLowerCase('tr-TR').includes(query)
                    )
                    if (!matchesShipmentNo && !matchesOrderNo && !matchesSaleNo && !matchesCustomer && !matchesProduct) return false
                }

                // Delivery filter (only applies to completed shipments)
                if (deliveryFilter !== 'ALL') {
                    if (deliveryFilter === 'NOT_DELIVERED') {
                        if (s.status === 'COMPLETED' || s.status === 'FINALIZED') return false
                    } else if (deliveryFilter === 'PROBLEM_FREE') {
                        if (s.deliveryStatus !== 'PROBLEM_FREE') return false
                    } else if (deliveryFilter === 'PROBLEMATIC') {
                        if (s.deliveryStatus !== 'PROBLEMATIC') return false
                    }
                }

                // Brand filter
                if (brandFilter !== 'ALL') {
                    if (brandFilter === 'MARKASIZ') {
                        if (s.brand && s.brand !== '') return false
                    } else {
                        if (s.brand !== brandFilter) return false
                    }
                }

                return true
            })
        }

        return {
            all: filterShipments(all),
            pending: filterShipments([...pending].sort(sortOldestFirst)),
            awaiting: filterShipments([...awaiting].sort(sortOldestFirst)),
            ready: filterShipments([...ready].sort(sortOldestFirst)),
            completed: filterShipments(completedSorted)
        }
    }, [pendingShipments, awaitingShipments, readyShipments, completedShipments, finalizedShipments, searchQuery, deliveryFilter, brandFilter])

    const activeData = dataMap[activeTab]

    const loading = activeTab === 'all' ? (loadingPending || loadingAwaiting || loadingReady || loadingCompleted || loadingFinalized)
        : activeTab === 'pending' ? loadingPending
            : activeTab === 'awaiting' ? loadingAwaiting
                : activeTab === 'ready' ? loadingReady
                    : (loadingCompleted || loadingFinalized)

    // First approval: PENDING -> APPROVED
    const handleApproveClick = (shipmentId: string) => {
        setConfirmModalState({ isOpen: true, type: 'APPROVE', shipmentId })
    }

    // Final approval: COMPLETED -> FINALIZED
    const handleFinalizeClick = (shipmentId: string) => {
        setConfirmModalState({ isOpen: true, type: 'FINALIZE', shipmentId })
    }

    const handleConfirmAction = async () => {
        const { type, shipmentId } = confirmModalState
        if (!shipmentId || !type) return

        verifyGate(async () => {
            try {
                if (type === 'APPROVE') {
                    await approveInitialMutation(shipmentId).unwrap()
                    success('Sevkiyat başarıyla onaylandı')
                    refetchPending()
                    refetchAwaiting()
                } else if (type === 'FINALIZE') {
                    await finalizeShipmentMutation(shipmentId).unwrap()
                    success('Sevkiyat final onayı verildi')
                    refetchCompleted()
                    refetchFinalized()
                }
                setConfirmModalState({ isOpen: false, type: null, shipmentId: null })
            } catch (err: any) {
                error('Hata: ' + (err.data?.message || 'İşlem başarısız'))
            }
        })
    }

    // Plan shipment handler
    const handlePlanShipment = async (data: { plannedDate: string; vehicleId: string; driverId?: string }) => {
        if (!selectedShipmentId) return
        verifyGate(async () => {
            try {
                await planShipmentMutation({
                    orderId: selectedShipmentId,
                    data: {
                        plannedDate: data.plannedDate,
                        vehicleId: data.vehicleId,
                        driverId: data.driverId
                    }
                }).unwrap()
                setSelectedShipmentId(null)
                refetchAwaiting()
                success('Sevkiyat başarıyla planlandı')
            } catch (err: any) {
                error('Hata: ' + (err.data?.message || 'Planlama başarısız'))
            }
        })
    }

    // Complete shipment handler
    const handleCompleteShipment = async (data: {
        deliveryStatus: 'PROBLEM_FREE' | 'PROBLEMATIC'
        problemType?: 'FACTORY_DEFECT' | 'TRANSPORT_ASSEMBLY_DEFECT'
        notes?: string
        deliveryPhotos: File[]
        signedDocument: File | null
    }) => {
        if (!selectedShipmentId) return
        try {
            const formData = new FormData()
            formData.append('shipmentId', selectedShipmentId)
            formData.append('deliveryStatus', data.deliveryStatus)
            if (data.problemType) formData.append('problemType', data.problemType)
            if (data.notes) formData.append('notes', data.notes)
            data.deliveryPhotos.forEach(photo => formData.append('deliveryPhotos', photo))
            if (data.signedDocument) formData.append('signedDocument', data.signedDocument)

            if (data.signedDocument) formData.append('signedDocument', data.signedDocument)

            verifyGate(async () => {
                try {
                    await completeShipmentMutation(formData).unwrap()
                    setShowCompleteModal(false)
                    setSelectedShipmentId(null)
                    refetchCompleted()
                    success('Sevkiyat başarıyla tamamlandı')
                } catch (err: any) {
                    error('Hata: ' + (err.data?.message || 'Tamamlama başarısız'))
                }
            })
        } catch (err: any) {
            error('Hata: ' + (err.data?.message || 'İşlem hatası'))
        }
    }

    useEffect(() => {
        setTopbarContent({
            title: 'Sevkiyat İşlemleri',
            description: 'Sevkiyat süreçlerini yönetin ve takip edin',
            icon: <Truck className="w-8 h-8" />,
        })
        return () => setTopbarContent(null)
    }, [setTopbarContent])

    // Mobile list render
    const renderMobileList = (data: any[]) => (
        <div className="md:hidden space-y-4 p-4">
            {data.map((shipment: any) => (
                <div key={shipment.id} className="bg-white border border-amber-100 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
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
                        <span className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${shipment.status === 'FINALIZED'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : shipment.status === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : shipment.status === 'APPROVED' || shipment.status === 'PLANNED'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                    : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}>
                            {shipment.status === 'FINALIZED' ? 'Onaylandı'
                                : shipment.status === 'COMPLETED' ? 'Onay Bekliyor'
                                    : shipment.status === 'APPROVED' ? 'Planlanıyor'
                                        : shipment.status === 'PLANNED' ? 'Sevke Hazır'
                                            : shipment.status === 'PENDING' ? 'Onay Bekliyor'
                                                : shipment.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex flex-col">
                            <span className="text-xs text-amber-500">Müşteri</span>
                            <span className="text-amber-900 font-medium">{shipment.customerName || '-'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-amber-500">Tarih</span>
                            <span className="text-amber-900 font-medium">{shipment.orderDate ? new Date(shipment.orderDate).toLocaleDateString('tr-TR') : '-'}</span>
                        </div>
                        {shipment.brand && (
                            <div className="flex flex-col">
                                <span className="text-xs text-amber-500">Marka</span>
                                <BrandBadge brand={shipment.brand as Brand} />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-50 mt-2">
                        {/* Onayla button - for PENDING status */}
                        {shipment.status === 'PENDING' && canApprove && (
                            <button
                                onClick={() => handleApproveClick(shipment.id)}
                                title="Onayla"
                                className="flex-1 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">Onayla</span>
                            </button>
                        )}
                        {/* Planla button - for APPROVED status */}
                        {shipment.status === 'APPROVED' && canPlan && (
                            <button
                                onClick={() => {
                                    setSelectedShipmentId(shipment.id)
                                    setShowPlanModal(true)
                                }}
                                title="Planla"
                                className="flex-1 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-medium">Planla</span>
                            </button>
                        )}
                        {/* Tamamla button - for PLANNED status */}
                        {shipment.status === 'PLANNED' && canComplete && (
                            <button
                                onClick={() => {
                                    setSelectedShipmentId(shipment.id)
                                    setShowCompleteModal(true)
                                }}
                                title="Tamamla"
                                className="flex-1 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <Truck className="w-4 h-4" />
                                <span className="text-xs font-medium">Tamamla</span>
                            </button>
                        )}
                        {/* Final Onayla button - for COMPLETED status */}
                        {shipment.status === 'COMPLETED' && canFinalize && (
                            <button
                                onClick={() => handleFinalizeClick(shipment.id)}
                                title="Onayla"
                                className="flex-1 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-medium">Son Onay</span>
                            </button>
                        )}
                        {/* Detay button - always visible */}
                        <button
                            onClick={() => navigate(`/shipment/${shipment.id}?type=SHIPMENT`)}
                            title="Detay"
                            className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all shadow-sm"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )

    // Render table
    const renderTable = (data: any[]) => (
        <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-amber-200/50 bg-amber-50/50">
                        <th className="text-left py-4 px-6 text-sm font-semibold text-amber-900 w-64">Sevk / Kaynak</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-amber-900">Müşteri</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-amber-900 w-24">Marka</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-amber-900 w-32">Tarihler</th>
                        {(activeTab === 'completed' || activeTab === 'all') && <th className="text-left py-4 px-6 text-sm font-semibold text-amber-900 w-36">Durum</th>}
                        <th className="text-right py-4 px-6 text-sm font-semibold text-amber-900 w-40">İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((shipment: any) => (
                        <tr key={shipment.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                            <td className="py-4 px-6">
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
                            <td className="py-4 px-6">
                                <span className="text-amber-900 font-medium">{shipment.customerName || '-'}</span>
                            </td>
                            <td className="py-4 px-6">
                                {shipment.brand ? (
                                    <BrandBadge brand={shipment.brand as Brand} />
                                ) : (
                                    <span className="text-amber-400">-</span>
                                )}
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex flex-col gap-1 text-xs text-amber-700">
                                    <div className="flex justify-between">
                                        <span className="text-amber-500">Sipariş:</span>
                                        <span>{shipment.orderDate ? new Date(shipment.orderDate).toLocaleDateString('tr-TR') : '-'}</span>
                                    </div>
                                    {shipment.plannedShipmentDate && (
                                        <div className="flex justify-between font-medium text-amber-900">
                                            <span>Plan:</span>
                                            <span>{new Date(shipment.plannedShipmentDate).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    )}
                                    {shipment.actualShipmentDate && (
                                        <div className="flex justify-between text-green-700 font-medium">
                                            <span>Sevk:</span>
                                            <span>{new Date(shipment.actualShipmentDate).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    )}
                                </div>
                            </td>
                            {(activeTab === 'completed' || activeTab === 'all') && (
                                <td className="py-4 px-6">
                                    <span className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${shipment.status === 'FINALIZED'
                                        ? 'bg-green-100 text-green-800 border-green-200'
                                        : shipment.status === 'COMPLETED'
                                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                                            : shipment.status === 'APPROVED' || shipment.status === 'PLANNED'
                                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                : 'bg-amber-100 text-amber-800 border-amber-200'
                                        }`}>
                                        {shipment.status === 'FINALIZED' ? 'Onaylandı'
                                            : shipment.status === 'COMPLETED' ? 'Onay Bekliyor'
                                                : shipment.status === 'APPROVED' ? 'Planlanıyor'
                                                    : shipment.status === 'PLANNED' ? 'Sevke Hazır'
                                                        : shipment.status === 'PENDING' ? 'Onay Bekliyor'
                                                            : shipment.status}
                                    </span>
                                </td>
                            )}
                            <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {/* Onayla button - for PENDING status */}
                                    {shipment.status === 'PENDING' && canApprove && (
                                        <button
                                            onClick={() => handleApproveClick(shipment.id)}
                                            title="Onayla"
                                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-sm"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                    {/* Planla button - for APPROVED status */}
                                    {shipment.status === 'APPROVED' && canPlan && (
                                        <button
                                            onClick={() => {
                                                setSelectedShipmentId(shipment.id)
                                                setShowPlanModal(true)
                                            }}
                                            title="Planla"
                                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all shadow-sm"
                                        >
                                            <Calendar className="w-4 h-4" />
                                        </button>
                                    )}
                                    {/* Tamamla button - for PLANNED status */}
                                    {shipment.status === 'PLANNED' && canComplete && (
                                        <button
                                            onClick={() => {
                                                setSelectedShipmentId(shipment.id)
                                                setShowCompleteModal(true)
                                            }}
                                            title="Tamamla"
                                            className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all shadow-sm"
                                        >
                                            <Truck className="w-4 h-4" />
                                        </button>
                                    )}
                                    {/* Final Onayla button - for COMPLETED status */}
                                    {shipment.status === 'COMPLETED' && canFinalize && (
                                        <button
                                            onClick={() => handleFinalizeClick(shipment.id)}
                                            title="Onayla"
                                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-sm"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                    {/* Detay button - always visible */}
                                    <button
                                        onClick={() => navigate(`/shipment/${shipment.id}?type=SHIPMENT`)}
                                        title="Detay"
                                        className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all shadow-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

    return (
        <div className="p-6 space-y-6">
            {/* Filter and Search Bar */}
            <FilterSearchBar
                filters={[
                    {
                        label: 'Aşama',
                        value: activeTab,
                        onChange: (val) => setActiveTab(val as TabKey),
                        options: [
                            { key: 'all', label: 'Tümü' },
                            { key: 'pending', label: 'Onay Bekleyenler', activeColor: 'bg-amber-600' },
                            { key: 'awaiting', label: 'Planlama', activeColor: 'bg-orange-600' },
                            { key: 'ready', label: 'Sevke Hazır', activeColor: 'bg-green-600' },
                            { key: 'completed', label: 'Tamamlananlar', activeColor: 'bg-purple-600' }
                        ]
                    },
                    {
                        label: 'Teslimat',
                        value: deliveryFilter,
                        onChange: setDeliveryFilter,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'PROBLEM_FREE', label: 'Sorunsuz', activeColor: 'bg-green-600' },
                            { key: 'PROBLEMATIC', label: 'Sorunlu', activeColor: 'bg-red-600' },
                            { key: 'NOT_DELIVERED', label: 'Teslim Edilmedi', activeColor: 'bg-gray-600' }
                        ]
                    },
                    {
                        label: 'Marka',
                        value: brandFilter,
                        onChange: (val) => setBrandFilter(val as 'ALL' | 'OAK' | 'PINE' | 'MAPLE' | 'MARKASIZ'),
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'OAK', label: 'Doğtaş', activeColor: 'bg-red-600' },
                            { key: 'MAPLE', label: 'Maple', activeColor: 'bg-blue-600' },
                            { key: 'PINE', label: 'Pine', activeColor: 'bg-purple-600' },
                            { key: 'MARKASIZ', label: 'Markasız', activeColor: 'bg-gray-600' }
                        ]
                    }
                ]}
                searchPlaceholder="Sevk no, sipariş/satış no, müşteri adı, ürün adı veya kodu..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Content */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-amber-200/50">
                    <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-amber-600" />
                        {activeTab === 'all' ? 'Tüm Sevkiyatlar' :
                            activeTab === 'pending' ? 'Onay Bekleyen Sevkiyatlar' :
                                activeTab === 'awaiting' ? 'Planlanmayı Bekleyenler' :
                                    activeTab === 'ready' ? 'Sevke Hazır Olanlar' : 'Tamamlanan Sevkiyatlar'}
                        <span className="ml-2 text-sm font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            {activeData.length} Kayıt
                        </span>
                    </h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                    </div>
                ) : activeData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-amber-300" />
                        </div>
                        <p className="text-amber-800 font-medium text-lg">Bu kategoride sevkiyat bulunmuyor</p>
                    </div>
                ) : (
                    <>
                        {renderTable(activeData)}
                        {renderMobileList(activeData)}
                    </>
                )}
            </div>

            {/* Plan Shipment Modal */}
            <PlanShipmentModal
                isOpen={showPlanModal}
                onClose={() => {
                    setShowPlanModal(false)
                    setSelectedShipmentId(null)
                }}
                onPlan={handlePlanShipment}
                isLoading={isPlanningShipment}
            />

            {/* Complete Shipment Modal */}
            <CompleteShipmentModal
                isOpen={showCompleteModal}
                onClose={() => {
                    setShowCompleteModal(false)
                    setSelectedShipmentId(null)
                }}
                onComplete={handleCompleteShipment}
                isLoading={isCompletingShipment}
            />

            <OtpVerificationModal
                isOpen={showOtpModal}
                onClose={() => {
                    setShowOtpModal(false)
                    setPendingOtpAction(null)
                }}
                onVerify={() => {
                    setShowOtpModal(false)
                    if (pendingOtpAction) {
                        pendingOtpAction()
                        setPendingOtpAction(null)
                    }
                }}
            />

            <ConfirmModal
                isOpen={confirmModalState.isOpen}
                onClose={() => setConfirmModalState({ ...confirmModalState, isOpen: false })}
                onCancel={() => setConfirmModalState({ ...confirmModalState, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={confirmModalState.type === 'APPROVE' ? 'Sevkiyat Onayı' : 'Final Onayı'}
                message={confirmModalState.type === 'APPROVE'
                    ? 'Bu sevkiyatı onaylamak istediğinizden emin misiniz? İşlem geri alınamaz.'
                    : 'Bu sevkiyatı tamamen onaylayıp kapatmak istediğinizden emin misiniz? Stoklar kalıcı olarak düşülecektir.'
                }
                confirmText="Onayla"
                cancelText="İptal"
                type="success"
            />
        </div>
    )
}

export default ShipmentOperationsPage

