import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, Search, AlertCircle } from 'lucide-react'
import { useTopbar } from '../context/TopbarContext'
import {
    useListCustomersQuery,
    useDeleteCustomerMutation
} from '../services/customerApi'
import type { CustomerResponse } from '../services/customerApi'
import CustomerModal from '../components/customers/CustomerModal'
import OtpVerificationModal from '../components/common/OtpVerificationModal'
import ConfirmModal from '../components/common/ConfirmModal'
import { useAppSelector } from '../hooks/useAuth'
import { useToast } from '../context/ToastContext'

export default function CustomersPage() {
    const { setTopbarContent } = useTopbar()
    const { data: customers = [], isLoading } = useListCustomersQuery()
    const [deleteCustomer] = useDeleteCustomerMutation()
    const { user } = useAppSelector((state) => state.auth)
    const { success, error } = useToast()

    const [searchQuery, setSearchQuery] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<CustomerResponse | null>(null)

    // 2FA & Modal States
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [pendingOtpAction, setPendingOtpAction] = useState<(() => void) | null>(null)
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean
        customerId: string | null
        customerName: string | null
    }>({ isOpen: false, customerId: null, customerName: null })

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
            title: 'Müşteriler',
            description: 'Müşteri bilgilerini görüntüleyin ve yönetin',
            icon: <Users className="w-8 h-8" />,
            actions: (
                <button
                    onClick={() => {
                        verifyGate(() => {
                            setEditingCustomer(null)
                            setIsModalOpen(true)
                        })
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Müşteri
                </button>
            ),
        })

        return () => setTopbarContent(null)
    }, [setTopbarContent, user?.totpEnabled])

    const handleEdit = (customer: CustomerResponse) => {
        verifyGate(() => {
            setEditingCustomer(customer)
            setIsModalOpen(true)
        })
    }

    const handleDeleteClick = (id: string, name: string) => {
        setConfirmModalState({ isOpen: true, customerId: id, customerName: name })
    }

    const handleConfirmDelete = async () => {
        const { customerId } = confirmModalState
        if (!customerId) return

        verifyGate(async () => {
            try {
                await deleteCustomer(customerId).unwrap()
                success('Müşteri başarıyla silindi')
                setConfirmModalState({ isOpen: false, customerId: null, customerName: null })
            } catch (err: any) {
                error('Müşteri silinirken hata oluştu')
            }
        })
    }

    const filteredCustomers = customers.filter(customer => {
        const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase()
        return fullName.includes(searchQuery.toLowerCase())
    })

    return (
        <div className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl p-4 shadow-lg">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                        <input
                            type="text"
                            placeholder="Müşteri ara..."
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
                ) : filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-amber-600 mb-4" />
                        <h3 className="text-xl font-semibold text-amber-900 mb-2">
                            {searchQuery ? 'Müşteri Bulunamadı' : 'Henüz Müşteri Eklenmemiş'}
                        </h3>
                        <p className="text-amber-700 mb-6">
                            {searchQuery ? 'Arama sonucu bulunamadı' : 'Hemen bir müşteri ekleyin!'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => {
                                    verifyGate(() => {
                                        setEditingCustomer(null)
                                        setIsModalOpen(true)
                                    })
                                }}
                                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                            >
                                <Plus className="w-4 h-4 inline mr-2" />
                                İlk Müşteriyi Ekle
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Ad Soyad</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Telefon</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Şehir</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="border-b border-amber-100 hover:bg-amber-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-amber-900 font-medium">
                                                {customer.firstName} {customer.lastName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-amber-700">{customer.phone || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-amber-700">{customer.email || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-amber-700">{customer.city || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(customer)}
                                                    className="p-2 hover:bg-amber-100 rounded-lg transition-colors group"
                                                    title="Düzenle"
                                                >
                                                    <Edit className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(customer.id, `${customer.firstName} ${customer.lastName}`)}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
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
            </div>

            {/* Modal */}
            {isModalOpen && (
                <CustomerModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setEditingCustomer(null)
                    }}
                    customer={editingCustomer}
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
                title="Müşteri Silme"
                message={`"${confirmModalState.customerName}" isimli müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
                confirmText="Sil"
                cancelText="İptal"
                type="danger"
            />
        </div>
    )
}
