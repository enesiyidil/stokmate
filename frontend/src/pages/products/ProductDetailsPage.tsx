import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Tag, DollarSign, TrendingUp, Clock, User } from 'lucide-react'
import { useTopbar } from '../../context/TopbarContext'
import { useGetProductDetailsQuery } from '../../services/productApi'
import LinkedNotesWidget from '../../components/notes/LinkedNotesWidget'

// Type definitions (will move to productApi.ts)
interface ProductDetailsResponse {
    id: string
    name: string
    code: string
    description: string
    brand: string
    imageUrl: string
    activeForSale: boolean
    customerOwned: boolean
    stockQuantity: number
    vatRate: number
    arrivalPrice: number
    internetSalesPrice: number
    minStockLevel: number
    keywords: string[]
    createdAt: string
    updatedAt: string
    createdBy: string
    recentEvents: ProductEventResponse[]
    priceHistory: ProductPriceHistoryResponse[]
    cancelledStockQuantity?: number
    stockHistory?: ProductStockHistoryResponse[]
}

interface ProductStockHistoryResponse {
    id: string
    productCode: string
    oldQuantity: number
    newQuantity: number
    changeAmount: number
    reason: string
    type: 'REGULAR' | 'CANCELLED'
    userEmail: string
    createdAt: string
}

interface ProductEventResponse {
    id: string
    eventType: string
    quantityChange: number
    priceAtEvent: number
    description: string
    eventData: any
    createdByName: string
    createdAt: string
}

interface ProductPriceHistoryResponse {
    id: string
    grossPrice: number
    netPrice: number
    fixedDiscount: number
    cashDiscount: number
    displayDiscount: number
    discount1: number
    discount2: number
    discount3: number
    discount4: number
    discount5: number
    vat: number
    paymentCondition: string
    paymentConditionDefinition: string
    quantity: number
    relatedOrderNo: string
    createdByName: string
    createdAt: string
}

export default function ProductDetailsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { setTopbarContent } = useTopbar()

    // Use RTK Query instead of manual fetch
    const { data: product, isLoading, error } = useGetProductDetailsQuery(id!, {
        skip: !id
    })

    useEffect(() => {
        // Always set topbar content, even while loading
        setTopbarContent({
            title: product?.code || 'Ürün Detayı',
            description: 'Ürün Detayı',
            icon: <Package className="w-8 h-8" />,
            showFiltersInTopbar: true,
            actions: null,
            filters: (
                <button
                    onClick={() => navigate('/products')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Geri
                </button>
            )
        })

        return () => setTopbarContent(null)
    }, [product, setTopbarContent, navigate])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-white text-xl">Yükleniyor...</p>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="min-h-screen">
                <div className="p-6">
                    <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl p-8 text-center shadow-2xl">
                        <Package className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-amber-900 mb-2">Ürün Bulunamadı</h3>
                        <p className="text-amber-700 mb-6">İstediğiniz ürün bulunamadı.</p>
                        <button
                            onClick={() => navigate('/products')}
                            className="px-6 py-2 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-lg hover:from-amber-800 hover:to-orange-800 transition-all"
                        >
                            Ürünlere Dön
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <div className="p-6 space-y-6">
                {/* Product Info Card */}
                <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl p-6 shadow-lg">
                    <div className="flex gap-6">
                        {/* Product Image */}
                        {product.imageUrl && (
                            <div className="w-48 h-48 rounded-xl overflow-hidden bg-amber-50 border border-amber-200 flex-shrink-0">
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Product Details */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-amber-900 mb-1">{product.name}</h2>
                                    <p className="text-amber-700 flex items-center gap-2">
                                        <Tag className="w-4 h-4" />
                                        Ürün Kodu: <span className="font-mono font-semibold">{product.code}</span>
                                    </p>
                                </div>
                                <span className={`px-4 py-2 rounded-lg text-sm font-medium ${product.activeForSale
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                    }`}>
                                    {product.activeForSale ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>

                            {product.description && (
                                <p className="text-amber-700 mb-4">{product.description}</p>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-amber-50 rounded-lg p-3">
                                    <p className="text-xs text-amber-600 mb-1">Marka</p>
                                    <p className="font-semibold text-amber-900">{product.brand || '-'}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3">
                                    <p className="text-xs text-green-600 mb-1">Stok Miktarı</p>
                                    <p className="font-semibold text-green-900">{product.stockQuantity}</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <p className="text-xs text-blue-600 mb-1">KDV Oranı</p>
                                    <p className="font-semibold text-blue-900">%{(product.vatRate * 100).toFixed(0)}</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3">
                                    <p className="text-xs text-purple-600 mb-1">Geliş Fiyatı</p>
                                    <p className="font-semibold text-purple-900">{product.arrivalPrice.toFixed(2)} TL</p>
                                </div>
                                {product.cancelledStockQuantity !== undefined && product.cancelledStockQuantity > 0 && (
                                    <div className="bg-red-50 rounded-lg p-3">
                                        <p className="text-xs text-red-600 mb-1">İptal Stoğu</p>
                                        <p className="font-semibold text-red-900">{product.cancelledStockQuantity}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Linked Notes Widget */}
                <LinkedNotesWidget
                    entityType="PRODUCT"
                    entityId={product.id}
                />

                {/* Price History */}
                <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl overflow-hidden shadow-lg">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
                        <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Fiyat Geçmişi
                        </h3>
                    </div>
                    {product.priceHistory && product.priceHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                        <th className="text-left p-4 text-amber-900 font-semibold text-sm">Tarih</th>
                                        <th className="text-left p-4 text-amber-900 font-semibold text-sm">Miktar</th>
                                        <th className="text-right p-4 text-amber-900 font-semibold text-sm">Brüt</th>
                                        <th className="text-right p-4 text-amber-900 font-semibold text-sm">Net</th>
                                        <th className="text-right p-4 text-amber-900 font-semibold text-sm">KDV</th>
                                        <th className="text-left p-4 text-amber-900 font-semibold text-sm">Sipariş</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {product.priceHistory.map((price) => (
                                        <tr key={price.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                                            <td className="p-4 text-amber-700 text-sm">
                                                {new Date(price.createdAt).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="p-4 text-amber-900 font-medium">{price.quantity}</td>
                                            <td className="p-4 text-right text-amber-900">{price.grossPrice.toFixed(2)} TL</td>
                                            <td className="p-4 text-right text-green-700 font-medium">{price.netPrice.toFixed(2)} TL</td>
                                            <td className="p-4 text-right text-amber-700">%{(price.vat * 100).toFixed(0)}</td>
                                            <td className="p-4 text-amber-700 text-sm">{price.relatedOrderNo || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-amber-700">
                            <p>Bu ürün için fiyat geçmişi bulunmamaktadır.</p>
                        </div>
                    )}
                </div>

                {/* Stock History */}
                <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl overflow-hidden shadow-lg">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
                        <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Stok Geçmişi
                        </h3>
                    </div>
                    {product.stockHistory && product.stockHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                        <th className="text-left p-4 text-amber-900 font-semibold text-sm">Tarih</th>
                                        <th className="text-left p-4 text-amber-900 font-semibold text-sm">İşlem</th>
                                        <th className="text-left p-4 text-amber-900 font-semibold text-sm">Eski Miktar</th>
                                        <th className="text-left p-4 text-amber-900 font-semibold text-sm">Değişim</th>
                                        <th className="text-left p-4 text-amber-900 font-semibold text-sm">Yeni Miktar</th>
                                        <th className="text-left p-4 text-amber-900 font-semibold text-sm">Sebep</th>
                                        <th className="text-left p-4 text-amber-900 font-semibold text-sm">Kullanıcı</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {product.stockHistory.map((history) => (
                                        <tr key={history.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                                            <td className="p-4 text-amber-700 text-sm">
                                                {new Date(history.createdAt).toLocaleString('tr-TR')}
                                            </td>
                                            <td className="p-4 text-amber-900 font-medium">
                                                <span className={`px-2 py-1 rounded text-xs ${history.type === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                    history.type === 'REGULAR' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {history.type === 'CANCELLED' ? 'İptal' : 'Normal'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-amber-700">{history.oldQuantity}</td>
                                            <td className={`p-4 font-bold ${history.changeAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {history.changeAmount > 0 ? '+' : ''}{history.changeAmount}
                                            </td>
                                            <td className="p-4 text-amber-900 font-bold">{history.newQuantity}</td>
                                            <td className="p-4 text-amber-700 text-sm">{history.reason}</td>
                                            <td className="p-4 text-amber-700 text-sm">{history.userEmail}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-amber-700">
                            <p>Bu ürün için stok geçmişi bulunmamaktadır.</p>
                        </div>
                    )}
                </div>

                {/* Events Timeline */}
                <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl overflow-hidden shadow-lg">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
                        <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Son Olaylar
                        </h3>
                    </div>
                    {product.recentEvents && product.recentEvents.length > 0 ? (
                        <div className="p-6">
                            <div className="space-y-4">
                                {product.recentEvents.map((event, index) => (
                                    <div key={event.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            {index < product.recentEvents.length - 1 && (
                                                <div className="w-0.5 flex-1 bg-amber-200 mt-2"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-semibold text-amber-900">{event.eventType}</h4>
                                                    <span className="text-xs text-amber-600">
                                                        {new Date(event.createdAt).toLocaleString('tr-TR')}
                                                    </span>
                                                </div>
                                                {event.description && (
                                                    <p className="text-amber-700 text-sm mb-2">{event.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-sm">
                                                    {event.quantityChange !== null && event.quantityChange !== 0 && (
                                                        <span className={`flex items-center gap-1 ${event.quantityChange > 0 ? 'text-green-700' : 'text-red-700'
                                                            }`}>
                                                            <TrendingUp className="w-4 h-4" />
                                                            {event.quantityChange > 0 ? '+' : ''}{event.quantityChange}
                                                        </span>
                                                    )}
                                                    {event.createdByName && (
                                                        <span className="flex items-center gap-1 text-amber-600">
                                                            <User className="w-4 h-4" />
                                                            {event.createdByName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <TrendingUp className="w-12 h-12 text-amber-300 mx-auto mb-3" />
                            <p className="text-amber-700">Henüz olay kaydı bulunmuyor</p>
                            <p className="text-amber-600 text-sm mt-1">Stok hareketleri ve değişiklikler burada görünecek</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
