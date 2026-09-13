import { ShoppingBag } from "lucide-react";
import { CalendarWidget, MessagesWidget, ShortcutsWidget } from "../../../components/dashboard/DashboardWidgets";
import { AnalogClock } from "../../../components/dashboard/AnalogClock";
import { BRAND_STOCK_SHORTCUTS } from "../../../constants/brandConstants";

export default function LogisticsDashboard() {
    const shortcuts = BRAND_STOCK_SHORTCUTS.map((shortcut) => ({
        ...shortcut,
        icon: ShoppingBag,
    }));

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
        </div>
    );
}
