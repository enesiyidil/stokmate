
import React, { useState } from 'react';
import { Search, X, Package } from 'lucide-react';
import { useSearchProductsQuery, type ProductResponse } from '../../services/productApi';

interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: ProductResponse) => void;
}

const ProductSearchModal: React.FC<ProductSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { data: productsData, isLoading } = useSearchProductsQuery({ q: searchTerm, page: 0, size: 20 }, {
        skip: !isOpen
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-amber-100">
                {/* Header */}
                <div className="p-6 border-b border-amber-100 flex justify-between items-center bg-amber-50/30 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-amber-900 font-display">Ürün Seç</h2>
                        <p className="text-sm text-amber-600 mt-1">Listeye eklemek için bir ürün seçin</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-full text-amber-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-amber-50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Ürün kodu veya adı ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all text-amber-900 placeholder:text-amber-300"
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isLoading ? (
                        <div className="text-center py-8 text-amber-500">Aranıyor...</div>
                    ) : productsData?.content.length === 0 ? (
                        <div className="text-center py-12 text-amber-400">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Ürün bulunamadı</p>
                        </div>
                    ) : (
                        productsData?.content.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => onSelect(product)}
                                className="w-full text-left p-4 rounded-xl border border-amber-100 hover:border-amber-300 hover:bg-amber-50 transition-all group flex items-center gap-4"
                            >
                                <div className="w-16 h-16 rounded-lg bg-white border border-amber-100 flex items-center justify-center overflow-hidden shrink-0">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="w-8 h-8 text-amber-200" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-mono text-xs font-medium text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                            {product.code}
                                        </span>
                                    </div>
                                    <h3 className="font-medium text-amber-900 truncate group-hover:text-amber-700 transition-colors">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                        <span className={`flex items-center gap-1.5 ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${product.stockQuantity > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                            Stok: {product.stockQuantity}
                                        </span>
                                        <span className="text-amber-400">|</span>
                                        <span className="text-amber-600 truncate">{product.brand || '-'}</span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductSearchModal;
