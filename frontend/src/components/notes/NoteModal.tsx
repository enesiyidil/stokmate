import React, { useState, useMemo } from 'react';
import type {
    Note,
    NoteType,
    NotePriority,
    NoteStatus,
    NoteTag,
    LinkedEntityType
} from '../../types/note';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useCreateNoteMutation, useUpdateNoteMutation } from '../../services/noteApi';
import { useListOrdersQuery } from '../../services/orderApi';
import { Plus, X, ListTodo, Type as TypeIcon, Search, CheckCircle } from 'lucide-react';

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingNote?: Note;
    defaultLinkedContext?: {
        type: LinkedEntityType;
        id: string;
    };
}

// ---------- ORDER LINK SECTION ----------
function OrderLinkSection({
    selectedEntityType,
    selectedEntityId,
    onTypeChange,
    onIdChange,
}: {
    selectedEntityType: LinkedEntityType;
    selectedEntityId: string;
    onTypeChange: (type: LinkedEntityType) => void;
    onIdChange: (id: string) => void;
}) {
    const [orderSearch, setOrderSearch] = useState('');
    const { data: allOrders = [] } = useListOrdersQuery(
        {},
        { skip: selectedEntityType !== 'ORDER' }
    );

    const filteredOrders = useMemo(() => {
        if (!orderSearch.trim() || selectedEntityType !== 'ORDER') return [];
        const q = orderSearch.toLowerCase();
        return allOrders
            .filter(
                (o) =>
                    o.orderNo.toLowerCase().includes(q) ||
                    (o.prosapContractNo || '').toLowerCase().includes(q)
            )
            .slice(0, 8);
    }, [orderSearch, allOrders, selectedEntityType]);

    const selectedOrder = useMemo(
        () => allOrders.find((o) => o.id === selectedEntityId),
        [allOrders, selectedEntityId]
    );

    return (
        <div className="space-y-2 pt-4 border-t border-amber-100">
            <label className="text-sm font-medium text-amber-800">Bağlantı (Opsiyonel)</label>
            <div className="flex gap-2">
                {/* Tip seçimi */}
                <select
                    value={selectedEntityType}
                    onChange={(e) => {
                        onTypeChange(e.target.value as LinkedEntityType);
                        onIdChange('');
                    }}
                    className="w-1/3 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 shadow-sm"
                >
                    <option value="NONE">Yok</option>
                    <option value="ORDER">Sipariş</option>
                    <option value="PRODUCT">Ürün</option>
                    <option value="CUSTOMER">Müşteri</option>
                    <option value="STORE">Mağaza</option>
                </select>

                {/* ORDER: akıllı arama */}
                {selectedEntityType === 'ORDER' && (
                    <div className="relative w-2/3">
                        {selectedEntityId && selectedOrder ? (
                            // Seçili sipariş gösterimi
                            <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-green-300 bg-green-50 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    <span className="text-green-900 font-medium">{selectedOrder.orderNo}</span>
                                    {selectedOrder.prosapContractNo && (
                                        <span className="text-green-700 text-xs">({selectedOrder.prosapContractNo})</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => { onIdChange(''); setOrderSearch(''); }}
                                    className="text-green-500 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            // Arama kutusu
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                                <input
                                    type="text"
                                    value={orderSearch}
                                    onChange={(e) => setOrderSearch(e.target.value)}
                                    placeholder="Sipariş no veya sözleşme no ara..."
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-amber-200 bg-white text-sm text-amber-900 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 shadow-sm"
                                />
                                {filteredOrders.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-amber-200 rounded-xl shadow-lg overflow-hidden">
                                        {filteredOrders.map((order) => (
                                            <button
                                                key={order.id}
                                                onClick={() => { onIdChange(order.id); setOrderSearch(''); }}
                                                className="w-full text-left px-4 py-2.5 hover:bg-amber-50 transition-colors border-b border-amber-100 last:border-0"
                                            >
                                                <div className="font-medium text-amber-900 text-sm">{order.orderNo}</div>
                                                {order.prosapContractNo && (
                                                    <div className="text-xs text-amber-600">{order.prosapContractNo}</div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Diğer tipler: manuel ID girişi */}
                {selectedEntityType !== 'NONE' && selectedEntityType !== 'ORDER' && (
                    <input
                        type="text"
                        value={selectedEntityId}
                        onChange={(e) => onIdChange(e.target.value)}
                        placeholder="Kayıt ID'sini girin..."
                        className="w-2/3 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-amber-900 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 shadow-sm"
                    />
                )}
            </div>
            <p className="text-xs text-amber-500">
                Notu belirli bir siparişe bağlayarak sipariş detay sayfasında görünmesini sağlayabilirsiniz.
            </p>
        </div>
    );
}

// ---------- TAGS ----------
const tagsList: { value: NoteTag; label: string }[] = [
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

// ---------- MAIN MODAL ----------
export default function NoteModal({ isOpen, onClose, existingNote, defaultLinkedContext }: NoteModalProps) {
    const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
    const [updateNote, { isLoading: isUpdating }] = useUpdateNoteMutation();

    const [title, setTitle] = useState(existingNote?.title || '');
    const [content, setContent] = useState(existingNote?.content || '');
    const [noteType, setNoteType] = useState<NoteType>(existingNote?.noteType || 'TEXT');
    const [priority, setPriority] = useState<NotePriority>(existingNote?.priority || 'MEDIUM');
    const [status, setStatus] = useState<NoteStatus>(existingNote?.status || 'PENDING');
    const [tags, setTags] = useState<NoteTag[]>(existingNote?.tags || []);
    const [todoItems, setTodoItems] = useState<{ id?: number; content: string; isCompleted: boolean; position: number }[]>(
        existingNote?.items || []
    );
    const [selectedEntityType, setSelectedEntityType] = useState<LinkedEntityType>(
        existingNote?.linkedEntityType || defaultLinkedContext?.type || 'NONE'
    );
    const [selectedEntityId, setSelectedEntityId] = useState<string>(
        existingNote?.linkedEntityId || defaultLinkedContext?.id || ''
    );

    React.useEffect(() => {
        if (isOpen) {
            setTitle(existingNote?.title || '');
            setContent(existingNote?.content || '');
            setNoteType(existingNote?.noteType || 'TEXT');
            setPriority(existingNote?.priority || 'MEDIUM');
            setStatus(existingNote?.status || 'PENDING');
            setTags(existingNote?.tags || []);
            setTodoItems(existingNote?.items || []);
            setSelectedEntityType(existingNote?.linkedEntityType || defaultLinkedContext?.type || 'NONE');
            setSelectedEntityId(existingNote?.linkedEntityId || defaultLinkedContext?.id || '');
        }
    }, [isOpen, existingNote, defaultLinkedContext]);

    const isLoading = isCreating || isUpdating;

    const handleSave = async () => {
        if (!title.trim()) return;
        const noteData: Partial<Note> = {
            title,
            content: noteType === 'TEXT' ? content : '',
            noteType,
            priority,
            status,
            tags,
            linkedEntityType: selectedEntityType,
            linkedEntityId: selectedEntityId || '',
            items: noteType === 'TODO'
                ? todoItems.map((item, index) => ({ ...item, position: index }) as any)
                : [],
            color: existingNote?.color,
        };
        try {
            if (existingNote) {
                await updateNote({ id: existingNote.id, data: noteData }).unwrap();
            } else {
                await createNote(noteData).unwrap();
            }
            onClose();
            resetForm();
        } catch (error) {
            console.error('Failed to save note:', error);
        }
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setNoteType('TEXT');
        setPriority('MEDIUM');
        setStatus('PENDING');
        setTags([]);
        setTodoItems([]);
        setSelectedEntityType(defaultLinkedContext?.type || 'NONE');
        setSelectedEntityId(defaultLinkedContext?.id || '');
    };

    const toggleTag = (tag: NoteTag) =>
        setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

    const addTodoItem = () =>
        setTodoItems((prev) => [...prev, { content: '', isCompleted: false, position: prev.length }]);

    const updateTodoItem = (index: number, val: string) =>
        setTodoItems((prev) => prev.map((it, i) => (i === index ? { ...it, content: val } : it)));

    const removeTodoItem = (index: number) =>
        setTodoItems((prev) => prev.filter((_, i) => i !== index));

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={onClose}>
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
                            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl backdrop-blur-sm bg-white/95 border border-amber-200 p-6 text-left align-middle shadow-2xl shadow-amber-900/10 transition-all">

                                <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-amber-900 mb-6">
                                    {existingNote ? 'Notu Düzenle' : 'Yeni Not Ekle'}
                                </Dialog.Title>

                                <div className="space-y-5">
                                    {/* Note Type Toggle */}
                                    <div className="flex bg-amber-50 p-1 rounded-xl border border-amber-200 w-fit">
                                        <button
                                            onClick={() => setNoteType('TEXT')}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${noteType === 'TEXT'
                                                ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-md'
                                                : 'text-amber-600 hover:text-amber-900'
                                                }`}
                                        >
                                            <TypeIcon className="h-4 w-4" />
                                            <span className="text-sm font-medium">Metin</span>
                                        </button>
                                        <button
                                            onClick={() => setNoteType('TODO')}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${noteType === 'TODO'
                                                ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-md'
                                                : 'text-amber-600 hover:text-amber-900'
                                                }`}
                                        >
                                            <ListTodo className="h-4 w-4" />
                                            <span className="text-sm font-medium">Liste</span>
                                        </button>
                                    </div>

                                    {/* Title */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-amber-800">Başlık *</label>
                                        <input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Not başlığı giriniz..."
                                            className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-amber-900 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all shadow-sm"
                                        />
                                    </div>

                                    {/* Content */}
                                    {noteType === 'TEXT' ? (
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-amber-800">İçerik</label>
                                            <textarea
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                rows={6}
                                                className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-amber-900 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all shadow-sm resize-none"
                                                placeholder="Not içeriği..."
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-amber-800">Yapılacaklar</label>
                                            <div className="space-y-2 mt-2">
                                                {todoItems.map((item, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <input
                                                            value={item.content}
                                                            onChange={(e) => updateTodoItem(index, e.target.value)}
                                                            className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm text-amber-900 placeholder-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all shadow-sm"
                                                            placeholder={`Madde ${index + 1}`}
                                                        />
                                                        <button
                                                            onClick={() => removeTodoItem(index)}
                                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={addTodoItem}
                                                    className="w-full mt-2 py-2.5 border border-dashed border-amber-300 rounded-xl text-amber-600 hover:text-amber-800 hover:border-amber-400 hover:bg-amber-50 flex justify-center items-center text-sm font-medium transition-all"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" /> Yeni Madde Ekle
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Priority & Status */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-amber-800">Öncelik</label>
                                            <div className="flex gap-2">
                                                {(['LOW', 'MEDIUM', 'HIGH'] as NotePriority[]).map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setPriority(p)}
                                                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${priority === p
                                                            ? p === 'HIGH'
                                                                ? 'bg-red-100 text-red-800 border-red-300 shadow-sm'
                                                                : p === 'MEDIUM'
                                                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm'
                                                                    : 'bg-green-100 text-green-800 border-green-300 shadow-sm'
                                                            : 'bg-white text-amber-600 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                                                            }`}
                                                    >
                                                        {p === 'HIGH' ? 'Yüksek' : p === 'MEDIUM' ? 'Orta' : 'Düşük'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-amber-800">Durum</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setStatus('PENDING')}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${status === 'PENDING'
                                                        ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm'
                                                        : 'bg-white text-amber-600 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                                                        }`}
                                                >
                                                    Bekliyor
                                                </button>
                                                <button
                                                    onClick={() => setStatus('COMPLETED')}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${status === 'COMPLETED'
                                                        ? 'bg-green-100 text-green-800 border-green-300 shadow-sm'
                                                        : 'bg-white text-amber-600 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                                                        }`}
                                                >
                                                    Tamamlandı
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-amber-800">Etiketler</label>
                                        <div className="flex flex-wrap gap-2">
                                            {tagsList.map((tag) => (
                                                <button
                                                    key={tag.value}
                                                    onClick={() => toggleTag(tag.value)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${tags.includes(tag.value)
                                                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm transform scale-105'
                                                        : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                                                        }`}
                                                >
                                                    {tag.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Link - ORDER için akıllı arama, diğerleri için manuel */}
                                    {!defaultLinkedContext && !existingNote && (
                                        <OrderLinkSection
                                            selectedEntityType={selectedEntityType}
                                            selectedEntityId={selectedEntityId}
                                            onTypeChange={setSelectedEntityType}
                                            onIdChange={setSelectedEntityId}
                                        />
                                    )}
                                </div>

                                {/* Footer Buttons */}
                                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-amber-100">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-xl border border-amber-200 transition-all"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isLoading || !title.trim()}
                                        onClick={handleSave}
                                        className="inline-flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-orange-700 text-white text-sm font-medium hover:from-amber-800 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Kaydediliyor...' : existingNote ? 'Güncelle' : 'Kaydet'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
