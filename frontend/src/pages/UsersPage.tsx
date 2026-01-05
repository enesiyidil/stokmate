import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Mail, User, AlertCircle, Power, Shield } from 'lucide-react'
import { useGetAllUsersQuery, useDeleteUserMutation, useToggleUserActiveMutation } from '../services/userApi'
import AddUserModal from '../components/users/AddUserModal'
import EditUserRoleModal from '../components/users/EditUserRoleModal'
import DeleteUserModal from '../components/users/DeleteUserModal'
import ConfirmToggleActiveModal from '../components/users/ConfirmToggleActiveModal'
import { useTopbar } from '../context/TopbarContext'

export default function UsersPage() {
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditRoleModal, setShowEditRoleModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showToggleActiveModal, setShowToggleActiveModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)

    const { setTopbarContent } = useTopbar()
    const { data: users = [], isLoading } = useGetAllUsersQuery()
    const [deleteUser] = useDeleteUserMutation()
    const [toggleUserActive] = useToggleUserActiveMutation()

    // Set topbar content
    useEffect(() => {
        setTopbarContent({
            title: 'Kullanıcı Yönetimi',
            description: 'Kullanıcıları görüntüleyin ve yönetin',
            icon: <Users className="w-8 h-8" />,
            actions: (
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Kullanıcı
                </button>
            )
        })
    }, [setTopbarContent])

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return

        try {
            await deleteUser(id).unwrap()
        } catch (error) {
            console.error('Failed to delete user:', error)
            alert('Kullanıcı silinirken bir hata oluştu')
        }
    }

    const handleToggleActive = (user: any) => {
        setSelectedUser(user)
        setShowToggleActiveModal(true)
    }

    const handleConfirmToggleActive = async () => {
        if (!selectedUser) return

        try {
            await toggleUserActive({ id: selectedUser.id, active: !selectedUser.active }).unwrap()
            setShowToggleActiveModal(false)
            setSelectedUser(null)
        } catch (error) {
            console.error('Failed to toggle user active:', error)
            alert('Kullanıcı durumu değiştirilirken bir hata oluştu')
        }
    }

    const handleEditRole = (user: any) => {
        setSelectedUser(user)
        setShowEditRoleModal(true)
    }

    const handleSoftDelete = (user: any) => {
        setSelectedUser(user)
        setShowDeleteModal(true)
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'Admin'
            case 'MANAGER':
                return 'Craft (Yönetici)'
            case 'DIRECTOR':
                return 'Direktör'
            case 'OPERATIONS_MANAGER':
                return 'Operasyon Yöneticisi'
            case 'LOGISTICS_MANAGER':
                return 'Lojistik Yöneticisi'
            case 'STORE_MANAGER':
                return 'Mağaza Sorumlusu'
            case 'STORE_EMPLOYEE':
                return 'Mağaza Çalışanı'
            default:
                return role
        }
    }

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-purple-100 text-purple-800 border-purple-400'
            case 'MANAGER':
            case 'DIRECTOR':
                return 'bg-indigo-100 text-indigo-800 border-indigo-400'
            case 'OPERATIONS_MANAGER':
            case 'LOGISTICS_MANAGER':
                return 'bg-blue-100 text-blue-800 border-blue-400'
            case 'STORE_MANAGER':
            case 'STORE_EMPLOYEE':
                return 'bg-green-100 text-green-800 border-green-400'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-400'
        }
    }

    return (
        <div className="p-6 space-y-6">

            {/* Users Table */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl overflow-hidden shadow-xl">
                {isLoading ? (
                    <div className="p-12 text-center text-amber-700">Yükleniyor...</div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <AlertCircle className="w-16 h-16 text-amber-600 mb-4" />
                        <h3 className="text-xl font-semibold text-amber-900 mb-2">Kullanıcı Bulunamadı</h3>
                        <p className="text-amber-700 mb-6">Henüz eklenmiş kullanıcı yok. Hemen bir kullanıcı ekleyin!</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                        >
                            <Plus className="w-4 h-4 inline mr-2" />
                            İlk Kullanıcıyı Ekle
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Kullanıcı</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Rol</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Durum</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-amber-100 hover:bg-amber-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 ${user.deleted ? 'bg-gradient-to-br from-gray-500 to-gray-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'} rounded-lg flex items-center justify-center`}>
                                                    <User className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-amber-900 font-medium">
                                                        {user.displayName || (user.firstName && user.lastName
                                                            ? `${user.firstName} ${user.lastName}`
                                                            : user.email.split('@')[0])}
                                                    </p>
                                                    {user.phone && (
                                                        <p className="text-xs text-amber-700">{user.phone}</p>
                                                    )}
                                                    {user.deleted && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-800 border border-gray-400 rounded">
                                                            SİLİNDİ
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-amber-700">
                                                <Mail className="w-4 h-4" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getRoleBadgeClass(user.role)}`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${user.active
                                                ? 'bg-green-100 text-green-800 border-green-400'
                                                : 'bg-red-100 text-red-800 border-red-400'
                                                }`}>
                                                {user.active ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {!user.deleted && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditRole(user)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Rol Değiştir"
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleActive(user)}
                                                            className={`p-2 ${user.active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'} rounded-lg transition-colors`}
                                                            title={user.active ? 'Pasif Yap' : 'Aktif Yap'}
                                                        >
                                                            <Power className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSoftDelete(user)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Sil"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <AddUserModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false)
                    }}
                />
            )}

            {/* Edit Role Modal */}
            {showEditRoleModal && selectedUser && (
                <EditUserRoleModal
                    user={selectedUser}
                    onClose={() => {
                        setShowEditRoleModal(false)
                        setSelectedUser(null)
                    }}
                />
            )}

            {/* Delete User Modal */}
            {showDeleteModal && selectedUser && (
                <DeleteUserModal
                    user={selectedUser}
                    onClose={() => {
                        setShowDeleteModal(false)
                        setSelectedUser(null)
                    }}
                />
            )}

            {/* Confirm Toggle Active Modal */}
            {showToggleActiveModal && selectedUser && (
                <ConfirmToggleActiveModal
                    user={selectedUser}
                    onClose={() => {
                        setShowToggleActiveModal(false)
                        setSelectedUser(null)
                    }}
                    onConfirm={handleConfirmToggleActive}
                />
            )}
        </div>
    )
}
