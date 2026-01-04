import { X, Upload, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface CompleteShipmentModalProps {
    isOpen: boolean
    onClose: () => void
    onComplete: (data: {
        deliveryStatus: 'PROBLEM_FREE' | 'PROBLEMATIC'
        problemType?: 'FACTORY_DEFECT' | 'TRANSPORT_ASSEMBLY_DEFECT'
        notes?: string
        deliveryPhotos: File[]
        signedDocument: File | null
    }) => void
    isLoading?: boolean
}

export default function CompleteShipmentModal({
    isOpen,
    onClose,
    onComplete,
    isLoading = false
}: CompleteShipmentModalProps) {
    const [deliveryStatus, setDeliveryStatus] = useState<'PROBLEM_FREE' | 'PROBLEMATIC'>('PROBLEM_FREE')
    const [problemType, setProblemType] = useState<'FACTORY_DEFECT' | 'TRANSPORT_ASSEMBLY_DEFECT'>('FACTORY_DEFECT')
    const [notes, setNotes] = useState('')
    const [deliveryPhotos, setDeliveryPhotos] = useState<File[]>([])
    const [signedDocument, setSignedDocument] = useState<File | null>(null)

    if (!isOpen) return null

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files)
            setDeliveryPhotos([...deliveryPhotos, ...filesArray])
        }
    }

    const removePhoto = (index: number) => {
        setDeliveryPhotos(deliveryPhotos.filter((_, i) => i !== index))
    }

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSignedDocument(e.target.files[0])
        }
    }

    const handleSubmit = () => {
        onComplete({
            deliveryStatus,
            problemType: deliveryStatus === 'PROBLEMATIC' ? problemType : undefined,
            notes: deliveryStatus === 'PROBLEMATIC' && notes ? notes : undefined,
            deliveryPhotos,
            signedDocument
        })
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <h3 className="text-xl font-bold text-amber-900">Sevk Tamamla</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5 text-amber-700" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Delivery Status */}
                    <div>
                        <label className="block text-sm font-semibold text-amber-900 mb-3">Teslimat Durumu</label>
                        <div className="space-y-3">
                            <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${deliveryStatus === 'PROBLEM_FREE' ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-amber-300 hover:border-amber-400 hover:bg-amber-50'}`}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${deliveryStatus === 'PROBLEM_FREE' ? 'border-green-600 bg-green-600' : 'border-gray-400 bg-white'}`}>
                                    {deliveryStatus === 'PROBLEM_FREE' && (
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <input
                                    type="radio"
                                    name="deliveryStatus"
                                    value="PROBLEM_FREE"
                                    checked={deliveryStatus === 'PROBLEM_FREE'}
                                    onChange={(e) => setDeliveryStatus(e.target.value as 'PROBLEM_FREE')}
                                    className="sr-only"
                                />
                                <span className="text-amber-900 font-semibold flex-1">Sorunsuz Teslimat</span>
                            </label>
                            <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${deliveryStatus === 'PROBLEMATIC' ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-amber-300 hover:border-amber-400 hover:bg-amber-50'}`}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${deliveryStatus === 'PROBLEMATIC' ? 'border-red-600 bg-red-600' : 'border-gray-400 bg-white'}`}>
                                    {deliveryStatus === 'PROBLEMATIC' && (
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <input
                                    type="radio"
                                    name="deliveryStatus"
                                    value="PROBLEMATIC"
                                    checked={deliveryStatus === 'PROBLEMATIC'}
                                    onChange={(e) => setDeliveryStatus(e.target.value as 'PROBLEMATIC')}
                                    className="sr-only"
                                />
                                <span className="text-amber-900 font-semibold flex-1">Sorunlu Teslimat</span>
                            </label>
                        </div>
                    </div>

                    {/* Conditional Problem Type & Notes - Only for PROBLEMATIC */}
                    {deliveryStatus === 'PROBLEMATIC' && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-amber-900 mb-2">Sorun Tipi</label>
                                <select
                                    value={problemType}
                                    onChange={(e) => setProblemType(e.target.value as 'FACTORY_DEFECT' | 'TRANSPORT_ASSEMBLY_DEFECT')}
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="FACTORY_DEFECT">Fabrika Hatası</option>
                                    <option value="TRANSPORT_ASSEMBLY_DEFECT">Teslimat/Montaj Hatası</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-amber-900 mb-2">Notlar</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Sorun hakkında detaylı açıklama yazın..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>
                        </>
                    )}

                    {/* Delivery Photos */}
                    <div>
                        <label className="block text-sm font-semibold text-amber-900 mb-2">Teslimat Görselleri</label>
                        <div className="space-y-3">
                            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                                <Upload className="w-5 h-5 text-amber-600" />
                                <span className="text-amber-700 font-medium">Görsel Yükle (Birden fazla seçilebilir)</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                            </label>

                            {deliveryPhotos.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {deliveryPhotos.map((photo, index) => (
                                        <div key={index} className="relative p-2 border border-amber-300 rounded-lg bg-amber-50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-amber-800 truncate flex-1">{photo.name}</span>
                                                <button
                                                    onClick={() => removePhoto(index)}
                                                    className="ml-2 p-1 hover:bg-red-100 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Signed Document */}
                    <div>
                        <label className="block text-sm font-semibold text-amber-900 mb-2">Teslim Tutanağı (PDF veya Görsel)</label>
                        <div className="space-y-3">
                            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                                <Upload className="w-5 h-5 text-amber-600" />
                                <span className="text-amber-700 font-medium">Tutanak Yükle</span>
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleDocumentChange}
                                    className="hidden"
                                />
                            </label>

                            {signedDocument && (
                                <div className="relative p-3 border border-amber-300 rounded-lg bg-amber-50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-amber-800 truncate flex-1">{signedDocument.name}</span>
                                        <button
                                            onClick={() => setSignedDocument(null)}
                                            className="ml-2 p-1 hover:bg-red-100 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-amber-200 bg-white">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                        disabled={isLoading}
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !signedDocument}
                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg disabled:opacity-50"
                    >
                        {isLoading ? 'Tamamlanıyor...' : 'Sevk Tamamla'}
                    </button>
                </div>
            </div>
        </div>
    )
}
