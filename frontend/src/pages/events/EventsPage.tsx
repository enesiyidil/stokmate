import { useState } from 'react';
import { useGetBusinessActivitiesQuery } from '../../services/orderApi';
import { useTopbar } from '../../context/TopbarContext';
import { useEffect } from 'react';
import { Bell, ChevronLeft, ChevronRight, Package, Truck, AlertTriangle, FileText, Repeat, Wallet } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import FilterSearchBar from '../../components/common/FilterSearchBar';
import { Link } from 'react-router-dom';

export function EventsPage() {
    const { setTopbarContent } = useTopbar();
    const [page, setPage] = useState(0);
    const [pageSize] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('');

    // Fetch data
    const { data: activitiesData, isLoading } = useGetBusinessActivitiesQuery({
        page,
        size: pageSize,
        search: searchQuery || undefined,
        category: selectedType || undefined
    });

    const activities = activitiesData?.content || [];
    const totalPages = activitiesData?.totalPages || 0;

    useEffect(() => {
        setTopbarContent({
            title: 'Sistem Olayları',
            description: 'Tüm sipariş ve satış aktivitelerini görüntüleyin',
            icon: <Bell className="w-8 h-8 text-amber-500" />,
            showFiltersInTopbar: false, // Don't show filters in topbar
            filters: null // Explicitly clear filters
        });
        return () => setTopbarContent(null);
    }, [setTopbarContent]);


    // Helper to get icon and color based on type
    const getActivityConfig = (domain: string, type: string) => {
        if (domain === 'SALE') return { icon: Package, color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Satış İşlemi' };

        if (type.includes('ORDER')) return { icon: Package, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Sipariş' };
        if (type.includes('SHIPMENT')) return { icon: Truck, color: 'text-green-600 bg-green-50 border-green-200', label: 'Sevkiyat' };
        if (type.includes('CROSS_CONVERSION')) return { icon: Repeat, color: 'text-orange-600 bg-orange-50 border-orange-200', label: 'Çapraz Dönüştürme' };
        if (type.includes('NOTE')) return { icon: FileText, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Not' };
        if (type.includes('ALERT')) return { icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200', label: 'Uyarı' };
        if (domain === 'BALANCE') return { icon: Wallet, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Bakiye İşlemi' };
        return { icon: Bell, color: 'text-gray-600 bg-gray-50 border-gray-200', label: 'Sistem' };
    };

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <FilterSearchBar
                searchPlaceholder="Kullanıcı, açıklama veya referans no ara..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                filters={[
                    {
                        label: 'Kategori',
                        value: selectedType,
                        onChange: setSelectedType,
                        options: [
                            { key: '', label: 'Tümü' },
                            { key: 'ORDER', label: 'Siparişler' },
                            { key: 'SALE', label: 'Satışlar' },
                            { key: 'CROSS_CONVERSION', label: 'Çapraz Dönüştürme' },
                            { key: 'BALANCE', label: 'Bakiye Defteri' }
                        ]
                    }
                ]}
            />

            {/* Content Card */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-lg overflow-hidden backdrop-blur-md bg-opacity-90">

                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">Yükleniyor...</div>
                ) : activities.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Kayıt Bulunamadı</h3>
                        <p className="text-sm text-gray-500 mt-1">Arama kriterlerinize uygun olay bulunmamaktadır.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-amber-50/50 border-b border-amber-100/50 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                        <th className="px-6 py-4">Kullanıcı</th>
                                        <th className="px-6 py-4">İşlem Türü</th>
                                        <th className="px-6 py-4">Açıklama</th>
                                        <th className="px-6 py-4">İlgili Kayıt</th>
                                        <th className="px-6 py-4 text-right">Zaman</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {activities.map((activity) => {
                                        const config = getActivityConfig(activity.domain, activity.activityType);
                                        const Icon = config.icon;
                                        return (
                                            <tr key={activity.id} className="hover:bg-amber-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                            {(activity.userFullName ?? '?').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{activity.userFullName ?? 'Bilinmeyen Kullanıcı'}</div>
                                                            <div className="text-xs text-gray-500">{activity.userEmail}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${config.color} text-xs font-medium`}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                        {config.label}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-700 font-medium">{activity.description}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {activity.referenceNo ? (
                                                        <Link
                                                            to={activity.domain === 'SALE' ? `/sales/${activity.referenceId}` : `/orders/${activity.referenceId}`}
                                                            state={{ from: '/events' }}
                                                            className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-amber-700 rounded text-xs font-mono transition-colors"
                                                        >
                                                            #{activity.referenceNo}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-sm text-gray-500 font-medium">
                                                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr })}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                                        {new Date(activity.createdAt).toLocaleString('tr-TR')}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                                <div className="text-sm text-gray-500">
                                    Toplam <span className="font-medium text-gray-900">{activitiesData?.totalElements}</span> kayıttan <span className="font-medium text-gray-900">{(page * pageSize) + 1}</span> - <span className="font-medium text-gray-900">{Math.min((page + 1) * pageSize, activitiesData?.totalElements || 0)}</span> arası gösteriliyor
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-white hover:border-amber-300 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <span className="text-sm font-medium text-gray-700 px-2">
                                        Sayfa {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-white hover:border-amber-300 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-gray-200 transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >
    );
}
