import React, { useState, useEffect } from 'react';
import type { SaleProductResponse } from '../../services/saleApi';
import { useCreateSaleShipmentMutation } from '../../services/shipmentApi';
import { Package } from 'lucide-react';

interface CreateSaleShipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    saleId: string;
    products: SaleProductResponse[];
    onSuccess?: () => void;
}

const CreateSaleShipmentModal: React.FC<CreateSaleShipmentModalProps> = ({ isOpen, onClose, saleId, products, onSuccess }) => {
    const [createSaleShipment, { isLoading }] = useCreateSaleShipmentMutation();
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Initialize with all quantities set to 0 initially, forcing user to select
            // Or set to max? OrderDetails sets to 0. Let's stick to 0 to be safe.
            const initialQuantities: Record<string, number> = {};
            products.forEach(p => {
                initialQuantities[p.id] = 0;
            });
            setQuantities(initialQuantities);
            setNotes('');
        }
    }, [isOpen, products]);

    const handleSubmit = async () => {
        const itemsToShip = Object.entries(quantities)
            .filter(([_, qty]) => qty > 0)
            .map(([productId, qty]) => ({
                saleProductId: productId,
                quantityToShip: qty
            }));

        if (itemsToShip.length === 0) {
            alert('Lütfen en az bir ürün için miktar giriniz');
            return;
        }

        try {
            await createSaleShipment({
                saleId,
                products: itemsToShip,
                notes
            }).unwrap();

            alert('Sevk talebi başarıyla oluşturuldu');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to create shipment:', error);
            alert('Sevk oluşturulurken hata: ' + (error.data?.message || error.message || 'Bilinmeyen hata'));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-blue-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-blue-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-blue-900">Sevk Talebi Oluştur</h3>
                        <p className="text-sm text-blue-600 mt-1">Sevk etmek istediğiniz ürünlerin miktarını giriniz.</p>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Products List */}
                    <div className="space-y-4">
                        {products.map(product => {
                            const maxQty = product.quantity; // Assuming for now total quantity is available. 
                            // TODO: If we track previously shipped items for sales, we should subtract them here.
                            // However, the current SaleProductResponse doesn't seem to have 'shippedQuantity'.
                            // The backend 'createSaleShipment' logic likely handles validation, but UI might let them over-select if not careful.
                            // For this iteration, we assume fresh sale or manage it via backend error. 
                            // Ideally, backend should return available quantities.

                            const currentQty = quantities[product.id] || 0;

                            return (
                                <div key={product.id} className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="font-medium text-blue-900">{product.productName}</p>
                                            <div className="flex items-center gap-3 mt-1 text-sm">
                                                <span className="text-blue-600">Toplam Sipariş: <span className="font-bold">{maxQty}</span></span>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-32">
                                            <input
                                                type="number"
                                                min="0"
                                                max={maxQty}
                                                value={currentQty}
                                                onChange={(e) => {
                                                    const val = Math.min(Math.max(0, Number(e.target.value)), maxQty);
                                                    setQuantities(prev => ({ ...prev, [product.id]: val }));
                                                }}
                                                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-medium"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                            Notlar (Opsiyonel)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Sevk ile ilgili notlar..."
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-blue-100 bg-gray-50 rounded-b-2xl flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-700 text-white rounded-lg hover:from-blue-700 hover:to-cyan-800 transition-all font-medium disabled:opacity-50 shadow-lg shadow-blue-500/30"
                    >
                        {isLoading ? 'Gönderiliyor...' : 'Sevke Sun'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateSaleShipmentModal;
