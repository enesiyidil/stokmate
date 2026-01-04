import { useState, useEffect, useRef } from 'react'
import { X, Package, Save, Upload, Trash2, Image as ImageIcon } from 'lucide-react'
import { useCreateProductMutation, useUpdateProductMutation, useUploadProductImageMutation, useDeleteProductImageMutation, type ProductRequest, type ProductResponse } from '../../services/productApi'
import ImageCropperModal from './ImageCropperModal'

interface Props {
    product?: ProductResponse | null
    onClose: () => void
    onSuccess: () => void
}

export default function AddProductModal({ product, onClose, onSuccess }: Props) {
    const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()
    const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()
    const [uploadImage, { isLoading: isUploading }] = useUploadProductImageMutation()
    const [deleteImage, { isLoading: isDeleting }] = useDeleteProductImageMutation()

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [showCropper, setShowCropper] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [currentImage, setCurrentImage] = useState<string | null>(null)

    const [formData, setFormData] = useState<ProductRequest>({
        name: '',
        code: '',
        description: '',
        brand: '',
        activeForSale: true,
        stockQuantity: 0,
        vatRate: 20,
        unitPrice: 0,
        minStockLevel: 0,
        keywords: []
    })

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                code: product.code,
                description: product.description || '',
                brand: product.brand || '',
                activeForSale: product.activeForSale,
                stockQuantity: Number(product.stockQuantity),
                vatRate: Number(product.vatRate),
                unitPrice: Number(product.unitPrice),
                minStockLevel: product.minStockLevel ? Number(product.minStockLevel) : 0,
                keywords: product.keywords ? Array.from(product.keywords) : []
            })
            setCurrentImage(product.imageUrl || null)
        }
    }, [product])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            if (product) {
                await updateProduct({ id: product.id, data: formData }).unwrap()
            } else {
                await createProduct(formData).unwrap()
            }
            onSuccess()
        } catch (error) {
            console.error('Ürün kaydedilirken hata oluştu:', error)
            alert('Ürün kaydedilirken bir hata oluştu')
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = () => {
                setSelectedImage(reader.result as string)
                setShowCropper(true)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!product?.id) {
            // For new products, just show preview
            const reader = new FileReader()
            reader.onload = () => {
                setCurrentImage(reader.result as string)
                setShowCropper(false)
                setSelectedImage(null)
            }
            reader.readAsDataURL(croppedBlob)
            alert('Önce ürünü kaydedin, sonra resim ekleyebilirsiniz')
            return
        }

        try {
            const file = new File([croppedBlob], 'product-image.jpg', { type: 'image/jpeg' })
            await uploadImage({ id: product.id, file }).unwrap()
            setShowCropper(false)
            setSelectedImage(null)
        } catch (error) {
            console.error('Resim yüklenirken hata oluştu:', error)
            alert('Resim yüklenirken bir hata oluştu')
        }
    }

    const handleDeleteImage = async () => {
        if (!product?.id) return
        if (!confirm('Ürün resmini silmek istediğinizden emin misiniz?')) return

        try {
            await deleteImage(product.id).unwrap()
            setCurrentImage(null)
        } catch (error) {
            console.error('Resim silinirken hata oluştu:', error)
            alert('Resim silinirken bir hata oluştu')
        }
    }

    const isLoading = isCreating || isUpdating || isUploading || isDeleting

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                        <Package className="w-6 h-6" />
                        {product ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-amber-700" />
                    </button>
                </div>

                {/* Form */}
                <div className="overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-6">
                            {/* Image Upload Section */}
                            {product && (
                                <div>
                                    <h3 className="text-lg font-semibold text-amber-900 mb-4">Ürün Görseli</h3>
                                    <div className="flex items-start gap-4">
                                        {/* Image Preview */}
                                        <div className="w-32 h-32 border-2 border-dashed border-amber-300 rounded-lg overflow-hidden bg-amber-50 flex items-center justify-center">
                                            {currentImage ? (
                                                <img src={currentImage} alt="Product" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-12 h-12 text-amber-300" />
                                            )}
                                        </div>

                                        {/* Upload/Delete Buttons */}
                                        <div className="flex flex-col gap-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                                            >
                                                <Upload className="w-4 h-4" />
                                                {currentImage ? 'Resmi Değiştir' : 'Resim Yükle'}
                                            </button>
                                            {currentImage && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteImage}
                                                    disabled={isLoading}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Resmi Sil
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Basic Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-amber-900 mb-4">Temel Bilgiler</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Ürün Adı *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Örn: Laptop Dell XPS 15"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Ürün Kodu *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Örn: LAPTOP-001"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Marka
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.brand}
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Örn: Dell"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Açıklama
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                            placeholder="Ürün açıklaması..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Stock & Pricing */}
                            <div>
                                <h3 className="text-lg font-semibold text-amber-900 mb-4">Stok ve Fiyat</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Stok Miktarı *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={formData.stockQuantity}
                                            onChange={(e) => setFormData({ ...formData, stockQuantity: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Minimum Stok Seviyesi
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.minStockLevel}
                                            onChange={(e) => setFormData({ ...formData, minStockLevel: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            Birim Fiyat *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={formData.unitPrice}
                                            onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-amber-700 mb-2">
                                            KDV Oranı (%) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={formData.vatRate}
                                            onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Settings */}
                            <div>
                                <h3 className="text-lg font-semibold text-amber-900 mb-4">Ayarlar</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors border border-amber-200">
                                        <input
                                            type="checkbox"
                                            checked={formData.activeForSale}
                                            onChange={(e) => setFormData({ ...formData, activeForSale: e.target.checked })}
                                            className="w-5 h-5 rounded border-amber-400 bg-white text-amber-600 focus:ring-2 focus:ring-amber-500"
                                        />
                                        <div>
                                            <p className="text-amber-900 font-medium">Satışa Aktif</p>
                                            <p className="text-sm text-amber-700">Ürün aktif olarak satılabilir</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-amber-200 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-lg hover:from-amber-800 hover:to-orange-800 transition-all disabled:opacity-50 shadow-md"
                    >
                        <Save className="w-4 h-4" />
                        {isLoading ? 'Kaydediliyor...' : (product ? 'Güncelle' : 'Kaydet')}
                    </button>
                </div>
            </div >

            {/* Image Cropper Modal */}
            {showCropper && selectedImage && (
                <ImageCropperModal
                    image={selectedImage}
                    onClose={() => {
                        setShowCropper(false)
                        setSelectedImage(null)
                    }}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div >
    )
}
