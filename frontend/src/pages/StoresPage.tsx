import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Plus, Edit, Trash2, CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react'
import { useListStoresQuery, useDeleteStoreMutation, type StoreResponse } from '../services/storeApi'
import { useTopbar } from '../context/TopbarContext'
import AddStoreModal from '../components/stores/AddStoreModal'
import EditStoreModal from '../components/stores/EditStoreModal'
import OtpVerificationModal from '../components/common/OtpVerificationModal'
import ConfirmModal from '../components/common/ConfirmModal'
import { useAppSelector } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'

export default function StoresPage() {
    const navigate = useNavigate()
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingStore, setEditingStore] = useState<StoreResponse | null>(null)
    const { setTopbarContent } = useTopbar()

    const { data: stores = [], isLoading, refetch } = useListStoresQuery({ activeOnly: false })
    const [deleteStore] = useDeleteStoreMutation()
    const { user } = useAppSelector((state) => state.auth)
    const { success, error } = useToast()

    // 2FA State
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [pendingOtpAction, setPendingOtpAction] = useState<(() => void) | null>(null)

    // Confirm Modal State
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean
        storeId: string | null
        storeName: string | null
    }>({ isOpen: false, storeId: null, storeName: null })

    const verifyGate = (action: () => void) => {
        if (user?.totpEnabled) {
            setPendingOtpAction(() => action)
            setShowOtpModal(true)
        } else {
            action()
        }
    }

    useEffect(() => {
        setTopbarContent({
            title: 'Mağazalar',
            description: 'Mağaza bilgilerini görüntüleyin ve yönetin',
            icon: <Store className="w-8 h-8" />,
            actions: (
                <button
                    onClick={() => {
                        verifyGate(() => setShowAddModal(true))
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Mağaza
                </button>
            ),
        })

        return () => setTopbarContent(null)
    }, [setTopbarContent, user?.totpEnabled])

    const handleDeleteClick = (id: string, name: string) => {
        setConfirmModalState({ isOpen: true, storeId: id, storeName: name })
    }

    const handleConfirmDelete = async () => {
        const { storeId } = confirmModalState
        if (!storeId) return

        verifyGate(async () => {
            try {
                await deleteStore(storeId).unwrap()
                success('Mağaza başarıyla silindi')
                refetch()
                setConfirmModalState({ isOpen: false, storeId: null, storeName: null })
            } catch (err: any) {
                console.error('Failed to delete store:', err)
                error('Mağaza silinirken bir hata oluştu')
            }
        })
    }

    const handleEditClick = (store: StoreResponse) => {
        verifyGate(() => setEditingStore(store))
    }

    return (
        <div className="p-6 space-y-6">
            {/* Stores Table */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl overflow-hidden shadow-xl">
                {isLoading ? (
                    <div className="p-12 text-center text-amber-700">Yükleniyor...</div>
                ) : stores.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-amber-600 mb-4" />
                        <h3 className="text-xl font-semibold text-amber-900 mb-2">Henüz Mağaza Eklenmemiş</h3>
                        <p className="text-amber-700 mb-6">Hemen bir mağaza ekleyin!</p>
                        <button
                            onClick={() => verifyGate(() => setShowAddModal(true))}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                        >
                            <Plus className="w-4 h-4 inline mr-2" />
                            İlk Mağazayı Ekle
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Kod</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">İsim</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Telefon</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Durum</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stores.map((store) => (
                                    <tr
                                        key={store.id}
                                        className="border-b border-amber-100 hover:bg-amber-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-amber-900 font-semibold">
                                                {store.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-amber-900 font-medium">{store.name}</p>
                                            {store.address && (
                                                <p className="text-xs text-amber-700 mt-1 truncate max-w-xs">
                                                    {store.address}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-amber-700">{store.phone || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-amber-700">{store.email || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {store.active ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium border border-green-400">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm font-medium border border-red-400">
                                                    <XCircle className="w-3 h-3" />
                                                    Pasif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/stores/${store.id}`)}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Detaylar"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(store)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(store.id, store.name)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddStoreModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false)
                        refetch()
                    }}
                />
            )}

            {editingStore && (
                <EditStoreModal
                    store={editingStore}
                    onClose={() => setEditingStore(null)}
                    onSuccess={() => {
                        setEditingStore(null)
                        refetch()
                    }}
                />
            )}

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
                onConfirm={handleConfirmDelete}
                title="Mağaza Silme"
                message={`"${confirmModalState.storeName}" mağazasını silmek istediğinizden emin misiniz?`}
                confirmText="Sil"
                cancelText="İptal"
                type="danger"
            />
        </div>
    )
}
