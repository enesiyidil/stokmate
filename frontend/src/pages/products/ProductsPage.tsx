import { useState, useEffect, useRef } from 'react'
import { Package, Plus, Edit2, Trash2, AlertCircle, X, Eye } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGetProductsQuery, useDeleteProductMutation, useUploadProductImageMutation } from '../../services/productApi'
import type { ProductResponse } from '../../services/productApi'
import type { Brand } from '../../constants/brandConstants'
import AddProductModal from '../../components/products/AddProductModal'
import ImageCropperModal from '../../components/products/ImageCropperModal'
import { useTopbar } from '../../context/TopbarContext'
import { useAppSelector } from '../../hooks/useAuth'
import { useToast } from '../../context/ToastContext'
import BrandBadge from '../../components/common/BrandBadge'
import FilterSearchBar from '../../components/common/FilterSearchBar'
import Pagination from '../../components/common/Pagination'
import ConfirmModal from '../../components/common/ConfirmModal'
import OtpVerificationModal from '../../components/common/OtpVerificationModal'

export default function ProductsPage() {
    const navigate = useNavigate()
    const { user } = useAppSelector(state => state.auth)
    const [searchParams] = useSearchParams()
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [page, setPage] = useState(0)
    const { success, error } = useToast()

    // 2FA Gate State
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

    const verifyGate = (action: () => void) => {
        if (user?.totpEnabled) {
            setPendingAction(() => action)
            setShowOtpModal(true)
        } else {
            action()
        }
    }

    // Confrim Modal State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [productToDelete, setProductToDelete] = useState<string | null>(null)

    // Filter states
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
    const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL')
    // Initialize brand filter from URL param if present
    const [brandFilter, setBrandFilter] = useState<'ALL' | 'OAK' | 'MAPLE' | 'PINE' | 'MARKASIZ'>(
        (searchParams.get('brand') as any) || 'ALL'
    )

    // Image upload states
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedProductForImage, setSelectedProductForImage] = useState<ProductResponse | null>(null)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [showCropper, setShowCropper] = useState(false)

    // Image preview states
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(0)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const { setTopbarContent } = useTopbar()
    const { data, isLoading, refetch } = useGetProductsQuery({
        page,
        size: 50,
        search: debouncedSearch || undefined,
        brand: brandFilter !== 'ALL' ? brandFilter : undefined,
        activeForSale: statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : undefined,
        stockFilter: stockFilter !== 'ALL' ? stockFilter : undefined,
    })
    const [deleteProduct] = useDeleteProductMutation()
    const [uploadImage] = useUploadProductImageMutation()

    // Set topbar content
    useEffect(() => {
        setTopbarContent({
            title: 'Stoklu Ürünler',
            description: 'Stoklu ürünleri görüntüleyin ve yönetin',
            icon: <Package className="w-8 h-8" />,
            actions: (
                !['STORE_MANAGER', 'STORE_EMPLOYEE', 'LOGISTICS_MANAGER'].includes(user?.role || '') ? (
                    <button
                        onClick={() => verifyGate(() => setShowAddModal(true))}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        Yeni Ürün Ekle
                    </button>
                ) : undefined
            )
        })
    }, [setTopbarContent])

    const handleDeleteClick = (id: string) => {
        setProductToDelete(id)
        setShowDeleteConfirm(true)
    }

    const handleConfirmDelete = async () => {
        if (!productToDelete) return

        try {
            await deleteProduct(productToDelete).unwrap()
            success('Ürün başarıyla silindi')
            setShowDeleteConfirm(false)
            setProductToDelete(null)
        } catch (err) {
            console.error('Ürün silinirken hata oluştu:', err)
            error('Ürün silinirken bir hata oluştu')
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
        } catch (err) {
            console.error('Resim yüklenirken hata oluştu:', err)
            error('Resim yüklenirken bir hata oluştu')
        }
    }

    const products = data?.content || []

    // Reset page on filter changes
    const handleStatusChange = (v: any) => { setStatusFilter(v); setPage(0); }
    const handleBrandChange = (v: any) => { setBrandFilter(v); setPage(0); }
    const handleStockChange = (v: any) => { setStockFilter(v); setPage(0); }

    return (
        <div className="p-6 space-y-6">
            {/* Filter and Search Bar */}
            <FilterSearchBar
                filters={[
                    {
                        label: 'Durum',
                        value: statusFilter,
                        onChange: handleStatusChange,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'ACTIVE', label: 'Aktif', activeColor: 'bg-green-600' },
                            { key: 'INACTIVE', label: 'Pasif', activeColor: 'bg-red-600' }
                        ]
                    },
                    {
                        label: 'Stok',
                        value: stockFilter,
                        onChange: handleStockChange,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'IN_STOCK', label: 'Var', activeColor: 'bg-green-600' },
                            { key: 'OUT_OF_STOCK', label: 'Bitmiş', activeColor: 'bg-red-600' }
                        ]
                    },
                    {
                        label: 'Marka',
                        value: brandFilter,
                        onChange: handleBrandChange,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'OAK', label: 'Doğtaş', activeColor: 'bg-red-600' },
                            { key: 'MAPLE', label: 'Maple', activeColor: 'bg-blue-600' },
                            { key: 'PINE', label: 'Pine', activeColor: 'bg-purple-600' },
                            { key: 'MARKASIZ', label: 'Markasız', activeColor: 'bg-gray-600' }
                        ]
                    }
                ]}
                searchPlaceholder="Ürün adı, kodu veya marka ile ara..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Products Table */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl overflow-hidden shadow-lg">
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                    </div>
                ) : products.length === 0 ? (
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
                                    {!['STORE_MANAGER', 'STORE_EMPLOYEE', 'LOGISTICS_MANAGER'].includes(user?.role || '') && (
                                        <th className="text-right p-4 text-amber-900 font-semibold">İşlemler</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
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
                                        <td className="px-6 py-4">
                                            <BrandBadge brand={product.brand as Brand} />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`font-medium ${product.stockQuantity > 0 ? 'text-green-600' : 'text-amber-500'}`}>
                                                        {product.stockQuantity}
                                                    </span>
                                                    <span className="text-xs text-amber-400">adet</span>
                                                </div>
                                                {Number(product.cancelledStockQuantity) >= 1 && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-red-500 font-medium">
                                                            {product.cancelledStockQuantity}
                                                        </span>
                                                        <span className="text-xs text-red-400">iptal</span>
                                                    </div>
                                                )}
                                            </div>
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
                                        {!['STORE_MANAGER', 'STORE_EMPLOYEE', 'LOGISTICS_MANAGER'].includes(user?.role || '') && (
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Eye Icon for Details - Admin/Manager only */}
                                                    <button
                                                        onClick={() => verifyGate(() => navigate(`/products/${product.id}`))}
                                                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                                                        title="Detayları Gör"
                                                    >
                                                        <Eye className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                                                    </button>
                                                    <button
                                                        onClick={() => verifyGate(() => setEditingProduct(product))}
                                                        className="p-2 hover:bg-amber-100 rounded-lg transition-colors group"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 className="w-4 h-4 text-amber-700 group-hover:text-amber-900" />
                                                    </button>
                                                    <button
                                                        onClick={() => verifyGate(() => handleDeleteClick(product.id))}
                                                        className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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

            {/* Pagination */}
            {data && data.totalPages > 1 && (
                <Pagination
                    page={page}
                    totalPages={data.totalPages}
                    totalElements={data.totalElements}
                    onPageChange={setPage}
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

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Ürünü Sil"
                message="Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                confirmText="Sil"
                cancelText="İptal"
                type="danger"
            />

            {/* OTP Modal */}
            <OtpVerificationModal
                isOpen={showOtpModal}
                onClose={() => {
                    setShowOtpModal(false)
                    setPendingAction(null)
                }}
                onVerify={() => {
                    setShowOtpModal(false)
                    if (pendingAction) {
                        pendingAction()
                        setPendingAction(null)
                    }
                }}
            />
        </div>
    )
}
