import { useState, useEffect } from 'react'
import { Truck, Plus, Edit, Trash2, Search, AlertCircle } from 'lucide-react'
import { useTopbar } from '../context/TopbarContext'
import { useAppSelector } from '../hooks/useAuth'
import {
    useListVehiclesQuery,
    useCreateVehicleMutation,
    useUpdateVehicleMutation,
    useDeleteVehicleMutation
} from '../services/vehicleApi'
import type { VehicleResponse, VehicleRequest } from '../services/vehicleApi'
import OtpVerificationModal from '../components/common/OtpVerificationModal'
import ConfirmModal from '../components/common/ConfirmModal'
import { useToast } from '../context/ToastContext'

export default function VehiclesPage() {
    const { setTopbarContent } = useTopbar()
    const { user } = useAppSelector(state => state.auth)
    const { data: vehicles = [], isLoading } = useListVehiclesQuery()
    const [createVehicle] = useCreateVehicleMutation()
    const [updateVehicle] = useUpdateVehicleMutation()
    const [deleteVehicle] = useDeleteVehicleMutation()
    const { success, error } = useToast()

    const [searchQuery, setSearchQuery] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingVehicle, setEditingVehicle] = useState<VehicleResponse | null>(null)
    const [formData, setFormData] = useState<VehicleRequest>({ licensePlate: '', vehicleType: '' })

    // 2FA State
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [pendingOtpAction, setPendingOtpAction] = useState<(() => void) | null>(null)

    // Confirm Modal State
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean
        id: string | null
        plate: string | null
    }>({ isOpen: false, id: null, plate: null })

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
            title: 'Araçlar',
            description: 'Şirket araçlarını görüntüleyin ve yönetin',
            icon: <Truck className="w-8 h-8" />,
            actions: !['LOGISTICS_MANAGER'].includes(user?.role || '') ? (
                <button
                    onClick={() => {
                        verifyGate(() => {
                            setEditingVehicle(null)
                            setFormData({ licensePlate: '', vehicleType: '' })
                            setIsModalOpen(true)
                        })
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Araç
                </button>
            ) : undefined,
        })

        return () => setTopbarContent(null)
    }, [setTopbarContent, user?.totpEnabled, user?.role]) // Added dependencies

    const handleEdit = (vehicle: VehicleResponse) => {
        verifyGate(() => {
            setEditingVehicle(vehicle)
            setFormData({ licensePlate: vehicle.licensePlate, vehicleType: vehicle.vehicleType })
            setIsModalOpen(true)
        })
    }

    const handleDeleteClick = (id: string, plate: string) => {
        setConfirmModalState({ isOpen: true, id, plate })
    }

    const handleConfirmDelete = async () => {
        const { id } = confirmModalState
        if (!id) return

        verifyGate(async () => {
            try {
                await deleteVehicle(id).unwrap()
                success('Araç başarıyla silindi')
                setConfirmModalState({ isOpen: false, id: null, plate: null })
            } catch (err: any) {
                console.error('Failed to delete vehicle:', err)
                error('Araç silinirken hata oluştu')
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingVehicle) {
                await updateVehicle({ id: editingVehicle.id, data: formData }).unwrap()
                success('Araç başarıyla güncellendi')
            } else {
                await createVehicle(formData).unwrap()
                success('Araç başarıyla eklendi')
            }
            setIsModalOpen(false)
            setEditingVehicle(null)
            setFormData({ licensePlate: '', vehicleType: '' })
        } catch (err: any) {
            error(err?.data?.message || 'İşlem başarısız')
        }
    }

    const filteredVehicles = vehicles.filter(vehicle =>
        vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.vehicleType.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl p-4 shadow-lg">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                        <input
                            type="text"
                            placeholder="Araç plakası veya tipi ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl overflow-hidden shadow-xl">
                {isLoading ? (
                    <div className="p-12 text-center text-amber-700">Yükleniyor...</div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-amber-600 mb-4" />
                        <h3 className="text-xl font-semibold text-amber-900 mb-2">
                            {searchQuery ? 'Araç Bulunamadı' : 'Henüz Araç Eklenmemiş'}
                        </h3>
                        <p className="text-amber-700 mb-6">
                            {searchQuery ? 'Arama sonucu bulunamadı' : 'Hemen bir araç ekleyin!'}
                        </p>
                        {!searchQuery && !['LOGISTICS_MANAGER'].includes(user?.role || '') && (
                            <button
                                onClick={() => {
                                    verifyGate(() => {
                                        setEditingVehicle(null)
                                        setFormData({ licensePlate: '', vehicleType: '' })
                                        setIsModalOpen(true)
                                    })
                                }}
                                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                            >
                                <Plus className="w-4 h-4 inline mr-2" />
                                İlk Aracı Ekle
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Plaka</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Araç Tipi</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Oluşturma Tarihi</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVehicles.map((vehicle) => (
                                    <tr key={vehicle.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-amber-900 font-medium">{vehicle.licensePlate}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-amber-700">{vehicle.vehicleType}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-amber-700">{new Date(vehicle.createdAt).toLocaleDateString('tr-TR')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Hide actions for LOGISTICS_MANAGER */}
                                            {!['LOGISTICS_MANAGER'].includes(user?.role || '') && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(vehicle)}
                                                        className="p-2 hover:bg-amber-100 rounded-lg transition-colors group"
                                                        title="Düzenle"
                                                    >
                                                        <Edit className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(vehicle.id, vehicle.licensePlate)}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                                        title="Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-2xl font-bold text-amber-900 mb-4">
                            {editingVehicle ? 'Araç Düzenle' : 'Yeni Araç'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-amber-900 mb-1">Araç Plakası *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.licensePlate}
                                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                                    placeholder="34ABC123"
                                    className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-amber-900 mb-1">Araç Tipi *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.vehicleType}
                                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                    placeholder="Kamyon, Kamyonet, Panelvan..."
                                    className="w-full px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false)
                                        setEditingVehicle(null)
                                        setFormData({ licensePlate: '', vehicleType: '' })
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all font-medium"
                                >
                                    {editingVehicle ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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
                title="Araç Silme"
                message={`"${confirmModalState.plate}" plakalı aracı silmek istediğinizden emin misiniz?`}
                confirmText="Sil"
                cancelText="İptal"
                type="danger"
            />
        </div>
    )
}
