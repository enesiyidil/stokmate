import { useState, useEffect, useRef } from 'react'
import { Package, Plus, Search, Edit2, Trash2, AlertCircle, X, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGetProductsQuery, useDeleteProductMutation, useUploadProductImageMutation } from '../../services/productApi'
import type { ProductResponse } from '../../services/productApi'
import type { Brand } from '../../constants/brandConstants'
import AddProductModal from '../../components/products/AddProductModal'
import ImageCropperModal from '../../components/products/ImageCropperModal'
import { useTopbar } from '../../context/TopbarContext'
import BrandBadge from '../../components/common/BrandBadge'

export default function ProductsPage() {
    const navigate = useNavigate()
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(0)

    // Image upload states
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedProductForImage, setSelectedProductForImage] = useState<ProductResponse | null>(null)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [showCropper, setShowCropper] = useState(false)

    // Image preview states
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    const { setTopbarContent } = useTopbar()
    const { data, isLoading, refetch } = useGetProductsQuery({ page, size: 20 })
    const [deleteProduct] = useDeleteProductMutation()
    const [uploadImage, { isLoading: isUploading }] = useUploadProductImageMutation()

    // Set topbar content
    useEffect(() => {
        setTopbarContent({
            title: 'Ürünler',
            description: 'Ürünleri görüntüleyin ve yönetin',
            icon: <Package className="w-8 h-8" />,
            actions: (
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Ürün Ekle
                </button>
            )
        })
    }, [setTopbarContent])

    const handleDelete = async (id: string) => {
        if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return
        try {
            await deleteProduct(id).unwrap()
        } catch (error) {
            console.error('Ürün silinirken hata oluştu:', error)
            alert('Ürün silinirken bir hata oluştu')
        }
    }

    // Handle file selection for image upload
    const handleImageUploadClick = (product: ProductResponse) => {
        setSelectedProductForImage(product)
        fileInputRef.current?.click()
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
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleCropComplete = async (croppedBlob: Blob) => {
        if (!selectedProductForImage?.id) return

        try {
            const file = new File([croppedBlob], 'product-image.jpg', { type: 'image/jpeg' })
            await uploadImage({ id: selectedProductForImage.id, file }).unwrap()
            setShowCropper(false)
            setSelectedImage(null)
            setSelectedProductForImage(null)
            refetch()
        } catch (error) {
            console.error('Resim yüklenirken hata oluştu:', error)
            alert('Resim yüklenirken bir hata oluştu')
        }
    }

    const filteredProducts = data?.content.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    return (
        <div className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl p-4 shadow-lg">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                        <input
                            type="text"
                            placeholder="Ürün adı, kodu veya marka ile ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl overflow-hidden shadow-lg">
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-amber-600 mb-4" />
                        <h3 className="text-xl font-semibold text-amber-900 mb-2">Ürün Bulunamadı</h3>
                        <p className="text-amber-700 mb-6">Henüz eklenmiş ürün yok. Hemen bir ürün ekleyin!</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                        >
                            <Plus className="w-4 h-4 inline mr-2" />
                            İlk Ürünü Ekle
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                    <th className="text-left p-4 text-amber-900 font-semibold">Görsel</th>
                                    <th className="text-left p-4 text-amber-900 font-semibold">Ürün Kodu</th>
                                    <th className="text-left p-4 text-amber-900 font-semibold">Ürün Adı</th>
                                    <th className="text-left p-4 text-amber-900 font-semibold">Marka</th>
                                    <th className="text-left p-4 text-amber-900 font-semibold">Stok</th>
                                    <th className="text-left p-4 text-amber-900 font-semibold">Durum</th>
                                    <th className="text-right p-4 text-amber-900 font-semibold">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="border-b border-amber-100 hover:bg-amber-50 transition-colors"
                                    >
                                        {/* Product Image */}
                                        <td className="p-4">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-amber-50 border border-amber-200 flex items-center justify-center">
                                                {product.imageUrl ? (
                                                    <button
                                                        onClick={() => setPreviewImage(`/api/files/view?path=${encodeURIComponent(product.imageUrl!)}`)}
                                                        className="w-full h-full cursor-pointer hover:opacity-80 transition-opacity"
                                                        title="Resmi Görüntüle"
                                                    >
                                                        <img src={`/api/files/view?path=${encodeURIComponent(product.imageUrl)}`} alt={product.name} className="w-full h-full object-cover" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleImageUploadClick(product)}
                                                        className="w-full h-full flex items-center justify-center hover:bg-amber-100 transition-colors group"
                                                        title="Resim Ekle"
                                                    >
                                                        <Plus className="w-6 h-6 text-amber-400 group-hover:text-amber-600" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-amber-900 font-mono font-medium">{product.code}</span>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="text-amber-900 font-medium">{product.name}</p>
                                                {product.description && (
                                                    <p className="text-xs text-amber-700 mt-1">{product.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <BrandBadge brand={product.brand as Brand} />
                                        </td>
                                        <td className="p-4">
                                            <span className={`font-medium ${product.stockQuantity > 0 ? 'text-green-300' : 'text-red-300'}`}>
                                                {product.stockQuantity}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            {product.activeForSale ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm border border-green-200 font-medium">
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm border border-red-200 font-medium">
                                                    Pasif
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Eye Icon for Details - Admin/Manager only */}
                                                <button
                                                    onClick={() => navigate(`/products/${product.id}`)}
                                                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                                                    title="Detayları Gör"
                                                >
                                                    <Eye className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingProduct(product)}
                                                    className="p-2 hover:bg-amber-100 rounded-lg transition-colors group"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 className="w-4 h-4 text-amber-700 group-hover:text-amber-900" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-white/10">
                        <p className="text-sm text-amber-700">
                            Toplam {data.totalElements} ürün
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(Math.max(0, page - 1))}
                                disabled={page === 0}
                                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Önceki
                            </button>
                            <span className="px-4 py-2 text-amber-900">
                                {page + 1} / {data.totalPages}
                            </span>
                            <button
                                onClick={() => setPage(Math.min(data.totalPages - 1, page + 1))}
                                disabled={page >= data.totalPages - 1}
                                className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sonraki
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Product Modal */}
            {(showAddModal || editingProduct) && (
                <AddProductModal
                    product={editingProduct}
                    onClose={() => {
                        setShowAddModal(false)
                        setEditingProduct(null)
                    }}
                    onSuccess={() => {
                        setShowAddModal(false)
                        setEditingProduct(null)
                        refetch()
                    }}
                />
            )}

            {/* Hidden File Input for Image Upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Image Cropper Modal */}
            {showCropper && selectedImage && (
                <ImageCropperModal
                    image={selectedImage}
                    onClose={() => {
                        setShowCropper(false)
                        setSelectedImage(null)
                        setSelectedProductForImage(null)
                    }}
                    onCropComplete={handleCropComplete}
                />
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                        <img
                            src={previewImage}
                            alt="Product Preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
