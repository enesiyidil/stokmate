import { Trash2, X } from "lucide-react";
import { useDeleteEventMutation } from "../../services/userEventApi";
import type { UserEventResponse } from "../../services/userEventApi";

interface CalendarEventsModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    events: UserEventResponse[];
    onAddClick: () => void;
}

export default function CalendarEventsModal({ isOpen, onClose, date, events, onAddClick }: CalendarEventsModalProps) {
    const [deleteEvent] = useDeleteEventMutation();

    if (!isOpen || !date) return null;

    const handleDelete = async (id: string) => {
        if (window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
            await deleteEvent(id);
        }
    };

    const formattedDate = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800">{formattedDate}</h2>
                    <p className="text-sm text-gray-500">Kayıtlı Etkinlikler</p>
                </div>

                <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {events.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                            Bu tarih için etkinlik bulunamadı.
                        </div>
                    ) : (
                        events.map(event => (
                            <div key={event.id} className="group p-3 rounded-xl bg-amber-50 border border-amber-100 hover:border-amber-200 transition-all">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-gray-800">{event.title}</h3>
                                    {event.type !== 'SHIPMENT' && (
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                        {new Date(event.startDateTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={onAddClick}
                    className="w-full py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                    + Yeni Etkinlik Ekle
                </button>
            </div>
        </div>
    );
}
