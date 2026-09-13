import { useState } from 'react';
import { useGetLinkedNotesQuery } from '../../services/noteApi';
import type { LinkedEntityType, Note } from '../../types/note';
import { StickyNote, Plus } from 'lucide-react';
import NoteModal from './NoteModal';
import NoteCard from './NoteCard';

interface LinkedNotesWidgetProps {
    entityType: LinkedEntityType;
    entityId: string;
    title?: string;
    className?: string;
}

export default function LinkedNotesWidget({
    entityType,
    entityId,
    title = 'Bağlı Notlar',
    className = ''
}: LinkedNotesWidgetProps) {
    const { data: notes = [], isLoading } = useGetLinkedNotesQuery({
        type: entityType,
        id: entityId
    });

    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className={`backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6 flex flex-col ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                    <StickyNote className="w-5 h-5" />
                    {title} ({notes.length})
                </h3>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all text-xs font-medium shadow-md"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Not Ekle
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 min-h-[200px] max-h-[500px]">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full text-amber-600">
                        Yükleniyor...
                    </div>
                ) : notes.length > 0 ? (
                    notes.map((note: Note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            compact
                            onView={() => { }} // Could potentially add View modal here as well
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-amber-700/60 py-8 text-center space-y-2">
                        <StickyNote className="w-8 h-8 opacity-50 mb-2" />
                        <p className="text-sm">Bu kayda bağlı henüz not bulunmuyor.</p>
                        <p className="text-xs">Yeni bir not oluşturarak buraya bağlayabilirsiniz.</p>
                    </div>
                )}
            </div>

            <NoteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                defaultLinkedContext={{
                    type: entityType,
                    id: entityId
                }}
            />
        </div>
    );
}
