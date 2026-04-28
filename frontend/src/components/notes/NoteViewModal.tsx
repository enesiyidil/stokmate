import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import type { Note, NoteItem } from '../../types/note';
import { X, Calendar, Link, CheckSquare, Square, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getPriorityInfo, getTagColor, getLinkToEntity, decodePostgresEscaped } from '../../utils/noteUtils';
import { useNavigate } from 'react-router-dom';
import { useToggleNoteItemMutation } from '../../services/noteApi';

interface NoteViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    note?: Note;
    onEdit?: (note: Note) => void;
    onDelete?: (id: string) => void;
}

export default function NoteViewModal({ isOpen, onClose, note, onEdit, onDelete }: NoteViewModalProps) {
    const navigate = useNavigate();
    const [toggleItem] = useToggleNoteItemMutation();

    // Local copy of items for instant UI update
    const [localItems, setLocalItems] = useState<NoteItem[]>(note?.items || []);

    useEffect(() => {
        setLocalItems(note?.items || []);
    }, [note]);

    if (!note) return null;

    const priorityInfo = getPriorityInfo(note.priority);
    const isCompleted = note.status === 'COMPLETED';

    const handleToggleItem = async (e: React.MouseEvent, itemId: number) => {
        e.stopPropagation();
        // Optimistic update
        setLocalItems(prev =>
            prev.map(it => it.id === itemId ? { ...it, isCompleted: !it.isCompleted } : it)
        );
        try {
            const updated = await toggleItem({ noteId: note.id, itemId }).unwrap();
            // Sync with server response
            setLocalItems(updated.items || []);
        } catch (err) {
            console.error('Toggle failed', err);
            // Revert on error
            setLocalItems(note.items || []);
        }
    };

    const handleLinkClick = () => {
        if (note.linkedEntityType !== 'NONE' && note.linkedEntityId) {
            onClose();
            getLinkToEntity(note.linkedEntityType, note.linkedEntityId, navigate);
        }
    };

    const getPriorityBadgeClass = () => {
        switch (note.priority) {
            case 'HIGH': return 'bg-red-100 text-red-800 border border-red-300';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
            case 'LOW': return 'bg-green-100 text-green-800 border border-green-300';
            default: return 'bg-amber-100 text-amber-800 border border-amber-300';
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[70]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl backdrop-blur-sm bg-white/95 border border-amber-200 text-left align-middle shadow-2xl shadow-amber-900/10 transition-all flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh]">

                                {/* Header */}
                                <div className="flex justify-between items-start p-6 border-b border-amber-100 bg-amber-50/60">
                                    <div className="flex-1 pr-4">
                                        <Dialog.Title as="h3" className={`text-2xl font-semibold leading-tight mb-3 ${isCompleted ? 'text-amber-400 line-through' : 'text-amber-900'}`}>
                                            {note.title}
                                        </Dialog.Title>

                                        {/* Badges */}
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wider ${getPriorityBadgeClass()}`}>
                                                {priorityInfo.label} Öncelik
                                            </span>

                                            {note.status === 'COMPLETED' && (
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wider bg-green-100 text-green-800 border border-green-300">
                                                    TAMAMLANDI
                                                </span>
                                            )}

                                            {(note.tags || []).map(tag => (
                                                <span
                                                    key={tag}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wider border ${getTagColor(tag)}`}
                                                >
                                                    {tag.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        {onEdit && (
                                            <button
                                                onClick={() => { onClose(); onEdit(note); }}
                                                className="p-2 text-amber-500 hover:text-amber-800 hover:bg-amber-100 rounded-xl border border-transparent hover:border-amber-200 transition-all"
                                                title="Düzenle"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={() => { onClose(); onDelete(note.id); }}
                                                className="p-2 text-amber-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-all"
                                                title="Sil"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={onClose}
                                            className="p-2 text-amber-400 hover:text-amber-800 hover:bg-amber-100 rounded-xl border border-transparent hover:border-amber-200 transition-all ml-1"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="p-6 overflow-y-auto flex-1">
                                    {note.noteType === 'TEXT' ? (
                                        <div className="text-amber-800 whitespace-pre-wrap leading-relaxed text-base">
                                            {decodePostgresEscaped(note.content) || <span className="italic text-amber-300">Bu notun içeriği boş.</span>}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {localItems.length > 0 ? (
                                                localItems.map(item => (
                                                    <div
                                                        key={item.id}
                                                        onClick={(e) => handleToggleItem(e, item.id)}
                                                        className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100 transition-colors group/item"
                                                    >
                                                        <div className="mt-0.5 flex-shrink-0">
                                                            {item.isCompleted ? (
                                                                <CheckSquare className="h-5 w-5 text-green-500" />
                                                            ) : (
                                                                <Square className="h-5 w-5 text-amber-300 group-hover/item:text-amber-500 transition-colors" />
                                                            )}
                                                        </div>
                                                        <span className={`text-base select-none ${item.isCompleted ? 'line-through text-amber-300' : 'text-amber-800'}`}>
                                                            {decodePostgresEscaped(item.content)}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="italic text-amber-300">Bu listede hiç madde yok.</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-5 border-t border-amber-100 bg-amber-50/40 flex justify-between items-center sm:rounded-b-2xl">
                                    <div className="flex flex-col gap-1 text-xs text-amber-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>Oluşturulma: {note.createdDate ? format(new Date(note.createdDate), 'd MMMM yyyy HH:mm', { locale: tr }) : 'Bilinmiyor'}</span>
                                        </div>
                                        {note.lastModifiedDate && note.lastModifiedDate !== note.createdDate && (
                                            <div className="flex items-center gap-1.5 opacity-70">
                                                <Edit className="h-3 w-3" />
                                                <span>Son Güncelleme: {format(new Date(note.lastModifiedDate), 'd MMMM yyyy HH:mm', { locale: tr })}</span>
                                            </div>
                                        )}
                                    </div>

                                    {note.linkedEntityType !== 'NONE' && (
                                        <button
                                            onClick={handleLinkClick}
                                            className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-900 transition-colors bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-xl border border-amber-200 font-medium"
                                        >
                                            <Link className="h-4 w-4" />
                                            <span>Bağlantılı Kaydı Görüntüle</span>
                                        </button>
                                    )}
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
