import { Box, ShoppingBag, Truck, Users, Plus, FileSpreadsheet, CheckSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { CalendarWidget, MessagesWidget, ShortcutsWidget, StatCard } from "../../../components/dashboard/DashboardWidgets";
import { useGetDashboardStatsQuery } from "../../../services/orderApi";
import AddOrderModal from "../../../components/orders/AddOrderModal";
import BulkUploadModal from "../../../components/orders/BulkUploadModal";
import AddSaleModal from "../../../pages/sales/AddSaleModal";

export default function DirectorDashboard() {
    const { data: statsData } = useGetDashboardStatsQuery();

    // Modal states
    const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
    const [isBulkOrderOpen, setIsBulkOrderOpen] = useState(false);
    const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);

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
        { title: 'Sipariş Ekle', onClick: () => setIsAddOrderOpen(true), icon: Plus, color: 'blue', path: '#' },
        { title: 'Toplu Sipariş Ekle', onClick: () => setIsBulkOrderOpen(true), icon: FileSpreadsheet, color: 'green', path: '#' },
        { title: 'Onay Bekleyen Ürün Kabuller', path: '/order-receipts?status=PENDING_APPROVAL', icon: CheckSquare, color: 'amber' },
        { title: 'Stoklu Satış Oluştur', onClick: () => setIsAddSaleOpen(true), icon: ShoppingBag, color: 'purple', path: '#' },
    ];

    return (
        <div className="flex flex-col gap-1.5 p-1.5 h-[calc(100vh-12rem)] overflow-hidden">
            {/* Main Content Area - Expands to fill available space */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-1.5 min-h-0">
                {/* Left Column: Stats (5 cols) + Calendar */}
                <div className="md:col-span-5 flex flex-col gap-1.5 min-h-0">
                    {/* Stats Grid - Fixed Height relative to content */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 shrink-0">
                        {stats.map((stat, idx) => (
                            <StatCard
                                key={idx}
                                title={stat.title}
                                value={stat.value}
                                subValue={stat.subValue}
                                icon={stat.icon}
                                color={stat.color}
                                trend={stat.trend}
                                // @ts-ignore
                                trendType={stat.trendType}
                            />
                        ))}
                    </div>

                    {/* Calendar - Takes remaining height */}
                    <div className="flex-1 min-h-0">
                        <CalendarWidget />
                    </div>
                </div>

                {/* Right Column: Messages Only (7 cols) - Takes full height */}
                <div className="md:col-span-7 flex flex-col gap-1.5 min-h-0">
                    <div className="flex-1 min-h-0">
                        <MessagesWidget />
                    </div>
                </div>
            </div>

            {/* Bottom Row: Shortcuts (Fixed Height) */}
            <div className="shrink-0">
                <ShortcutsWidget shortcuts={shortcuts} />
            </div>

            {/* Modals */}
            {isAddOrderOpen && (
                <AddOrderModal
                    isOpen={isAddOrderOpen}
                    onClose={() => setIsAddOrderOpen(false)}
                    onSuccess={() => setIsAddOrderOpen(false)}
                />
            )}
            {isBulkOrderOpen && (
                <BulkUploadModal
                    onClose={() => setIsBulkOrderOpen(false)}
                    onSuccess={() => setIsBulkOrderOpen(false)}
                />
            )}
            <AddSaleModal
                isOpen={isAddSaleOpen}
                onClose={() => setIsAddSaleOpen(false)}
            />
        </div>
    );
}
