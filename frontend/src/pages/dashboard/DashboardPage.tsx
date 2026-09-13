import { useEffect } from 'react';
import { useTopbar } from '../../context/TopbarContext';
import { useAppSelector } from '../../hooks/useAuth';
import { LayoutDashboard } from "lucide-react";

// Role Components
import AdminDashboard from './roles/AdminDashboard';
import DirectorDashboard from './roles/DirectorDashboard';
import StoreDashboard from './roles/StoreDashboard';
import StoreManagerDashboard from './roles/StoreManagerDashboard';
import OperationsDashboard from './roles/OperationsDashboard';
import LogisticsDashboard from './roles/LogisticsDashboard';

export default function DashboardPage() {
    const { setTopbarContent } = useTopbar();
    const user = useAppSelector(state => state.auth.user);

    useEffect(() => {
        if (user) {
            setTopbarContent({
                title: `Hoş Geldin, ${user.firstName}`,
                description: 'Günün özetine göz atın ve işlemlerinizi yönetin.',
                icon: <LayoutDashboard className="w-8 h-8" />,
                actions: (
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-amber-900">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-xs text-amber-600 truncate max-w-[200px]">{user.email}</p>
                    </div>
                )
            });
        }
    }, [user, setTopbarContent]);

    if (!user) return <div className="p-8 text-center">Yükleniyor...</div>;

    const renderDashboard = () => {
        switch (user.role) {
            case 'ADMIN':
            case 'MANAGER':
                return <AdminDashboard />;
            case 'DIRECTOR':
                return <DirectorDashboard />;
            case 'STORE_MANAGER':
                return <StoreManagerDashboard />;
            case 'STORE_EMPLOYEE':
                return <StoreDashboard />;
            case 'OPERATIONS_MANAGER':
                return <OperationsDashboard />;
            case 'LOGISTICS_MANAGER':
                return <LogisticsDashboard />;
            default:
                return <StoreDashboard />; // Default fallback
        }
    };

    return (
        <div className="h-full bg-gradient-to-br from-amber-50/50 to-white overflow-hidden flex flex-col">
            {renderDashboard()}
        </div>
    );
}
