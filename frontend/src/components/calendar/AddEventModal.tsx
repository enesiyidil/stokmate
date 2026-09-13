import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateEventMutation } from "../../services/userEventApi";

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: Date;
}

interface AddEventFormData {
    title: string;
    description: string;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    reminderType: string;
}

export default function AddEventModal({ isOpen, onClose, initialDate }: AddEventModalProps) {
    const [createEvent, { isLoading }] = useCreateEventMutation();
    const { register, handleSubmit, reset, setValue } = useForm<AddEventFormData>();
    const [selectedDate, setSelectedDate] = useState<string>('');

    useEffect(() => {
        if (isOpen && initialDate) {
            // Format YYYY-MM-DD
            const yyyy = initialDate.getFullYear();
            const mm = String(initialDate.getMonth() + 1).padStart(2, '0');
            const dd = String(initialDate.getDate()).padStart(2, '0');
            setSelectedDate(`${yyyy}-${mm}-${dd}`);

            // Set default times
            const now = new Date();
            const currentHour = String(now.getHours()).padStart(2, '0');
            const nextHour = String(now.getHours() + 1).padStart(2, '0');

            setValue('startTime', `${currentHour}:00`);
            setValue('endTime', `${nextHour}:00`);
            setValue('reminderType', 'MIN_15_BEFORE');
        }
    }, [isOpen, initialDate, setValue]);

    const onSubmit = async (data: AddEventFormData) => {
        if (!selectedDate) return;

        try {
            // Send Local Time string to match backend LocalDateTime without timezone shift
            const startDateTime = `${selectedDate}T${data.startTime}:00`;
            const endDateTime = `${selectedDate}T${data.endTime}:00`;

            await createEvent({
                title: data.title,
                description: data.description,
                startDateTime,
                endDateTime,
                // @ts-ignore
                reminderType: data.reminderType
            }).unwrap();

            reset();
            onClose();
        } catch (error) {
            console.error('Failed to create event:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-6">Yeni Etkinlik Ekle</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                        <input
                            {...register('title', { required: true })}
                            className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                            placeholder="Toplantı, Hatırlatma vb."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <textarea
                            {...register('description')}
                            className="w-full h-24 px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all resize-none"
                            placeholder="Detaylar..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            required
                            className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Saati</label>
                            <input
                                type="time"
                                {...register('startTime', { required: true })}
                                className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Saati</label>
                            <input
                                type="time"
                                {...register('endTime', { required: true })}
                                className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hatırlatma</label>
                        <select
                            {...register('reminderType')}
                            className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-white"
                        >
                            <option value="NONE">Yok</option>
                            <option value="AT_TIME_OF_EVENT">Tam Saatinde</option>
                            <option value="MIN_15_BEFORE">15 Dakika Önce</option>
                            <option value="HOUR_1_BEFORE">1 Saat Önce</option>
                            <option value="DAY_1_BEFORE">1 Gün Önce</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Ekleniyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
