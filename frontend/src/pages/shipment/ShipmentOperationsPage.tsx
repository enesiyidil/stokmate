import { Package, Truck, CheckCircle, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useListReadyShipmentsQuery, useGetCompletedAwaitingApprovalQuery, useGetApprovedShipmentsQuery } from '../../services/shipmentApi'
import { useListOrdersQuery } from '../../services/orderApi'
import { useTopbar } from '../../context/TopbarContext'

const ShipmentOperationsPage: React.FC = () => {
    const { setTopbarContent } = useTopbar()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'pending' | 'ready' | 'completed'>('pending')
    const { data: pendingOrders = [], isLoading: loadingPending } = useListOrdersQuery({ status: 'PENDING_SHIPMENT_APPROVAL' })
    const { data: readyShipments = [], isLoading: loadingReady } = useListReadyShipmentsQuery()
    const { data: completedShipments = [], isLoading: loadingCompleted } = useGetCompletedAwaitingApprovalQuery()
    const { data: approvedShipments = [], isLoading: loadingApproved } = useGetApprovedShipmentsQuery()

    const pendingApprovals = Array.isArray(pendingOrders) ? pendingOrders : []
    const shipments = Array.isArray(readyShipments) ? readyShipments : []
    const completed = [...(Array.isArray(completedShipments) ? completedShipments : []), ...(Array.isArray(approvedShipments) ? approvedShipments : [])]
    const loading = activeTab === 'pending' ? loadingPending : activeTab === 'ready' ? loadingReady : (loadingCompleted || loadingApproved)

    useEffect(() => {
        const getStatusInfo = () => {
            if (activeTab === 'pending') {
                return `${pendingApprovals.length} sipariş onay bekliyor`
            } else if (activeTab === 'ready') {
                return `${shipments.length} sipariş sevke hazır`
            } else {
                return `${completed.length} sevkiyat tamamlandı`
            }
        }

        setTopbarContent({
            title: 'Sevkiyat İşlemleri',
            description: getStatusInfo(),
            icon: <Truck className="w-8 h-8" />
        })
    }, [setTopbarContent, activeTab, pendingApprovals.length, shipments.length, completed.length])

    return (
        <div className="p-6 min-h-screen">
            {/* Tab Bar */}
            <div className="mb-6 flex items-center gap-3 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-amber-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md ${activeTab === 'pending'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xl border-2 border-orange-400'
                        : 'bg-white border-2 border-amber-400 text-amber-900 hover:bg-amber-50'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Onay Bekleyenler ({pendingApprovals.length})
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('ready')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md ${activeTab === 'ready'
                        ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-xl border-2 border-green-500'
                        : 'bg-white border-2 border-amber-400 text-amber-900 hover:bg-amber-50'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Sevke Hazır ({shipments.length})
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md ${activeTab === 'completed'
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-xl border-2 border-green-700'
                        : 'bg-white border-2 border-amber-400 text-amber-900 hover:bg-amber-50'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Tamamlananlar ({completed.length})
                    </div>
                </button>
            </div>

            {/* Content */}
            {activeTab === 'pending' ? (
                <div className="bg-white/75 backdrop-blur-md border border-amber-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 bg-amber-50 border-b border-amber-200">
                        <div className="flex items-center gap-3">
                            <Clock className="w-6 h-6 text-amber-600" />
                            <h2 className="text-xl font-semibold text-amber-900">Sevk Onayı Bekleyen Siparişler</h2>
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                            <p className="text-amber-600 mt-4">Yükleniyor...</p>
                        </div>
                    ) : pendingApprovals.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-block p-4 bg-white/5 rounded-full mb-4">
                                <Clock className="w-12 h-12 text-gray-400" />
                            </div>
                            <p className="text-amber-600 text-lg">Onay bekleyen sevkiyat yok</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-amber-100">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700">Sipariş No</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700">Müşteri</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700">Sipariş Tarihi</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-amber-700">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingApprovals.map((order: any) => (
                                            <tr key={order.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className="text-amber-900 font-medium">{order.orderNo}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-amber-900">{order.customerName}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-amber-700">
                                                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString('tr-TR') : '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/orders/${order.id || order.orderId}`)}
                                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all"
                                                    >
                                                        Detaya Git
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : activeTab === 'ready' ? (
                <div className="bg-white/75 backdrop-blur-md border border-amber-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 bg-green-50 border-b border-green-200">
                        <div className="flex items-center gap-3">
                            <Truck className="w-6 h-6 text-green-600" />
                            <h2 className="text-xl font-semibold text-amber-900">Sevke Hazır Siparişler</h2>
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                            <p className="text-amber-600 mt-4">Yükleniyor...</p>
                        </div>
                    ) : shipments.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-block p-4 bg-white/5 rounded-full mb-4">
                                <Package className="w-12 h-12 text-gray-400" />
                            </div>
                            <p className="text-amber-600 text-lg">Sevke hazır sipariş yok</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-amber-100">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700">Sipariş No</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700">Müşteri</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700">Sipariş Tarihi</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-amber-700">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shipments.map((order: any) => (
                                            <tr key={order.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className="text-amber-900 font-medium">{order.orderNo}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-amber-900">
                                                        {order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : (order.customerName || '-')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-amber-700">
                                                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString('tr-TR') : '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/shipment/${order.id || order.orderId}`)}
                                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all"
                                                    >
                                                        Detaya Git
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white/75 backdrop-blur-md border border-amber-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 bg-purple-50 border-b border-purple-200">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-purple-600" />
                            <h2 className="text-xl font-semibold text-amber-900">Tamamlanmış ve Onaylanmış Sevkiyatlar</h2>
                        </div>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                            <p className="text-amber-600 mt-4">Yükleniyor...</p>
                        </div>
                    ) : completed.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="inline-block p-4 bg-white/5 rounded-full mb-4">
                                <CheckCircle className="w-12 h-12 text-gray-400" />
                            </div>
                            <p className="text-amber-600 text-lg">Tamamlanmış sevkiyat bulunmuyor</p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-amber-100">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700">Sipariş No</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700">Müşteri</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700">Planlanan Tarih</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-amber-700">Durum</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-amber-700">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {completed.map((shipment: any) => (
                                            <tr key={shipment.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className="text-amber-900 font-medium">{shipment.orderNo}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-amber-900">{shipment.customerName || '-'}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-amber-700">
                                                        {shipment.plannedShipmentDate ? new Date(shipment.plannedShipmentDate).toLocaleDateString('tr-TR') : '-'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 shadow-md ${shipment.status === 'APPROVED'
                                                        ? 'bg-green-400 text-green-900 border-green-600'
                                                        : 'bg-blue-400 text-blue-900 border-blue-600'
                                                        }`}>
                                                        {shipment.status === 'APPROVED' ? 'Onaylandı' : 'Tamamlandı'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/shipment/${shipment.id || shipment.orderId}?type=SHIPMENT`)}
                                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all"
                                                    >
                                                        Detaya Git
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default ShipmentOperationsPage
