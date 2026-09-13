import { BarChart3, Box, Settings, ShoppingBag, Truck, UserPlus, Users } from "lucide-react";
import { useMemo } from "react";
import { CalendarWidget, EventsWidget, MessagesWidget, ShortcutsWidget, StatCard } from "../../../components/dashboard/DashboardWidgets";
import { useGetDashboardStatsQuery, useGetRecentSystemActivitiesQuery } from "../../../services/orderApi";
// Removed unused imports
import { useGetApprovedShipmentsQuery, useListPendingShipmentsQuery, useListReadyShipmentsQuery } from "../../../services/shipmentApi";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export default function AdminDashboard() {
    // 1. Dashboard Stats (Real Data)
    const { data: statsData } = useGetDashboardStatsQuery();

    // 4. Shipments (Only for list combining, if needed)
    const { data: approvedShipments = [] } = useGetApprovedShipmentsQuery();
    const { data: pendingShipments = [] } = useListPendingShipmentsQuery();
    const { data: readyShipments = [] } = useListReadyShipmentsQuery();

    // Recent System Activities
    const { data: recentActivities = [] } = useGetRecentSystemActivitiesQuery(undefined, {
        pollingInterval: 30000
    });

    const stats = useMemo(() => {
        if (!statsData) return [
            { title: 'Toplam Sipariş', value: '...', subValue: 'Yükleniyor...', icon: ShoppingBag, color: 'blue', trend: '', trendType: 'neutral' },
            { title: 'Toplam Ciro', value: '...', subValue: 'Yükleniyor...', icon: Box, color: 'green', trend: '', trendType: 'neutral' },
            { title: 'Aktif Personel', value: '...', subValue: 'Yükleniyor...', icon: Users, color: 'purple', trend: '', trendType: 'neutral' },
            { title: 'Toplam Sevkiyat', value: '...', subValue: 'Yükleniyor...', icon: Truck, color: 'amber', trend: '', trendType: 'neutral' },
        ];

        return [
            {
                title: 'Toplam Sipariş',
                value: statsData.totalOrders?.value || '0',
                subValue: statsData.totalOrders?.subValue || '0',
                icon: ShoppingBag,
                color: 'blue',
                trend: statsData.totalOrders?.trend || '',
                trendType: statsData.totalOrders?.trendType || 'neutral'
            },
            {
                title: 'Aktif Personel',
                value: statsData.activeStaff?.value || '0',
                subValue: statsData.activeStaff?.subValue || '0',
                icon: Users,
                color: 'purple',
                trend: statsData.activeStaff?.trend || '',
                trendType: statsData.activeStaff?.trendType || 'neutral'
            },
            {
                title: 'Toplam Sevkiyat',
                value: statsData.totalShipments?.value || '0',
                subValue: statsData.totalShipments?.subValue || '0',
                icon: Truck,
                color: 'amber',
                trend: statsData.totalShipments?.trend || '',
                trendType: statsData.totalShipments?.trendType || 'neutral'
            },
            {
                title: 'Stoklu Satışlar',
                value: statsData.totalSales?.value || '0',
                subValue: statsData.totalSales?.subValue || '0',
                icon: Box,
                color: 'green',
                trend: statsData.totalSales?.trend || '',
                trendType: statsData.totalSales?.trendType || 'neutral'
            },
        ];
    }, [statsData]);

    const shortcuts = [
        { title: 'Yeni Sipariş', path: '/orders', icon: ShoppingBag, color: 'blue' },
        { title: 'Yeni Kullanıcı', path: '/users', icon: UserPlus, color: 'purple' },
        { title: 'Ürün Yönetimi', path: '/products', icon: Box, color: 'amber' },
        { title: 'Sevkiyat Planla', path: '/shipment/operations', icon: Truck, color: 'green' },
        { title: 'Raporlar', path: '/reports', icon: BarChart3, color: 'red' },
        { title: 'Ayarlar', path: '/settings', icon: Settings, color: 'gray' },
    ];

    // Map recent activities to widget format
    const events = useMemo(() => {
        return recentActivities.map(activity => {
            let type: 'order' | 'shipment' | 'system' | 'alert' = 'system';

            if (activity.activityType.includes('ORDER')) type = 'order';
            else if (activity.activityType.includes('SHIPMENT')) type = 'shipment';
            else if (activity.activityType.includes('NOTE')) type = 'alert';

            return {
                id: activity.id,
                title: activity.userFullName, // Show user who did it
                description: activity.description, // What they did
                time: formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr }),
                type: type
            };
        });
    }, [recentActivities]);

    return (
        <div className="flex flex-col gap-1.5 p-1.5 h-[calc(100vh-12rem)] overflow-hidden">
            {/* Main Content Area - Expands to fill available space */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-1.5 min-h-0">
                {/* Left Column: Stats (7 cols) + Messages */}
                <div className="md:col-span-7 flex flex-col gap-1.5 min-h-0">
                    {/* Stats Grid - Fixed Height relative to content */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5 shrink-0">
                        {stats.map((stat, idx) => (
                            <StatCard
                                key={idx}
                                title={stat.title}
                                value={stat.value}
                                // @ts-ignore
                                subValue={stat.subValue}
                                icon={stat.icon}
                                color={stat.color}
                                trend={stat.trend}
                                // @ts-ignore
                                trendType={stat.trendType}
                            />
                        ))}
                    </div>

                    {/* Messages - Takes remaining height */}
                    <div className="flex-1 min-h-0">
                        <MessagesWidget />
                    </div>
                </div>

                {/* Right Column: Calendar (5 cols) + Events */}
                <div className="md:col-span-5 flex flex-col gap-1.5 min-h-0">
                    {/* Calendar - Auto height */}
                    <div className="shrink-0">
                        <CalendarWidget />
                    </div>

                    {/* Events - Takes remaining height */}
                    <div className="flex-1 min-h-0">
                        {/* @ts-ignore */}
                        <EventsWidget events={events} />
                    </div>
                </div>
            </div>

            {/* Bottom Row: Shortcuts (Fixed Height) */}
            <div className="shrink-0">
                <ShortcutsWidget shortcuts={shortcuts} />
            </div>
        </div>
    );
}
