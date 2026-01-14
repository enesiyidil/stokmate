import { useState } from "react";
import { CheckSquare, Truck, Plus, Upload, ShoppingBag } from "lucide-react";
import { CalendarWidget, MessagesWidget, ShortcutsWidget } from "../../../components/dashboard/DashboardWidgets";
import { AnalogClock } from "../../../components/dashboard/AnalogClock";
import AddOrderReceiptModal from "../../../components/orders/AddOrderReceiptModal";
import AddOrderModal from "../../../components/orders/AddOrderModal";
import BulkUploadModal from "../../../components/orders/BulkUploadModal";

export default function OperationsDashboard() {
    const [showProductAcceptance, setShowProductAcceptance] = useState(false);
    const [showAddOrder, setShowAddOrder] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);

    const shortcuts = [
        // Actions
        {
            title: 'Ürün Kabul Et',
            onClick: () => setShowProductAcceptance(true),
            icon: CheckSquare,
            color: 'green'
        },
        {
            title: 'Sipariş Ekle',
            onClick: () => setShowAddOrder(true),
            icon: Plus,
            color: 'blue'
        },
        {
            title: 'Toplu Sipariş',
            onClick: () => setShowBulkUpload(true),
            icon: Upload,
            color: 'purple'
        },
        // Brand Shortcuts
        {
            title: 'Doğtaş Stok',
            path: '/products?brand=OAK',
            icon: ShoppingBag,
            color: 'amber' // Approximate for Brown/Red
        },
        {
            title: 'Maple Stok',
            path: '/products?brand=MAPLE',
            icon: ShoppingBag,
            color: 'red' // Maple uses red/yellow
        },
        {
            title: 'Pine Stok',
            path: '/products?brand=PINE',
            icon: ShoppingBag,
            color: 'blue' // Pine uses turquoise/blue
        },
        // Other navs
        { title: 'Sevkiyat Planlama', path: '/shipment', icon: Truck, color: 'gray' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-170px)] gap-6">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                {/* Left Column: Announcements */}
                <div className="h-full">
                    <MessagesWidget />
                </div>

                {/* Right Column: Clock & Calendar */}
                <div className="flex flex-col gap-6 h-full">
                    <div className="flex-none h-[280px]">
                        <AnalogClock />
                    </div>
                    <div className="flex-1 min-h-0">
                        <CalendarWidget />
                    </div>
                </div>
            </div>

            {/* Bottom Row: Shortcuts */}
            <div className="flex-none">
                <ShortcutsWidget shortcuts={shortcuts} />
            </div>

            {/* Modals */}
            {showProductAcceptance && (
                <AddOrderReceiptModal
                    isOpen={showProductAcceptance}
                    onClose={() => setShowProductAcceptance(false)}
                    onSuccess={() => {
                        setShowProductAcceptance(false);
                        // Optional: trigger a refresh or toast
                    }}
                />
            )}

            {showAddOrder && (
                <AddOrderModal
                    isOpen={showAddOrder}
                    onClose={() => setShowAddOrder(false)}
                    onSuccess={() => setShowAddOrder(false)}
                />
            )}

            {showBulkUpload && (
                <BulkUploadModal
                    onClose={() => setShowBulkUpload(false)}
                    onSuccess={() => setShowBulkUpload(false)}
                />
            )}
        </div>
    );
}
