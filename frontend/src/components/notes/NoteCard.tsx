import type { Note } from '../../types/note';
import { getTagColor, getPriorityInfo, getLinkToEntity, decodePostgresEscaped } from '../../utils/noteUtils';
import { useToggleNoteItemMutation } from '../../services/noteApi';
import { CheckSquare, Square, Edit, Link, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface NoteCardProps {
    note: Note;
    onView?: (note: Note) => void;
    onEdit?: (note: Note) => void;
    onDelete?: (id: string) => void;
    compact?: boolean;
}

export default function NoteCard({ note, onView, onEdit, onDelete, compact = false }: NoteCardProps) {
    const [toggleItem] = useToggleNoteItemMutation();
    const navigate = useNavigate();

    const priorityInfo = getPriorityInfo(note.priority);
    const isCompleted = note.status === 'COMPLETED';

    const handleToggleTodo = async (e: React.MouseEvent, itemId: number) => {
        e.stopPropagation();
        try {
            await toggleItem({ noteId: note.id, itemId }).unwrap();
        } catch (error) {
            console.error('Failed to toggle item', error);
        }
    };

    const handleLinkClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (note.linkedEntityType !== 'NONE' && note.linkedEntityId) {
            getLinkToEntity(note.linkedEntityType, note.linkedEntityId, navigate);
        }
    };

    // Priority badge style mapping matching order page style
    const getPriorityBadgeClass = () => {
        switch (note.priority) {
            case 'HIGH':
                return 'bg-red-100 text-red-800 border border-red-300';
            case 'MEDIUM':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
            case 'LOW':
                return 'bg-green-100 text-green-800 border border-green-300';
            default:
                return 'bg-amber-100 text-amber-800 border border-amber-300';
        }
    };

    return (
        <div
            onClick={() => onView && onView(note)}
            className={`group flex flex-col rounded-2xl border transition-all duration-300 h-full shadow-lg
                ${onView ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}
                ${compact ? 'p-3' : 'p-5'}
                ${isCompleted
                    ? 'bg-white/80 border-amber-100 opacity-80'
                    : 'backdrop-blur-sm bg-white/95 border-amber-200'
                }
                ${note.color ? `border-l-4 border-l-${note.color}-500` : ''}
            `}
        >
            {/* Header */}
            <div className={`flex justify-between items-start ${compact ? 'mb-2' : 'mb-3'} gap-2`}>
                <h3 className={`font-semibold break-words leading-tight ${compact ? 'text-sm' : 'text-base'} ${isCompleted ? 'text-amber-400 line-through' : 'text-amber-900'}`}>
                    {note.title}
                </h3>
                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(note); }}
                            className="p-1.5 text-amber-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Düzenle"
                        >
                            <Edit className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                            className="p-1.5 text-amber-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sil"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-3">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wider ${getPriorityBadgeClass()}`}>
                    {priorityInfo.label}
                </span>

                {note.status === 'COMPLETED' && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wider bg-green-100 text-green-800 border border-green-300">
                        TAMAMLANDI
                    </span>
                )}

                {(note.tags || []).map(tag => (
                    <span
                        key={tag}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-wider border ${getTagColor(tag)}`}
                    >
                        {tag.replace(/_/g, ' ')}
                    </span>
                ))}
            </div>

            {/* Content Area */}
            <div className={`flex-1 mt-1 ${compact ? 'mb-2' : 'mb-4'}`}>
                {note.noteType === 'TEXT' ? (
                    <p className={`${compact ? 'text-xs' : 'text-sm'} text-amber-700 line-clamp-6 whitespace-pre-wrap`}>
                        {decodePostgresEscaped(note.content) || <span className="italic text-amber-300">İçerik yok</span>}
                    </p>
                ) : (
                    <div className="space-y-2">
                        {(note.items || []).slice(0, compact ? 3 : 5).map(item => (
                            <div
                                key={item.id}
                                className="flex items-start gap-2 group/item"
                                onClick={(e) => handleToggleTodo(e, item.id)}
                            >
                                <button className="mt-0.5 flex-shrink-0 text-amber-300 group-hover/item:text-amber-600 transition-colors">
                                    {item.isCompleted ?
                                        <CheckSquare className="h-4 w-4 text-green-500" /> :
                                        <Square className="h-4 w-4" />
                                    }
                                </button>
                                <span className={`text-sm ${item.isCompleted ? 'line-through text-amber-300' : 'text-amber-800'}`}>
                                    {decodePostgresEscaped(item.content)}
                                </span>
                            </div>
                        ))}
                        {(note.items || []).length > 5 && (
                            <p className="text-xs text-amber-400 italic mt-2 ml-6">
                                + {(note.items || []).length - 5} daha...
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={`mt-auto flex justify-between items-center ${compact ? 'pt-2' : 'pt-3'} border-t border-amber-100`}>
                <div className={`flex items-center ${compact ? 'text-[10px]' : 'text-xs'} text-amber-500 gap-1.5`}>
                    <Calendar className="h-3 w-3" />
                    <span>{note.createdDate ? format(new Date(note.createdDate), 'd MMM yyyy', { locale: tr }) : '-'}</span>
                </div>

                {note.linkedEntityType !== 'NONE' && (
                    <button
                        onClick={handleLinkClick}
                        className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 transition-colors bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg"
                    >
                        <Link className="h-3 w-3" />
                        <span>Bağlantılı</span>
                    </button>
                )}
            </div>
        </div>
    );
}
