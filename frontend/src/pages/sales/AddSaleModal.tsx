
import React, { useState } from 'react';
import { X, Plus, Trash2, FileText, User as UserIcon, Calendar, Save, AlertCircle } from 'lucide-react';
import { useCreateSaleMutation, type SaleRequest, type SaleProductRequest } from '../../services/saleApi';
import { useListCustomersQuery } from '../../services/customerApi';

import ProductSearchModal from './ProductSearchModal';
import type { ProductResponse } from '../../services/productApi';
import { useAppSelector } from '../../hooks/useAuth';

interface AddSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Helper to extend SaleProductRequest with display name for UI only
interface UIProductRequest extends SaleProductRequest {
    _displayName?: string;
}

const AddSaleModal: React.FC<AddSaleModalProps> = ({ isOpen, onClose }) => {
    const { user: currentUser } = useAppSelector(state => state.auth);
    const [createSale, { isLoading }] = useCreateSaleMutation();
    const { data: customers } = useListCustomersQuery();


    const [formData, setFormData] = useState<Omit<Partial<SaleRequest>, 'products'> & { products: UIProductRequest[] }>({
        saleDate: new Date().toISOString().split('T')[0],
        products: [],
        salesConsultantId: currentUser?.id
    });

    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);



    const handleAddProduct = (product: ProductResponse) => {
        const newProduct: UIProductRequest = {
            productId: product.id,
            quantity: 1,
            unitPriceExcludingVat: 0, // Manual entry required
            vatRate: 0,
            internetSalesPrice: 0, // Manual entry required
            _displayName: product.name + ' (' + product.code + ')'
        };

        setFormData(prev => ({
            ...prev,
            products: [...(prev.products || []), newProduct]
        }));
        setIsProductSearchOpen(false);
    };

    const handleRemoveProduct = (index: number) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products?.filter((_, i) => i !== index)
        }));
    };

    const updateProduct = (index: number, field: keyof SaleProductRequest, value: number) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products?.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const calculateTotal = () => {
        return formData.products?.reduce((sum, item) => {
            const subtotal = item.quantity * item.unitPriceExcludingVat;
            const vat = subtotal * item.vatRate;
            return sum + subtotal + vat;
        }, 0) || 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.customerId || !formData.products?.length) return;

            // Remove UI only properties before sending
            const productsToSend = formData.products.map(({ _displayName, ...rest }) => rest);
            const requestData = { ...formData, products: productsToSend } as SaleRequest;

            await createSale(requestData).unwrap();
            onClose();
            // Reset form could be here
        } catch (error) {
            console.error('Failed to create sale', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-7xl my-8 flex flex-col shadow-2xl border border-amber-100 max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-amber-100 flex justify-between items-center bg-amber-50/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-amber-900 font-display">Yeni Satış Oluştur</h2>
                        <p className="text-amber-600 mt-1">Müşteri sipariş detayı ve ürün girişi</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-full text-amber-500 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">

                    {/* Top Row: Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-amber-900 flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-amber-500" />
                                Müşteri
                            </label>
                            <select
                                required
                                className="w-full p-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 text-amber-900"
                                value={formData.customerId || ''}
                                onChange={e => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                            >
                                <option value="">Müşteri Seçin</option>
                                {customers?.map(c => (
                                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                ))}
                            </select>
                        </div>



                        <div className="space-y-2">
                            <label className="text-sm font-medium text-amber-900 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-amber-500" />
                                Satış Tarihi
                            </label>
                            <input
                                type="date"
                                required
                                className="w-full p-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 text-amber-900"
                                value={formData.saleDate}
                                onChange={e => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-amber-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-500" />
                                Sözleşme No
                            </label>
                            <input
                                type="text"
                                placeholder="Opsiyonel"
                                className="w-full p-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 text-amber-900"
                                value={formData.contractNo || ''}
                                onChange={e => setFormData(prev => ({ ...prev, contractNo: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-amber-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-500" />
                                Notlar
                            </label>
                            <input
                                type="text"
                                placeholder="Satış ile ilgili notlar..."
                                className="w-full p-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 text-amber-900"
                                value={formData.notes || ''}
                                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-amber-600" />
                                Ürünler
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsProductSearchOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Ürün Ekle
                            </button>
                        </div>

                        <div className="border border-amber-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead className="bg-amber-50/50 text-xs uppercase text-amber-500 font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Ürün</th>
                                        <th className="px-4 py-3 text-center w-24">Adet</th>
                                        <th className="px-4 py-3 text-right w-32">İnternet Satış Fiyatı</th>
                                        <th className="px-4 py-3 text-right w-32">KDV'siz Fiyat</th>
                                        <th className="px-4 py-3 text-right w-24">KDV %</th>
                                        <th className="px-4 py-3 text-right w-32">Toplam (KDV Dahil)</th>
                                        <th className="px-4 py-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100">
                                    {formData.products?.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-amber-400 bg-white">
                                                Henüz ürün eklenmedi
                                            </td>
                                        </tr>
                                    ) : (
                                        formData.products?.map((item, index) => {
                                            const subtotal = item.quantity * item.unitPriceExcludingVat;
                                            const vat = subtotal * item.vatRate;
                                            const total = subtotal + vat;

                                            return (
                                                <tr key={index} className="bg-white hover:bg-amber-50/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-amber-900 block">{item._displayName || 'Ürün'}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={e => updateProduct(index, 'quantity', Number(e.target.value))}
                                                            className="w-full p-1 text-center border border-amber-200 rounded focus:ring-2 focus:ring-amber-400/50 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.internetSalesPrice}
                                                            onChange={e => updateProduct(index, 'internetSalesPrice', Number(e.target.value))}
                                                            className="w-full p-1 text-right border border-amber-200 rounded focus:ring-2 focus:ring-amber-400/50 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.unitPriceExcludingVat}
                                                            onChange={e => updateProduct(index, 'unitPriceExcludingVat', Number(e.target.value))}
                                                            className="w-full p-1 text-right border border-amber-200 rounded focus:ring-2 focus:ring-amber-400/50 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={item.vatRate}
                                                            onChange={e => updateProduct(index, 'vatRate', Number(e.target.value))}
                                                            className="w-full p-1 text-center border border-amber-200 rounded focus:ring-2 focus:ring-amber-400/50 outline-none text-amber-900 font-medium"
                                                        >
                                                            <option value={0}>0%</option>
                                                            <option value={0.01}>1%</option>
                                                            <option value={0.10}>10%</option>
                                                            <option value={0.20}>20%</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-amber-900">
                                                        {total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleRemoveProduct(index)}
                                                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                                <tfoot className="bg-amber-50 font-bold text-amber-900 border-t border-amber-200">
                                    <tr>
                                        <td colSpan={5} className="px-4 py-3 text-right">Genel Toplam:</td>
                                        <td className="px-4 py-3 text-right text-lg">
                                            {calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-6 border-t border-amber-100">
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                            <AlertCircle className="w-4 h-4" />
                            <span>Kayıt sonrası sözleşme dosyasını detay sayfasından yükleyebilirsiniz.</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-50 transition-colors font-medium"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg shadow-amber-900/20 active:scale-95 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Satışı Kaydet
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <ProductSearchModal
                isOpen={isProductSearchOpen}
                onClose={() => setIsProductSearchOpen(false)}
                onSelect={handleAddProduct}
            />
        </div>
    );
};

export default AddSaleModal;
