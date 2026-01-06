import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Plus, FileText, ChevronRight,
    Calendar, User, CreditCard, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetSalesQuery, SaleStatus } from '../../services/saleApi';
import { useGetAllUsersQuery } from '../../services/userApi';
import AddSaleModal from './AddSaleModal';
import { useTopbar } from '../../context/TopbarContext';

const SalesPage: React.FC = () => {
    const navigate = useNavigate();
    const { setTopbarContent } = useTopbar();

    // State
    const [statusFilter, setStatusFilter] = useState<SaleStatus | 'ALL'>('ALL');
    const [consultantFilter, setConsultantFilter] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Queries
    const { data: users } = useGetAllUsersQuery();
    const { data: allSales, isLoading } = useGetSalesQuery({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        consultantId: consultantFilter === 'ALL' ? undefined : consultantFilter
    });

    // Memoized values
    const consultants = useMemo(() => users?.filter(u =>
        ['STORE_EMPLOYEE', 'STORE_MANAGER', 'MANAGER', 'ADMIN'].includes(u.role)
    ) || [], [users]);

    const filteredSales = useMemo(() => {
        if (!allSales) return [];
        return allSales.filter(sale =>
            sale.saleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allSales, searchTerm]);

    // Topbar Configuration
    useEffect(() => {
        setTopbarContent({
            title: 'Satışlar',
            description: 'Müşteri satışlarını yönetin ve takip edin',
            icon: <FileText className="w-8 h-8" />,
            actions: (
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Satış
                </button>
            ),
            filters: (
                <div className="flex items-start gap-6 flex-wrap">
                    {/* Status Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-amber-200 text-sm font-medium">Durum:</span>
                        <button
                            onClick={() => setStatusFilter('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${statusFilter === 'ALL'
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/50'
                                }`}
                        >
                            Tümü
                        </button>
                        {(Object.keys(SaleStatus) as Array<keyof typeof SaleStatus>).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(SaleStatus[status])}
                                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${statusFilter === SaleStatus[status]
                                    ? 'bg-amber-600 text-white shadow-md'
                                    : 'bg-amber-950/40 text-amber-200 hover:bg-amber-900/50'
                                    }`}
                            >
                                {status === 'DEVAM_EDIYOR' ? 'Devam Edenler' :
                                    status === 'TAMAMLANDI' ? 'Tamamlananlar' : 'İptal Edilenler'}
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-px bg-amber-700/30"></div>

                    {/* Consultant Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-amber-200 text-sm font-medium">Danışman:</span>
                        <select
                            value={consultantFilter}
                            onChange={(e) => setConsultantFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-lg text-sm bg-amber-950/40 text-amber-200 border border-amber-700/30 hover:bg-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-all cursor-pointer"
                        >
                            <option value="ALL" className="bg-amber-950 text-amber-200">Tümü</option>
                            {consultants.map(c => (
                                <option key={c.id} value={c.id} className="bg-amber-950 text-amber-200">
                                    {c.firstName} {c.lastName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )
        });
    }, [setTopbarContent, statusFilter, consultantFilter, consultants]);

    const getStatusBadge = (status: SaleStatus) => {
        switch (status) {
            case SaleStatus.TAMAMLANDI:
                return {
                    label: 'Tamamlandı',
                    icon: CheckCircle,
                    className: 'bg-green-100 text-green-800 border-green-400'
                };
            case SaleStatus.IPTAL_EDILDI:
                return {
                    label: 'İptal Edildi',
                    icon: XCircle,
                    className: 'bg-red-100 text-red-800 border-red-400'
                };
            default:
                return {
                    label: 'Devam Ediyor',
                    icon: Clock,
                    className: 'bg-blue-100 text-blue-800 border-blue-400'
                };
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl p-4 shadow-lg">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                    <input
                        type="text"
                        placeholder="Satış No veya Müşteri Adı ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>
            </div>

            {/* Sales Table */}
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl shadow-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-amber-700">Yükleniyor...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-amber-200/50 bg-amber-50/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Satış No</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Müşteri</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Satış Danışmanı</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Tarih</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Tutar</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900">Durum</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-amber-900 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-amber-700">
                                            {searchTerm || statusFilter !== 'ALL' || consultantFilter !== 'ALL'
                                                ? 'Bu kriterlere uygun satış bulunamadı'
                                                : 'Henüz satış bulunmuyor'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale) => {
                                        const statusBadge = getStatusBadge(sale.status);
                                        const StatusIcon = statusBadge.icon;

                                        return (
                                            <tr
                                                key={sale.id}
                                                onClick={() => navigate(`/sales/${sale.id}`)}
                                                className="border-b border-amber-100 hover:bg-amber-50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="text-amber-900 font-medium font-mono">{sale.saleNo}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-amber-400" />
                                                        <span className="text-amber-900">{sale.customerName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-amber-700">{sale.salesConsultantName}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-amber-700">
                                                        <Calendar className="w-4 h-4 text-amber-400" />
                                                        {new Date(sale.saleDate).toLocaleDateString('tr-TR')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 font-medium text-amber-900">
                                                        <CreditCard className="w-4 h-4 text-amber-400" />
                                                        {sale.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-lg text-sm font-medium border flex items-center gap-2 w-fit ${statusBadge.className}`}>
                                                        <StatusIcon className="w-4 h-4" />
                                                        {statusBadge.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <ChevronRight className="w-5 h-5 text-amber-300 group-hover:text-amber-500 transition-colors" />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AddSaleModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </div>
    );
};

export default SalesPage;
