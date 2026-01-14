import { useState } from 'react'
import { X } from 'lucide-react'
import { useCreateAnnouncementMutation } from '../../services/announcementApi'
import { useToast } from '../../context/ToastContext'

interface CreateAnnouncementModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function CreateAnnouncementModal({ isOpen, onClose }: CreateAnnouncementModalProps) {
    const [content, setContent] = useState('')
    const [createAnnouncement, { isLoading }] = useCreateAnnouncementMutation()
    const { success, error } = useToast()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return

        try {
            await createAnnouncement({ content }).unwrap()
            success('Duyuru başarıyla oluşturuldu')
            setContent('')
            onClose()
        } catch (err) {
            console.error(err)
            error('Duyuru oluşturulurken bir hata oluştu')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Yeni Duyuru Oluştur</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duyuru Metni
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 min-h-[120px] resize-none text-sm"
                            placeholder="Duyuru içeriğini buraya yazın..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !content.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
