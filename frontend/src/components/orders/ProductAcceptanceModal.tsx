import { useState } from 'react'
import { X, CheckCircle, ArrowLeft, Upload, Trash2 } from 'lucide-react'
import { useGetPendingProductsQuery, useAcceptProductMutation, type PendingProductResponse } from '../../services/productAcceptanceApi'
import { useListVehiclesQuery } from '../../services/vehicleApi'

interface ProductAcceptanceModalProps {
    onClose: () => void
    onSuccess: () => void
}

export default function ProductAcceptanceModal({ onClose, onSuccess }: ProductAcceptanceModalProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [selectedProduct, setSelectedProduct] = useState<PendingProductResponse | null>(null)
    const [formData, setFormData] = useState({
        acceptedQuantity: 1,
        note: '',
        vehiclePlate: '',
        driverInfo: ''
    })
    const [isManualVehicle, setIsManualVehicle] = useState(false)
    const [manualVehiclePlate, setManualVehiclePlate] = useState('')
    const [images, setImages] = useState<File[]>([])
    const [error, setError] = useState('')

    const { data: pendingProducts = [], isLoading } = useGetPendingProductsQuery()
    const { data: vehicles = [] } = useListVehiclesQuery()
    const [acceptProduct, { isLoading: isSubmitting }] = useAcceptProductMutation()

    const handleProductSelect = (product: PendingProductResponse) => {
        setSelectedProduct(product)
        setFormData(prev => ({ ...prev, acceptedQuantity: Math.min(1, product.remainingQuantity) }))
        setStep(2)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (images.length === 0) {
            setError('En az 1 resim yüklemeniz gerekiyor')
            return
        }

        if (!selectedProduct) return

        try {
            await acceptProduct({
                data: {
                    orderProductId: selectedProduct.orderProductId,
                    acceptedQuantity: formData.acceptedQuantity,
                    note: formData.note,
                    vehiclePlate: formData.vehiclePlate,
                    driverInfo: formData.driverInfo
                },
                images
            }).unwrap()

            onSuccess()
        } catch (err: any) {
            setError(err?.data?.message || 'Ürün kabul edilirken hata oluştu')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <div className="flex items-center gap-4">
                        {step === 2 && (
                            <button
                                onClick={() => setStep(1)}
                                className="p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <h2 className="text-2xl font-bold text-amber-900">
                            Ürün Kabul - Adım {step}/2
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 1 ? (
                        <div>
                            <p className="text-amber-700 mb-4">Kabul edilecek ürünü seçin:</p>
                            {isLoading ? (
                                <p className="text-center text-amber-700 py-8">Yükleniyor...</p>
                            ) : pendingProducts.length === 0 ? (
                                <p className="text-center text-amber-700 py-8">Bekleyen ürün yok</p>
                            ) : (
                                <div className="space-y-3">
                                    {pendingProducts.map(product => (
                                        <div
                                            key={product.orderProductId}
                                            className="backdrop-blur-xl bg-white border border-amber-200 rounded-xl p-4 hover:bg-amber-50 transition-colors cursor-pointer"
                                            onClick={() => handleProductSelect(product)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-amber-900 font-medium">{product.productName}</p>
                                                    <p className="text-sm text-amber-700">Kod: {product.productCode}</p>
                                                    <p className="text-sm text-amber-700">Sipariş: {product.orderNumber}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-amber-900">Toplam: {product.totalQuantity}</p>
                                                    <p className="text-sm text-green-400">Kabul: {product.acceptedQuantity}</p>
                                                    <p className="text-sm text-yellow-400 font-semibold">Kalan: {product.remainingQuantity}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Selected Product Info */}
                            <div className="backdrop-blur-xl bg-blue-50 border border-blue-300 rounded-xl p-4">
                                <p className="text-amber-900 font-medium">{selectedProduct?.productName}</p>
                                <p className="text-sm text-blue-800">Sipariş: {selectedProduct?.orderNumber}</p>
                                <p className="text-sm text-yellow-700">Kalan Miktar: {selectedProduct?.remainingQuantity}</p>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-2">Kabul Edilen Miktar *</label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={selectedProduct?.remainingQuantity}
                                    value={formData.acceptedQuantity}
                                    onChange={(e) => setFormData(prev => ({ ...prev, acceptedQuantity: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            {/* Vehicle Plate */}
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-2">Araç Plakası *</label>
                                <select
                                    required={!isManualVehicle}
                                    value={isManualVehicle ? 'MANUEL' : formData.vehiclePlate}
                                    onChange={(e) => {
                                        if (e.target.value === 'MANUEL') {
                                            setIsManualVehicle(true)
                                            setManualVehiclePlate('')
                                        } else {
                                            setIsManualVehicle(false)
                                            setFormData(prev => ({ ...prev, vehiclePlate: e.target.value }))
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="">-- Araç Seçiniz --</option>
                                    {vehicles.map(vehicle => (
                                        <option key={vehicle.id} value={vehicle.licensePlate}>
                                            {vehicle.licensePlate} - {vehicle.vehicleType}
                                        </option>
                                    ))}
                                    <option value="MANUEL">Manuel Giriş (Dış Araç)</option>
                                </select>
                                {isManualVehicle && (
                                    <input
                                        type="text"
                                        required
                                        placeholder="Araç plakasını girin"
                                        value={manualVehiclePlate}
                                        onChange={(e) => {
                                            setManualVehiclePlate(e.target.value)
                                            setFormData(prev => ({ ...prev, vehiclePlate: e.target.value }))
                                        }}
                                        className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 mt-2"
                                    />
                                )}
                            </div>

                            {/* Driver Info */}
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-2">Şoför Bilgisi *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.driverInfo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, driverInfo: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="Ahmet Yılmaz"
                                />
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-2">Not *</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.note}
                                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                    placeholder="Teslim detayları..."
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-2">Resimler (En az 1) *</label>
                                <div className="border-2 border-dashed border-amber-300 rounded-xl p-6 text-center hover:border-amber-500 transition-colors">
                                    <Upload className="w-12 h-12 text-amber-600 mx-auto mb-2" />
                                    <p className="text-amber-700 mb-2">Resimleri sürükle veya tıkla</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label htmlFor="image-upload" className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 inline-block">
                                        Resim Seç
                                    </label>
                                </div>

                                {/* Image Previews */}
                                {images.length > 0 && (
                                    <div className="grid grid-cols-4 gap-3 mt-4">
                                        {images.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={URL.createObjectURL(image)}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded-lg border border-white/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-3 h-3 text-white" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Kaydediliyor...' : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Ürünü Kabul Et
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
