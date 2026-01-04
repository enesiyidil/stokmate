import { useEffect } from 'react'
import { User as UserIcon, Mail, Shield, Phone, MapPin } from 'lucide-react'
import { useTopbar } from '../context/TopbarContext'
import { useAppSelector } from '../hooks/useAuth'

export default function ProfilePage() {
    const { setTopbarContent } = useTopbar()
    const user = useAppSelector(state => state.auth.user)

    useEffect(() => {
        setTopbarContent({
            title: 'Profilim',
            description: 'Profil bilgilerinizi görüntüleyin',
            icon: <UserIcon className="w-8 h-8" />,
        })
    }, [setTopbarContent])

    return (
        <div className="p-6 space-y-6">
            {/* Profile Card */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-700 to-orange-700 rounded-2xl flex items-center justify-center shadow-lg">
                        <UserIcon className="w-12 h-12 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-amber-900 mb-2">
                            {user?.firstName && user?.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user?.email}
                        </h2>
                        <p className="text-amber-700 font-medium">
                            {user?.role === 'ADMIN' ? 'Admin' :
                                user?.role === 'MUDUR' ? 'Müdür' :
                                    user?.role === 'DEPO_SORUMLU' ? 'Depo Sorumlu' :
                                        user?.role === 'DEPO_CALISAN' ? 'Depo Çalışan' :
                                            user?.role === 'MAGAZA_SORUMLU' ? 'Mağaza Sorumlu' :
                                                user?.role === 'MAGAZA_CALISAN' ? 'Mağaza Çalışan' : user?.role}
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="w-12 h-12 bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-center">
                            <Mail className="w-6 h-6 text-blue-700" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Email</p>
                            <p className="text-amber-900 font-semibold">{user?.email}</p>
                        </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="w-12 h-12 bg-purple-100 border border-purple-300 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6 text-purple-700" />
                        </div>
                        <div>
                            <p className="text-sm text-amber-600 font-medium">Rol</p>
                            <p className="text-amber-900 font-semibold">
                                {user?.role === 'ADMIN' ? 'Admin' :
                                    user?.role === 'MUDUR' ? 'Müdür' :
                                        user?.role === 'DEPO_SORUMLU' ? 'Depo Sorumlu' :
                                            user?.role === 'DEPO_CALISAN' ? 'Depo Çalışan' :
                                                user?.role === 'MAGAZA_SORUMLU' ? 'Mağaza Sorumlu' :
                                                    user?.role === 'MAGAZA_CALISAN' ? 'Mağaza Çalışan' : user?.role}
                            </p>
                        </div>
                    </div>

                    {/* Phone (if available) */}
                    {user?.phone && (
                        <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="w-12 h-12 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center">
                                <Phone className="w-6 h-6 text-green-700" />
                            </div>
                            <div>
                                <p className="text-sm text-amber-600 font-medium">Telefon</p>
                                <p className="text-amber-900 font-semibold">{user.phone}</p>
                            </div>
                        </div>
                    )}

                    {/* Address (if available) */}
                    {user?.address && (
                        <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="w-12 h-12 bg-orange-100 border border-orange-300 rounded-lg flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-orange-700" />
                            </div>
                            <div>
                                <p className="text-sm text-amber-600 font-medium">Adres</p>
                                <p className="text-amber-900 font-semibold">{user.address}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
