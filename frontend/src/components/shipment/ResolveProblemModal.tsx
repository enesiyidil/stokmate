import { useState, useRef, useEffect } from 'react'
import { X, Trash2, CheckCircle, Camera } from 'lucide-react'

interface ResolveProblemModalProps {
    isOpen: boolean
    onClose: () => void
    onResolve: (data: { description: string; photos: File[] }) => void
    isLoading: boolean
}

export default function ResolveProblemModal({ isOpen, onClose, onResolve, isLoading }: ResolveProblemModalProps) {
    const [description, setDescription] = useState('')
    const [photos, setPhotos] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const previewsRef = useRef<string[]>([])
    previewsRef.current = previews

    useEffect(() => {
        if (!isOpen) {
            previewsRef.current.forEach(url => URL.revokeObjectURL(url))
            setDescription('')
            setPhotos([])
            setPreviews([])
        }
    }, [isOpen])

    useEffect(() => {
        return () => {
            previewsRef.current.forEach(url => URL.revokeObjectURL(url))
        }
    }, [])

    if (!isOpen) return null

    const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        const newPhotos = [...photos, ...files]
        setPhotos(newPhotos)

        const newPreviews = files.map(file => URL.createObjectURL(file))
        setPreviews(prev => [...prev, ...newPreviews])

        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handlePhotoRemove = (index: number) => {
        URL.revokeObjectURL(previews[index])
        setPhotos(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = () => {
        if (!description.trim()) return
        onResolve({ description: description.trim(), photos })
    }

    const handleClose = () => {
        previews.forEach(url => URL.revokeObjectURL(url))
        setDescription('')
        setPhotos([])
        setPreviews([])
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <h3 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Sorun Giderme
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-amber-50 rounded-lg transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5 text-amber-700" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-amber-900 mb-2">
                            Açıklama <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Sorunun nasıl giderildiğini açıklayın..."
                            rows={4}
                            className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                        />
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-amber-900 mb-2">
                            Fotoğraflar
                        </label>

                        {/* Photo Grid */}
                        {previews.length > 0 && (
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                {previews.map((preview, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border-2 border-amber-200 group">
                                        <img
                                            src={preview}
                                            alt={`Fotoğraf ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => handlePhotoRemove(idx)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-amber-300 rounded-lg text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-colors"
                        >
                            <Camera className="w-5 h-5" />
                            <span>Fotoğraf Ekle</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoAdd}
                            className="hidden"
                        />
                        <p className="text-xs text-amber-500 mt-1">Birden fazla fotoğraf yükleyebilirsiniz</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-amber-200 bg-white rounded-b-2xl">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                        disabled={isLoading}
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !description.trim()}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all shadow-lg disabled:opacity-50"
                    >
                        {isLoading ? 'Kaydediliyor...' : 'Sorunu Çözüldü Olarak İşaretle'}
                    </button>
                </div>
            </div>
        </div>
    )
}
