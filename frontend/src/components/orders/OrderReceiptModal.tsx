import { useState } from 'react'
import { X, Camera, Trash2, Package, Truck, User, Phone } from 'lucide-react'
import { useCreateOrderReceiptMutation } from '../../services/orderReceiptApi'
import type { OrderProductResponse } from '../../services/orderApi'
import type { OrderReceiptResponse } from '../../services/orderReceiptApi'

interface Props {
    orderProduct: OrderProductResponse
    orderNo: string
    onClose: () => void
    onSuccess: (receipt?: OrderReceiptResponse) => void
}

export default function OrderReceiptModal({ orderProduct, orderNo, onClose, onSuccess }: Props) {
    const [createReceipt, { isLoading }] = useCreateOrderReceiptMutation()

    const [receivedQuantity, setReceivedQuantity] = useState(orderProduct.quantity)
    const [notes, setNotes] = useState('')
    const [vehiclePlate, setVehiclePlate] = useState('')
    const [driverName, setDriverName] = useState('')
    const [driverPhone, setDriverPhone] = useState('')
    const [photos, setPhotos] = useState<File[]>([])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setPhotos([...photos, ...newFiles])
        }
    }

    const handleRemovePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const receipt = await createReceipt({
                request: {
                    orderProductId: orderProduct.id,
                    receivedQuantity: Number(receivedQuantity),
                    notes: notes || undefined,
                    vehiclePlate: vehiclePlate || undefined,
                    driverName: driverName || undefined,
                    driverPhone: driverPhone || undefined,
                },
                photos: photos.length > 0 ? photos : undefined,
            }).unwrap()

            onSuccess(receipt)
        } catch (error) {
            console.error('Failed to create receipt:', error)
            alert('Ürün kabul edilirken bir hata oluştu')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Package className="w-6 h-6 text-green-400" />
                            Ürün Kabul
                        </h2>
                        <p className="text-sm text-purple-300 mt-1">
                            Sipariş: {orderNo} • {orderProduct.productName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-purple-200" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="p-6 space-y-6">
                        {/* Product Info */}
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-purple-300">Ürün Kodu:</span>
                                    <span className="text-white ml-2 font-medium">{orderProduct.productCode}</span>
                                </div>
                                <div>
                                    <span className="text-purple-300">Sipariş Miktarı:</span>
                                    <span className="text-white ml-2 font-medium">{orderProduct.quantity}</span>
                                </div>
                            </div>
                        </div>

                        {/* Received Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-2">
                                Kabul Edilen Miktar *
                            </label>
                            <input
                                type="number"
                                required
                                min="0.01"
                                step="0.01"
                                max={orderProduct.quantity}
                                value={receivedQuantity}
                                onChange={(e) => setReceivedQuantity(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-purple-300 mt-1">
                                Kısmi kabul yapabilirsiniz. Maksimum: {orderProduct.quantity}
                            </p>
                        </div>

                        {/* Vehicle & Driver Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                Araç ve Şoför Bilgileri
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                <input
                                    type="text"
                                    placeholder="Araç Plakası"
                                    value={vehiclePlate}
                                    onChange={(e) => setVehiclePlate(e.target.value)}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Şoför Adı Soyadı"
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <input
                                    type="tel"
                                    placeholder="Şoför Telefonu"
                                    value={driverPhone}
                                    onChange={(e) => setDriverPhone(e.target.value)}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-purple-200 mb-2">
                                Notlar
                            </label>
                            <textarea
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Kabul sırasında oluşan notlarınızı buraya yazabilirsiniz..."
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Photo Upload */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-purple-200 flex items-center gap-2">
                                <Camera className="w-4 h-4" />
                                Fotoğraflar
                            </label>

                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="photo-upload"
                            />

                            <label
                                htmlFor="photo-upload"
                                className="block w-full px-4 py-8 border-2 border-dashed border-white/20 rounded-lg text-center cursor-pointer hover:bg-white/5 hover:border-purple-500 transition-all"
                            >
                                <Camera className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                                <span className="text-purple-200 text-sm">
                                    Fotoğraf eklemek için tıklayın
                                </span>
                            </label>

                            {photos.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {photos.map((photo, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={URL.createObjectURL(photo)}
                                                alt={`Photo ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg border border-white/10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePhoto(index)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                                                {photo.name.length > 15 ? photo.name.substring(0, 15) + '...' : photo.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-white/10 text-purple-200 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                        >
                            <Package className="w-4 h-4" />
                            {isLoading ? 'Kaydediliyor...' : 'Kabul Et'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
