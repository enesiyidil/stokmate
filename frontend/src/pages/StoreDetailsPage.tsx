import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Building2, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { useGetStoreByIdQuery } from '../services/storeApi'
import { useGetStoreEmployeesQuery, useRemoveEmployeeMutation } from '../services/storeEmployeeApi'
import { useTopbar } from '../context/TopbarContext'
import AddEmployeeModal from '../components/stores/AddEmployeeModal'
import ConfirmModal from '../components/common/ConfirmModal'
import OtpVerificationModal from '../components/common/OtpVerificationModal'
import { useAppSelector } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'

export default function StoreDetailsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [showAddModal, setShowAddModal] = useState(false)
    const [employeeToRemove, setEmployeeToRemove] = useState<{ userId: string; userName: string } | null>(null)
    const { setTopbarContent } = useTopbar()

    const { data: store, isLoading: storeLoading } = useGetStoreByIdQuery(id!)
    const { data: employees = [], refetch: refetchEmployees } = useGetStoreEmployeesQuery(id!)
    const [removeEmployee, { isLoading: isRemoving }] = useRemoveEmployeeMutation()

    // Auth & Toast
    const { user } = useAppSelector((state) => state.auth)
    const { success, error } = useToast()

    // 2FA State
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [pendingOtpAction, setPendingOtpAction] = useState<(() => void) | null>(null)

    const verifyGate = (action: () => void) => {
        if (user?.totpEnabled) {
            setPendingOtpAction(() => action)
            setShowOtpModal(true)
        } else {
            action()
        }
    }

    useEffect(() => {
        if (store) {
            setTopbarContent({
                title: store.name,
                description: `Mağaza Kodu: ${store.code}`,
                icon: <Building2 className="w-8 h-8" />,
                showFiltersInTopbar: true,
                filters: (
                    <button onClick={() => navigate('/stores')} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Geri
                    </button>
                )
            })
        }
    }, [store, setTopbarContent, navigate])

    const handleRemoveClick = (userId: string, userName: string) => {
        setEmployeeToRemove({ userId, userName })
    }

    const handleConfirmRemove = async () => {
        if (!employeeToRemove) return

        verifyGate(async () => {
            try {
                await removeEmployee({ storeId: id!, userId: employeeToRemove.userId }).unwrap()
                refetchEmployees()
                setEmployeeToRemove(null)
                success('Çalışan başarıyla çıkarıldı')
            } catch (err) {
                error('Çalışan çıkarılırken bir hata oluştu')
            }
        })
    }

    if (storeLoading) {
        return <div className="p-6 text-amber-700">Yükleniyor...</div>
    }

    if (!store) {
        return <div className="p-6 text-amber-700">Mağaza bulunamadı</div>
    }

    return (
        <div className="p-6 space-y-6">
            {/* Store Info Card */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-amber-900 mb-4">Mağaza Bilgileri</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-amber-600 font-medium">Kod</p>
                        <p className="font-semibold text-amber-900">{store.code}</p>
                    </div>
                    <div>
                        <p className="text-sm text-amber-600 font-medium">İsim</p>
                        <p className="font-semibold text-amber-900">{store.name}</p>
                    </div>
                    {store.address && (
                        <div className="col-span-2">
                            <p className="text-sm text-amber-600 font-medium">Adres</p>
                            <p className="text-amber-900">{store.address}</p>
                        </div>
                    )}
                    {store.phone && (
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Telefon</p>
                            <p className="text-amber-900">{store.phone}</p>
                        </div>
                    )}
                    {store.email && (
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Email</p>
                            <p className="text-amber-900">{store.email}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Employees Section */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-amber-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-amber-900">Çalışanlar ({employees.length})</h2>
                    <button
                        onClick={() => verifyGate(() => setShowAddModal(true))}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        Çalışan Ekle
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Ad Soyad</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Telefon</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Rol</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">İşe Giriş</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-amber-700">
                                        Henüz çalışan atanmamış
                                    </td>
                                </tr>
                            ) : (
                                employees.map((emp) => (
                                    <tr key={emp.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-amber-900 font-medium">
                                                {emp.user.firstName || ''} {emp.user.lastName || ''}
                                            </p>
                                            <p className="text-xs text-amber-700">{emp.user.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-amber-700">
                                            {emp.user.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium border border-blue-400">
                                                {emp.user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-amber-700">
                                            {new Date(emp.joinDate).toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveClick(emp.user.id, `${emp.user.firstName} ${emp.user.lastName}`)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                title="Çıkar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Employee Modal */}
            {showAddModal && (
                <AddEmployeeModal
                    storeId={id!}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false)
                        refetchEmployees()
                    }}
                />
            )}

            {/* Confirm Remove Modal */}
            {employeeToRemove && (
                <ConfirmModal
                    isOpen={true}
                    title="Çalışanı Çıkar"
                    message={`${employeeToRemove.userName} çalışanını mağazadan çıkarmak istediğinizden emin misiniz?`}
                    onConfirm={handleConfirmRemove}
                    onCancel={() => setEmployeeToRemove(null)}
                    confirmText="Çıkar"
                    cancelText="İptal"
                    isLoading={isRemoving}
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
        </div>
    )
}
