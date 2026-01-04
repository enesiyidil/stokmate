import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
    Package,
    LayoutDashboard,
    ShoppingCart,
    ClipboardCheck,
    ShoppingBag,
    TruckIcon,
    Users,
    Store,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    User,
    Bell,
    UserCircle,
    MessageSquare
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../hooks/useAuth'
import { logout } from '../../store/authSlice'
import { TopbarProvider, useTopbar } from '../../context/TopbarContext'
import { useUi } from '../../context/UiContext'

interface MenuItem {
    name: string
    icon: typeof LayoutDashboard
    path: string
    roles?: string[]
}

const menuItems: MenuItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    {
        name: 'Siparişler',
        icon: ShoppingCart,
        path: '/orders',
        roles: ['ADMIN', 'MUDUR', 'DEPO_SORUMLU', 'DEPO_CALISAN']
    },
    {
        name: 'Ürün Kabuller',
        icon: ClipboardCheck,
        path: '/order-receipts',
        roles: ['ADMIN', 'MUDUR', 'DEPO_SORUMLU']
    },
    { name: 'Ürünler', icon: Package, path: '/products' },
    { name: 'Satışlar', icon: ShoppingBag, path: '/sales' },
    {
        name: 'Sevkiyat',
        icon: TruckIcon,
        path: '/shipment',
        roles: ['ADMIN', 'MUDUR', 'DEPO_SORUMLU', 'DEPO_CALISAN', 'MAGAZA_SORUMLU', 'MAGAZA_CALISAN']
    },
    {
        name: 'Talepler',
        icon: MessageSquare,
        path: '/requests',
        roles: ['ADMIN', 'MUDUR', 'DEPO_SORUMLU', 'MAGAZA_SORUMLU']
    },
    {
        name: 'Müşteriler',
        icon: UserCircle,
        path: '/customers',
        roles: ['ADMIN', 'MUDUR', 'DEPO_SORUMLU', 'MAGAZA_SORUMLU']
    },
    {
        name: 'Kullanıcılar',
        icon: Users,
        path: '/users',
        roles: ['ADMIN', 'MUDUR']
    },
    {
        name: 'Mağazalar',
        icon: Store,
        path: '/stores',
        roles: ['ADMIN', 'MUDUR']
    },
    {
        name: 'Araçlar',
        icon: TruckIcon,
        path: '/vehicles',
        roles: ['ADMIN', 'MUDUR', 'DEPO_SORUMLU']
    },
    {
        name: 'Raporlar',
        icon: FileText,
        path: '/reports',
        roles: ['ADMIN', 'MUDUR']
    },
]

interface SidebarLayoutProps {
    children: ReactNode
}

function SidebarLayoutContent({ children }: SidebarLayoutProps) {
    const { currentBg, logo } = useUi()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const user = useAppSelector(state => state.auth.user)
    const { title, description, icon, actions, filters, showFiltersInTopbar } = useTopbar()

    const handleLogout = () => {
        dispatch(logout())
        navigate('/login')
    }

    const userRole = user?.role || ''
    const filteredMenuItems = menuItems.filter(item =>
        !item.roles || item.roles.includes(userRole)
    )

    const handleUserMenuClick = (path: string) => {
        setShowUserMenu(false)
        navigate(path)
    }

    return (
        <div className="min-h-screen relative">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
                    style={{ backgroundImage: `url(${currentBg})` }}
                />
                <div className="absolute inset-0 bg-stone-900/40" /> {/* Dark overlay for readability, no blur */}
            </div>

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
                <div className="h-full backdrop-blur-md bg-stone-900/90 border-r border-amber-700/30 shadow-2xl flex flex-col">
                    {/* Logo Section */}
                    <div className="p-6 border-b border-amber-600/30 h-[105px] flex items-center">
                        <div className="flex items-center gap-3 w-full">
                            <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden border border-white/20 p-2">
                                <img src={logo} alt="StokMate Logo" className="w-full h-full object-contain" />
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 animate-fade-in">
                                    <h1 className="text-xl font-bold text-amber-100 flex items-center gap-1">
                                        StokMate
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                    </h1>
                                    <p className="text-xs text-amber-300">Stok Yönetimi</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 overflow-y-auto">
                        <div className="space-y-2">
                            {filteredMenuItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `
                                        group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                                        ${isActive
                                            ? 'bg-gradient-to-r from-amber-700/50 to-orange-700/50 text-white shadow-lg border border-amber-600/40'
                                            : 'text-amber-100 hover:bg-amber-800/40 hover:text-white'
                                        }
                                        ${isCollapsed ? 'justify-center' : ''}
                                    `}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    {!isCollapsed && (
                                        <span className="font-medium animate-fade-in">{item.name}</span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-amber-600/30">
                        {/* User Info & Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className={`
                                    w-full backdrop-blur-sm bg-amber-900/40 border border-amber-600/50 rounded-xl p-3
                                    hover:bg-amber-800/50 transition-all duration-300
                                    ${isCollapsed ? 'flex justify-center' : 'flex items-center gap-3'}
                                `}
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-700 to-orange-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                {!isCollapsed && (
                                    <div className="flex-1 text-left animate-fade-in">
                                        <p className="text-sm font-semibold text-amber-50 truncate">
                                            {user?.firstName && user?.lastName
                                                ? `${user.firstName} ${user.lastName}`
                                                : user?.email?.split('@')[0]
                                            }
                                        </p>
                                        <p className="text-xs text-amber-200">
                                            {user?.role === 'ADMIN' ? 'Admin' :
                                                user?.role === 'MUDUR' ? 'Müdür' :
                                                    user?.role === 'DEPO_SORUMLU' ? 'Depo Sorumlu' :
                                                        user?.role === 'DEPO_CALISAN' ? 'Depo Çalışan' :
                                                            user?.role === 'MAGAZA_SORUMLU' ? 'Mağaza Sorumlu' :
                                                                user?.role === 'MAGAZA_CALISAN' ? 'Mağaza Çalışan' : user?.role}
                                        </p>
                                    </div>
                                )}
                            </button>

                            {/* User Menu Dropdown */}
                            {showUserMenu && !isCollapsed && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 backdrop-blur-sm bg-stone-900/98 border border-amber-600/50 rounded-xl shadow-2xl overflow-hidden animate-slide-up z-50">
                                    <button
                                        onClick={() => handleUserMenuClick('/profile')}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-amber-200 hover:bg-amber-800/50 hover:text-amber-50 transition-all duration-300"
                                    >
                                        <UserCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">Profilim</span>
                                    </button>
                                    <button
                                        onClick={() => handleUserMenuClick('/settings')}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-amber-200 hover:bg-amber-800/50 hover:text-amber-50 transition-all duration-300 border-t border-amber-600/40"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span className="text-sm font-medium">Ayarlar</span>
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-amber-200 hover:bg-red-800/40 hover:text-red-200 transition-all duration-300 border-t border-amber-600/40"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="text-sm font-medium">Çıkış Yap</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="absolute -right-3 top-20 w-6 h-6 bg-gradient-to-br from-amber-700 to-orange-700 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-white" />
                        ) : (
                            <ChevronLeft className="w-4 h-4 text-white" />
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
                <header className="sticky top-0 z-40 backdrop-blur-md bg-stone-900/80 border-b border-amber-700/40 h-[105px] flex items-center shadow-lg">
                    <div className="px-8 w-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {showFiltersInTopbar && filters && (
                                    <>
                                        <div className="flex gap-2">{filters}</div>
                                        <div className="h-8 w-px bg-amber-600/50" />
                                    </>
                                )}
                                {icon && <div className="text-amber-400">{icon}</div>}
                                <div>
                                    <h2 className="text-2xl font-bold text-amber-100">{title}</h2>
                                    <p className="text-sm text-amber-300 mt-1">{description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {actions}
                                <button className="relative p-2 text-amber-300 hover:text-amber-100 transition-colors">
                                    <Bell className="w-6 h-6" />
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Filter Bar - Only show if not in topbar */}
                {!showFiltersInTopbar && filters && (
                    <div className="sticky top-[105px] z-30 backdrop-blur-sm bg-stone-900/60 border-b border-amber-700/40">
                        <div className="px-8 py-3">
                            <div className="flex gap-2 flex-wrap">
                                {filters}
                            </div>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
    return (
        <TopbarProvider>
            <SidebarLayoutContent>{children}</SidebarLayoutContent>
        </TopbarProvider>
    )
}
