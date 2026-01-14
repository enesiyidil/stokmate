import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, FileText, ChevronRight,
    Calendar, User, CreditCard, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetSalesQuery, SaleStatus } from '../../services/saleApi';
import { useGetUserSummariesQuery } from '../../services/userApi';
import AddSaleModal from './AddSaleModal';
import { useTopbar } from '../../context/TopbarContext';
import FilterSearchBar from '../../components/common/FilterSearchBar';

const SalesPage: React.FC = () => {
    const navigate = useNavigate();
    const { setTopbarContent } = useTopbar();

    // State
    const [statusFilter, setStatusFilter] = useState<SaleStatus | 'ALL'>('ALL');
    const [consultantFilter, setConsultantFilter] = useState<string>('ALL');
    const [brandFilter, setBrandFilter] = useState<'ALL' | 'OAK' | 'MAPLE' | 'PINE' | 'MARKASIZ'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    // Queries
    const { data: users } = useGetUserSummariesQuery();
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
        return allSales.filter(sale => {
            // Search filter - includes product name/code, consultant name
            if (searchTerm.trim()) {
                const query = searchTerm.toLocaleLowerCase('tr-TR');
                const matchesSaleNo = sale.saleNo.toLocaleLowerCase('tr-TR').includes(query);
                const matchesContractNo = sale.contractNo?.toLocaleLowerCase('tr-TR').includes(query);
                const matchesCustomer = sale.customerName.toLocaleLowerCase('tr-TR').includes(query);
                const matchesConsultant = sale.salesConsultantName?.toLocaleLowerCase('tr-TR').includes(query);
                const matchesProduct = sale.products?.some((p) =>
                    p.productName?.toLocaleLowerCase('tr-TR').includes(query) ||
                    p.productCode?.toLocaleLowerCase('tr-TR').includes(query) ||
                    p.brand?.toLocaleLowerCase('tr-TR').includes(query)
                );
                if (!matchesSaleNo && !matchesContractNo && !matchesCustomer && !matchesConsultant && !matchesProduct) return false;
            }

            // Brand filter - filter by products' brands
            if (brandFilter !== 'ALL') {
                const hasMatchingBrand = sale.products?.some((p) => {
                    if (brandFilter === 'MARKASIZ') {
                        return !p.brand || p.brand === '';
                    }
                    return p.brand === brandFilter;
                });
                if (!hasMatchingBrand) return false;
            }

            return true;
        });
    }, [allSales, searchTerm, brandFilter]);

    // Topbar Configuration
    useEffect(() => {
        setTopbarContent({
            title: 'Stoklu Satışlar',
            description: 'Stoklu satışlarınızı yönetin ve takip edin',
            icon: <FileText className="w-8 h-8" />,
            actions: (
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Satış
                </button>
            )
        });
    }, [setTopbarContent]);

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
            {/* Filter and Search Bar */}
            <FilterSearchBar
                filters={[
                    {
                        label: 'Durum',
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'DEVAM_EDIYOR', label: 'Devam Edenler', activeColor: 'bg-blue-600' },
                            { key: 'TAMAMLANDI', label: 'Tamamlananlar', activeColor: 'bg-green-600' },
                            { key: 'IPTAL_EDILDI', label: 'İptal Edilenler', activeColor: 'bg-red-600' }
                        ]
                    },
                    {
                        label: 'Danışman',
                        value: consultantFilter,
                        onChange: setConsultantFilter,
                        type: 'dropdown',
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            ...consultants.map(c => ({ key: c.id, label: `${c.firstName} ${c.lastName}` }))
                        ]
                    },
                    {
                        label: 'Marka',
                        value: brandFilter,
                        onChange: setBrandFilter,
                        options: [
                            { key: 'ALL', label: 'Tümü' },
                            { key: 'OAK', label: 'Doğtaş', activeColor: 'bg-red-600' },
                            { key: 'MAPLE', label: 'Maple', activeColor: 'bg-blue-600' },
                            { key: 'PINE', label: 'Pine', activeColor: 'bg-purple-600' },
                            { key: 'MARKASIZ', label: 'Markasız', activeColor: 'bg-gray-600' }
                        ]
                    }
                ]}
                searchPlaceholder="Satış no, sözleşme no, müşteri adı, danışman adı, ürün adı veya kodu..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
            />

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
