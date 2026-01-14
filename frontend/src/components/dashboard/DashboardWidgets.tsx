import { Bell, Calendar, ChevronLeft, ChevronRight, LayoutDashboard, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetEventsQuery } from "../../services/userEventApi";
import AddEventModal from "../calendar/AddEventModal";
import CalendarEventsModal from "../calendar/CalendarEventsModal";
import { useGetAnnouncementsQuery, useDeleteAnnouncementMutation } from "../../services/announcementApi";
import { useAppSelector } from "../../hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import CreateAnnouncementModal from "./CreateAnnouncementModal";
import { Trash2, Plus } from "lucide-react";

// --- Stats Widget ---
interface StatCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon: any;
    trend?: string;
    trendType?: 'up' | 'down' | 'neutral';
    color: string;
    onClick?: () => void;
}

export function StatCard({ title, value, subValue, icon: Icon, trend, trendType = 'neutral', color, onClick }: StatCardProps) {
    const colorClasses: Record<string, string> = {
        'blue': 'bg-blue-50 text-blue-700 border-blue-200',
        'green': 'bg-green-50 text-green-700 border-green-200',
        'amber': 'bg-amber-50 text-amber-700 border-amber-200',
        'purple': 'bg-purple-50 text-purple-700 border-purple-200',
        'red': 'bg-red-50 text-red-700 border-red-200',
    };

    const iconBgClasses: Record<string, string> = {
        'blue': 'bg-blue-100',
        'green': 'bg-green-100',
        'amber': 'bg-amber-100',
        'purple': 'bg-purple-100',
        'red': 'bg-red-100',
    };

    return (
        <div className="relative group h-[80px]" onClick={onClick}>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-xl opacity-0 group-hover:opacity-100 group-hover:scale-[1.05] blur-md transition-all duration-500 -z-10"></div>
            <div className={`relative h-full p-3 rounded-xl border border-white/40 shadow-sm backdrop-blur-md bg-white/90 hover:bg-white/95 transition-all duration-300 cursor-pointer flex flex-col justify-between`}>
                <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">{title}</p>
                    <div className={`p-1.5 rounded-lg ${colorClasses[color]} ${iconBgClasses[color]} bg-opacity-50`}>
                        <Icon className="w-4 h-4" />
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:scale-105 transition-transform origin-left leading-none">{value}</h3>
                        {subValue && <p className="text-[10px] text-gray-400 leading-none">{subValue}</p>}
                    </div>
                    {trend && (
                        <div className="flex items-center gap-1 text-[10px]">
                            <span className={`font-semibold ${trendType === 'up' ? 'text-green-600' : trendType === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                                {trend}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Calendar Widget (Interactive) ---
export function CalendarWidget() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Fetch events for current month and next month to ensure we have upcoming events
    const startOfView = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfView = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0, 23, 59, 59);

    const formatToLocalISO = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        const local = new Date(date.getTime() - offset);
        return local.toISOString().slice(0, -1);
    };

    const { data: events = [] } = useGetEventsQuery({
        start: formatToLocalISO(startOfView),
        end: formatToLocalISO(endOfView),
    });

    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    // Get upcoming events (today and future) - limited to 3 items
    const upcomingEvents = events
        .filter(e => new Date(e.startDateTime) >= new Date(new Date().setHours(0, 0, 0, 0)))
        .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
        .slice(0, 3);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const daysArray = [];

        // Adjust for Monday start (0=Sunday, 1=Monday...)
        // We want Monday=0, Sunday=6
        let firstDayOfWeek = firstDay.getDay() - 1;
        if (firstDayOfWeek === -1) firstDayOfWeek = 6;

        for (let i = 0; i < firstDayOfWeek; i++) {
            daysArray.push(null);
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            daysArray.push(new Date(year, month, i));
        }
        return daysArray;
    };

    const monthDays = getDaysInMonth(currentDate);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setIsEventModalOpen(true);
    };

    const hasEvent = (date: Date) => {
        return events.some(e => {
            const eDate = new Date(e.startDateTime);
            return eDate.getDate() === date.getDate() &&
                eDate.getMonth() === date.getMonth() &&
                eDate.getFullYear() === date.getFullYear();
        });
    };

    return (
        <>
            <div className="relative group h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-xl opacity-0 group-hover:opacity-100 group-hover:scale-[1.03] blur-md transition-all duration-500 -z-10"></div>
                <div className="relative h-full p-3 rounded-xl border border-amber-100 bg-white/80 group-hover:bg-white/90 shadow-lg backdrop-blur-md flex flex-col transition-all duration-300">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                            <div className="p-1 bg-amber-100 rounded-md text-amber-700">
                                <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="font-bold text-gray-800 text-xs">Takvim</h3>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={prevMonth} className="p-0.5 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-3.5 h-3.5" /></button>
                            <span className="text-[10px] font-medium text-gray-700 w-20 text-center">
                                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </span>
                            <button onClick={nextMonth} className="p-0.5 hover:bg-gray-100 rounded-full"><ChevronRight className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="mb-3 shrink-0">
                        <div className="grid grid-cols-7 mb-1 text-center">
                            {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
                                <span key={d} className="text-[9px] text-gray-400 font-medium">{d}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center">
                            {monthDays.map((date, idx) => {
                                if (!date) return <div key={idx} />;

                                const isToday = new Date().toDateString() === date.toDateString();
                                const eventExists = hasEvent(date);

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleDateClick(date)}
                                        className={`
                                        h-5 w-5 mx-auto rounded-full flex flex-col items-center justify-center text-[10px] relative transition-all
                                        ${isToday ? 'bg-amber-600 text-white font-bold shadow-sm' : 'hover:bg-amber-50 text-gray-700'}
                                    `}
                                    >
                                        {date.getDate()}
                                        {eventExists && !isToday && (
                                            <span className="absolute -bottom-0.5 w-0.5 h-0.5 bg-amber-500 rounded-full"></span>
                                        )}
                                        {eventExists && isToday && (
                                            <span className="absolute -bottom-0.5 w-0.5 h-0.5 bg-white rounded-full"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-amber-100 w-full mb-2 shrink-0"></div>

                    {/* Upcoming Events List */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-1.5 shrink-0">
                            <div className="flex items-center gap-1">
                                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Yaklaşan</h4>
                                {upcomingEvents.length > 0 && <span className="bg-amber-100 text-amber-700 text-[9px] px-1 rounded-full font-medium">{upcomingEvents.length}</span>}
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedDate(new Date());
                                    setIsAddModalOpen(true);
                                }}
                                className="text-amber-600 hover:text-amber-700 font-medium text-[10px] flex items-center gap-0.5 bg-amber-50/50 hover:bg-amber-100 px-1.5 py-0.5 rounded transition-colors"
                            >
                                <span>+ Ekle</span>
                            </button>
                        </div>

                        <div className="space-y-1.5 overflow-hidden">
                            {upcomingEvents.length === 0 ? (
                                <div className="text-center py-2 text-gray-400 text-[10px] italic bg-gray-50/30 rounded-lg border border-gray-100/50 flex flex-col items-center justify-center h-full">
                                    <span className="opacity-50 text-[16px] mb-0.5">📅</span>
                                    <span>Planlanmış etkinlik yok</span>
                                </div>
                            ) : (
                                upcomingEvents.map((event, idx) => {
                                    const eventDate = new Date(event.startDateTime);
                                    const isToday = eventDate.toDateString() === new Date().toDateString();

                                    return (
                                        <div key={idx} className="flex items-start gap-2 group/event cursor-pointer hover:bg-amber-50 p-1.5 rounded-lg border border-transparent hover:border-amber-100 transition-all" onClick={() => {
                                            setSelectedDate(eventDate);
                                            setIsEventModalOpen(true);
                                        }}>
                                            <div className={`
                                                w-1 h-full min-h-[24px] rounded-full shrink-0
                                                bg-amber-400 shadow-amber-200 shadow-sm
                                            `}></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-medium text-gray-800 truncate leading-tight mb-0.5">{event.title}</p>
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 leading-none">
                                                    <span className={isToday ? "text-amber-600 font-semibold" : ""}>
                                                        {isToday ? 'Bugün' : eventDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <span className="opacity-40 text-[8px]">•</span>
                                                    <span>
                                                        {eventDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <CalendarEventsModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                date={selectedDate}
                // @ts-ignore
                events={events.filter(e => {
                    if (!selectedDate) return false;
                    const eDate = new Date(e.startDateTime);
                    return eDate.toDateString() === selectedDate.toDateString();
                })}
                onAddClick={() => {
                    setIsEventModalOpen(false);
                    setIsAddModalOpen(true);
                }}
            />

            <AddEventModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                initialDate={selectedDate || new Date()}
            />
        </>
    );
}

// --- Events Widget ---
interface EventItem {
    id: string;
    title: string;
    description: string;
    time: string;
    type: 'order' | 'shipment' | 'system' | 'alert';
}

export function EventsWidget({ events = [] }: { events?: EventItem[] }) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return '📦';
            case 'shipment': return '🚚';
            case 'alert': return '⚠️';
            default: return '🔹';
        }
    };

    return (
        <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-xl opacity-0 group-hover:opacity-100 group-hover:scale-[1.03] blur-md transition-all duration-500 -z-10"></div>
            <div className="relative h-full p-4 rounded-xl border border-amber-100 bg-white/80 group-hover:bg-white/90 shadow-lg backdrop-blur-md flex flex-col overflow-hidden transition-all duration-300">
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
                            <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm">Son Olaylar</h3>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-amber-200">
                    {events.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-xs">Henüz bir olay yok.</div>
                    ) : (
                        events.map(event => (
                            <div key={event.id} className="group/item flex gap-2.5 p-2 hover:bg-white rounded-lg border border-transparent hover:border-amber-100 transition-all items-center">
                                <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                                    {getIcon(event.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-semibold text-gray-800 truncate">{event.title}</h4>
                                    <p className="text-[10px] text-gray-500 truncate">{event.description}</p>
                                </div>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{event.time}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Messages (Announcements) Widget ---
export function MessagesWidget() {
    const { data: announcements = [] } = useGetAnnouncementsQuery();
    const [deleteAnnouncement] = useDeleteAnnouncementMutation();
    const { user } = useAppSelector((state) => state.auth);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const canManage = ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user?.role || '');

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) {
            await deleteAnnouncement(id);
        }
    };

    return (
        <>
            <div className="relative group h-full">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-xl opacity-0 group-hover:opacity-100 group-hover:scale-[1.03] blur-md transition-all duration-500 -z-10"></div>
                <div className="relative h-full p-4 rounded-xl border border-amber-100 bg-white/80 group-hover:bg-white/90 shadow-lg backdrop-blur-md flex flex-col overflow-hidden transition-all duration-300">
                    <div className="flex items-center justify-between mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-100 rounded-lg text-purple-700">
                                <Bell className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm">Duyurular</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {announcements.length > 0 && (
                                <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                    {announcements.length}
                                </span>
                            )}
                            {canManage && (
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="p-1 hover:bg-purple-100 text-purple-600 rounded-full transition-colors"
                                    title="Duyuru Ekle"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-purple-200">
                        {announcements.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-full text-gray-400 text-xs">
                                <Bell className="w-6 h-6 mb-2 opacity-20" />
                                <p>Henüz duyuru yok</p>
                            </div>
                        ) : (
                            announcements.map((announcement) => (
                                <div key={announcement.id} className="p-3 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 rounded-lg border border-purple-100 hover:border-purple-200 transition-all group/item relative">
                                    <h4 className="font-semibold text-gray-800 text-xs mb-1 pr-6 break-words">
                                        {announcement.content}
                                    </h4>
                                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                                        <span>{announcement.createdByFullName}</span>
                                        <span>{formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true, locale: tr })}</span>
                                    </div>

                                    {canManage && (
                                        <button
                                            onClick={(e) => handleDelete(announcement.id, e)}
                                            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover/item:opacity-100 transition-all"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <CreateAnnouncementModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </>
    );
}

// --- Shortcuts Widget ---
interface ShortcutItem {
    title: string;
    path?: string;
    icon: any;
    color: string;
    onClick?: () => void;
}

export function ShortcutsWidget({ shortcuts }: { shortcuts: ShortcutItem[] }) {
    const colorClasses: Record<string, string> = {
        'blue': 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border-blue-100 hover:border-blue-600',
        'green': 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border-green-100 hover:border-green-600',
        'amber': 'bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border-amber-100 hover:border-amber-600',
        'purple': 'bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border-purple-100 hover:border-purple-600',
        'red': 'bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border-red-100 hover:border-red-600',
        'gray': 'bg-gray-50 text-gray-700 hover:bg-gray-600 hover:text-white border-gray-100 hover:border-gray-600',
    };

    return (
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-xl opacity-0 group-hover:opacity-100 group-hover:scale-[1.03] blur-md transition-all duration-500 -z-10"></div>
            <div className="relative px-4 py-2 rounded-xl border border-amber-100 bg-white/80 group-hover:bg-white/90 shadow-lg backdrop-blur-md flex items-center gap-4 overflow-hidden transition-all duration-300">
                <div className="flex items-center gap-2 shrink-0 border-r border-amber-100 pr-4">
                    <div className="p-1 bg-amber-100 rounded-lg text-amber-700">
                        <Zap className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-xs hidden sm:block">Kısayollar</h3>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 flex-1">
                    {shortcuts.map((item, idx) => {
                        const Icon = item.icon;
                        const activeClass = colorClasses[item.color] || colorClasses['gray'];

                        if (item.onClick) {
                            return (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        item.onClick?.();
                                    }}
                                    className={`group/item flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all shrink-0 cursor-pointer text-left ${activeClass}`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-medium whitespace-nowrap">{item.title}</span>
                                </button>
                            );
                        }

                        // Fallback handling to ensure path is valid
                        const linkPath = item.path || '#';

                        return (
                            <Link
                                key={idx}
                                to={linkPath}
                                className={`group/item flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all shrink-0 ${activeClass}`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium whitespace-nowrap">{item.title}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
