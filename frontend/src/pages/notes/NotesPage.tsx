import { useState, useEffect } from 'react';
import { useGetUserNotesQuery, useDeleteNoteMutation } from '../../services/noteApi';
import { useTopbar } from '../../context/TopbarContext';
import { Plus, Filter, Tag } from 'lucide-react';
import NoteModal from '../../components/notes/NoteModal';
import NoteViewModal from '../../components/notes/NoteViewModal';
import NoteCard from '../../components/notes/NoteCard';
import FilterSearchBar from '../../components/common/FilterSearchBar';
import Pagination from '../../components/common/Pagination';
import type { NotePriority, NoteStatus, NoteTag, Note } from '../../types/note';

const ALL_TAGS: { value: NoteTag; label: string }[] = [
    { value: 'SIPARIS', label: 'Sipariş' },
    { value: 'STOKLU_SATIS', label: 'Stoklu Satış' },
    { value: 'SEVKIYAT', label: 'Sevkiyat' },
    { value: 'URUN', label: 'Ürün' },
    { value: 'URUN_KABUL', label: 'Ürün Kabul' },
    { value: 'BAKIYE_DEFTERI', label: 'Bakiye Defteri' },
    { value: 'CAPRAZ_DONUSTURME', label: 'Çapraz Dönüşüm' },
    { value: 'ARACLAR', label: 'Araçlar' },
    { value: 'KISISEL', label: 'Kişisel' },
    { value: 'MAGAZA', label: 'Mağaza' },
    { value: 'GENEL', label: 'Genel' },
    { value: 'DIGER', label: 'Diğer' },
];

export default function NotesPage() {
    const { setTopbarContent } = useTopbar();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<NotePriority | ''>('');
    const [statusFilter, setStatusFilter] = useState<NoteStatus | ''>('');
    // Etiket filtresi — boş array = tümü
    const [tagFilters, setTagFilters] = useState<NoteTag[]>([]);

    const [page, setPage] = useState(0);

    const { data: notesResponse, isLoading } = useGetUserNotesQuery({
        searchTerm: debouncedSearchTerm,
        priority: priorityFilter || undefined,
        status: statusFilter || undefined,
        tags: tagFilters.length > 0 ? tagFilters : undefined,
        page,
        size: 24,
        sortBy: 'created_at',
        direction: 'DESC'
    });

    const [deleteNote] = useDeleteNoteMutation();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | undefined>(undefined);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(0);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const toggleTag = (tag: NoteTag) => {
        setPage(0);
        setTagFilters(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const clearTags = () => {
        setTagFilters([]);
        setPage(0);
    };

    const notes = notesResponse?.content || [];

    // Setup Topbar
    useEffect(() => {
        setTopbarContent({
            title: 'Not Defteri',
            description: 'Kişisel notlarınızı ve yapılacaklar listenizi yönetin.',
            showFiltersInTopbar: false,
            actions: (
                <button
                    onClick={() => {
                        setSelectedNote(undefined);
                        setIsEditModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Not
                </button>
            ),
        });
        return () => setTopbarContent(null);
    }, [setTopbarContent]);

    const handleView = (note: Note) => {
        setSelectedNote(note);
        setIsViewModalOpen(true);
    };

    const handleEdit = (note: Note) => {
        setSelectedNote(note);
        setIsViewModalOpen(false);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
            await deleteNote(id);
            if (selectedNote?.id === id) setIsViewModalOpen(false);
        }
    };

    // Tag checkbox'larını extraContent olarak hazırla
    const tagFilterContent = (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-amber-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Etiketler
                </span>
                {tagFilters.length > 0 && (
                    <button
                        onClick={clearTags}
                        className="text-xs text-amber-500 hover:text-amber-800 transition-colors underline underline-offset-2"
                    >
                        Tümünü Temizle
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {/* Tümü seçeneği */}
                <button
                    onClick={clearTags}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${tagFilters.length === 0
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm scale-105'
                            : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                        }`}
                >
                    {tagFilters.length === 0 && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    )}
                    Tümü
                </button>

                {ALL_TAGS.map(tag => {
                    const isChecked = tagFilters.includes(tag.value);
                    return (
                        <button
                            key={tag.value}
                            onClick={() => toggleTag(tag.value)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${isChecked
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm scale-105'
                                    : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                                }`}
                        >
                            {/* Checkbox görünümü */}
                            <span className={`w-3.5 h-3.5 rounded flex-shrink-0 flex items-center justify-center border transition-all ${isChecked
                                    ? 'bg-white/30 border-white/50'
                                    : 'bg-white border-amber-300'
                                }`}>
                                {isChecked && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </span>
                            {tag.label}
                        </button>
                    );
                })}
            </div>
            {tagFilters.length > 0 && (
                <p className="text-xs text-amber-500 mt-1">
                    {tagFilters.length} etiket seçili — seçili etiketlerin <strong>tamamını</strong> taşıyan notlar gösteriliyor
                </p>
            )}
        </div>
    );

    return (
        <div className="p-6 space-y-6">

            {/* Filter and Search Bar */}
            <FilterSearchBar
                filters={[
                    {
                        label: 'Öncelik',
                        value: priorityFilter || 'ALL',
                        onChange: (val: string) => {
                            setPriorityFilter(val === 'ALL' ? '' : val as NotePriority);
                            setPage(0);
                        },
                        options: [
                            { key: 'ALL', label: 'Tüm Öncelikler' },
                            { key: 'HIGH', label: 'Yüksek', activeColor: 'bg-red-600' },
                            { key: 'MEDIUM', label: 'Orta', activeColor: 'bg-yellow-600' },
                            { key: 'LOW', label: 'Düşük', activeColor: 'bg-green-600' },
                        ]
                    },
                    {
                        label: 'Durum',
                        value: statusFilter || 'ALL',
                        onChange: (val: string) => {
                            setStatusFilter(val === 'ALL' ? '' : val as NoteStatus);
                            setPage(0);
                        },
                        options: [
                            { key: 'ALL', label: 'Tüm Durumlar' },
                            { key: 'PENDING', label: 'Bekliyor', activeColor: 'bg-blue-600' },
                            { key: 'COMPLETED', label: 'Tamamlandı', activeColor: 'bg-green-600' },
                        ]
                    }
                ]}
                searchPlaceholder="Notlarda ara..."
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                extraContent={tagFilterContent}
            />

            {/* Cards Grid */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
            ) : notes.length === 0 ? (
                <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl shadow-xl flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-200">
                        <Filter className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-medium text-amber-900 mb-2">Not Bulunamadı</h3>
                    <p className="text-amber-600 max-w-sm mb-6">
                        {tagFilters.length > 0
                            ? 'Seçili etiketlere sahip not bulunamadı.'
                            : 'Arama kriterlerinize uygun not bulunamadı veya henüz hiç not eklemediniz.'
                        }
                    </p>
                    {tagFilters.length > 0 && (
                        <button
                            onClick={clearTags}
                            className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl border border-amber-200 hover:bg-amber-200 transition-all text-sm font-medium"
                        >
                            Etiket Filtrelerini Temizle
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start w-full">
                    {notes.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {notesResponse && (
                <Pagination
                    page={page}
                    totalPages={notesResponse.totalPages}
                    totalElements={notesResponse.totalElements}
                    onPageChange={setPage}
                    itemLabel="not"
                />
            )}

            <NoteModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedNote(undefined);
                }}
                existingNote={selectedNote}
            />

            <NoteViewModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedNote(undefined);
                }}
                note={selectedNote}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
}
