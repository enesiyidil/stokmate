import { useState, useEffect } from 'react'
import { CheckSquare, Package, Calendar, Truck, User } from 'lucide-react'
import { useGetOrderAcceptancesQuery } from '../../services/productAcceptanceApi'
import { useTopbar } from '../../context/TopbarContext'
import ProductAcceptanceModal from '../../components/orders/ProductAcceptanceModal'

export default function ProductAcceptancePage() {
    const [showAcceptanceModal, setShowAcceptanceModal] = useState(false)
    const { setTopbarContent } = useTopbar()

    // Get all acceptances (you can add filters later)
    const { data: acceptances = [] } = useGetOrderAcceptancesQuery('') // Empty for now, will need proper implementation

    useEffect(() => {
        setTopbarContent({
            title: 'Ürün Kabuller',
            description: 'Sipariş ürünlerini kabul edin ve kayıt altına alın',
            icon: <Package className="w-6 h-6" />,
            actions: (
                <button
                    onClick={() => setShowAcceptanceModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
                >
                    <CheckSquare className="w-5 h-5" />
                    Ürün Kabul Et
                </button>
            )
        })
    }, [setTopbarContent])

    return (
        <div className="p-6 space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <Package className="w-6 h-6 text-blue-300" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-700">Bekleyen Ürünler</p>
                            <p className="text-2xl font-bold text-amber-900">-</p>
                        </div>
                    </div>
                </div>

                <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                            <CheckSquare className="w-6 h-6 text-green-300" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-700">Bugün Kabul Edilen</p>
                            <p className="text-2xl font-bold text-amber-900">-</p>
                        </div>
                    </div>
                </div>

                <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                            <Calendar className="w-6 h-6 text-purple-300" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-700">Bu Ay Toplam</p>
                            <p className="text-2xl font-bold text-amber-900">-</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Acceptances */}
            <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-amber-200">
                    <h2 className="text-xl font-bold text-amber-900">Son Kabul Edilen Ürünler</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-amber-200">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-700">Tarih</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-700">Sipariş No</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-700">Ürün</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-700">Miktar</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-700">Araç Plaka</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-700">Şoför</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-700">Kabul Eden</th>
                            </tr>
                        </thead>
                        <tbody>
                            {acceptances.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-amber-700">
                                        <Package className="w-12 h-12 text-purple-300 mx-auto mb-2" />
                                        <p>Henüz kabul edilmiş ürün yok</p>
                                        <button
                                            onClick={() => setShowAcceptanceModal(true)}
                                            className="mt-4 px-4 py-2 bg-green-500 text-amber-900 rounded-lg hover:bg-green-600"
                                        >
                                            İlk Ürünü Kabul Et
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                acceptances.map((acceptance) => (
                                    <tr key={acceptance.id} className="border-b border-amber-100 hover:bg-amber-50">
                                        <td className="px-6 py-4 text-amber-700">
                                            {new Date(acceptance.acceptanceDate).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm border border-blue-300">
                                                {acceptance.orderNumber}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-amber-900 font-medium">{acceptance.productName}</p>
                                            <p className="text-xs text-amber-700">{acceptance.productCode}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-green-400 font-semibold">{acceptance.acceptedQuantity}</span>
                                        </td>
                                        <td className="px-6 py-4 text-amber-700">
                                            <div className="flex items-center gap-2">
                                                <Truck className="w-4 h-4" />
                                                {acceptance.vehiclePlate}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-amber-700">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                {acceptance.driverInfo}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-amber-700">
                                            {acceptance.acceptedByName}
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
                        // Refetch acceptances here
                    }}
                />
            )}
        </div>
    )
}
