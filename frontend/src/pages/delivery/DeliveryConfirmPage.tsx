import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useValidateSessionQuery, useCompleteDeliveryMutation } from '../../services/delivery.api'
import { Check, Truck, X, Upload, Camera } from 'lucide-react'

// Steps: 0: Loading/Welcome, 1: Details, 2: Uploads, 3: Success

export default function DeliveryConfirmPage() {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    const { data: session, isLoading, error } = useValidateSessionQuery(token || '')
    const [completeDelivery, { isLoading: isSubmitting }] = useCompleteDeliveryMutation()

    const [currentStep, setCurrentStep] = useState(0)
    const [formData, setFormData] = useState({
        deliveryStatus: 'PROBLEM_FREE', // PROBLEM_FREE, PROBLEMATIC
        problemType: 'FACTORY_DEFECT', // FACTORY_DEFECT, TRANSPORT_ASSEMBLY_DEFECT
        deliveryNotes: '',
        receiverName: '',
        actualShipmentDate: new Date().toISOString().slice(0, 16), // datetime-local format
    })

    const [signedDoc, setSignedDoc] = useState<File | null>(null)
    const [photos, setPhotos] = useState<File[]>([])

    // Handlers
    const handleStatusSelect = (status: string) => {
        setFormData(prev => ({ ...prev, deliveryStatus: status }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'doc' | 'photo') => {
        if (e.target.files && e.target.files.length > 0) {
            if (type === 'doc') {
                setSignedDoc(e.target.files[0])
            } else {
                setPhotos(prev => [...prev, ...Array.from(e.target.files || [])])
            }
        }
    }

    const handleSubmit = async () => {
        if (!token) return

        const data = new FormData()
        data.append('deliveryStatus', formData.deliveryStatus)
        if (formData.deliveryStatus === 'PROBLEMATIC') {
            data.append('problemType', formData.problemType)
            data.append('deliveryNotes', formData.deliveryNotes)
        }
        data.append('receiverName', formData.receiverName)
        // Convert datetime-local to ISO or backend format if needed, backend expects LocalDateTime compatible string?
        // Spring Boot usually parses ISO 8601.
        data.append('actualShipmentDate', formData.actualShipmentDate)

        if (signedDoc) data.append('signedDocument', signedDoc)
        photos.forEach(p => data.append('deliveryPhotos', p))

        try {
            await completeDelivery({ token, data }).unwrap()
            setCurrentStep(3) // Success
        } catch (err) {
            console.error(err)
            alert("Teslimat tamamlanırken bir hata oluştu.")
        }
    }

    if (isLoading) return <div className="p-8 text-center text-white">Yükleniyor...</div>
    if (error || !session) return <div className="p-8 text-center text-red-400">Geçersiz veya süresi dolmuş bağlantı.</div>
    if (session.completed && currentStep !== 3) return <div className="p-8 text-center text-green-400">Bu teslimat zaten tamamlanmış.</div>

    return (
        <div className="min-h-screen bg-stone-900 text-stone-100 font-sans p-4 safe-area-inset-bottom">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 border-b border-stone-800 pb-4">
                <Truck className="w-6 h-6 text-amber-500" />
                <h1 className="text-xl font-bold text-amber-500">Teslimat Onayı</h1>
            </div>

            {/* Stepper Content */}

            {/* Step 0: Welcome & Info */}
            {currentStep === 0 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-stone-800 rounded-xl p-4 border border-stone-700">
                        <h2 className="text-stone-400 text-sm font-semibold uppercase tracking-wider mb-2">Müşteri Bilgileri</h2>
                        <div className="text-lg font-bold">{session.customerName}</div>
                        <div className="text-stone-400 text-sm mt-1">{session.customerAddress}</div>
                        <div className="text-amber-500 mt-2">{session.customerPhone}</div>
                    </div>

                    <div className="bg-stone-800 rounded-xl p-4 border border-stone-700">
                        <h2 className="text-stone-400 text-sm font-semibold uppercase tracking-wider mb-4">Teslim Edilecek Ürünler</h2>
                        <div className="space-y-3">
                            {session.products.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-stone-700 pb-2 last:border-0 last:pb-0">
                                    <div className="flex-1">
                                        <div className="font-medium text-stone-200">{p.name}</div>
                                        <div className="text-xs text-stone-500 font-mono">{p.code}</div>
                                    </div>
                                    <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full font-bold">
                                        x{p.quantity}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => setCurrentStep(1)}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-95 transition-all"
                    >
                        Teslimatı Başlat
                    </button>
                </div>
            )}

            {/* Step 1: Status & Details */}
            {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">

                    <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">Teslimat Durumu</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleStatusSelect('PROBLEM_FREE')}
                                className={`p-4 rounded-xl border-2 font-bold transition-all ${formData.deliveryStatus === 'PROBLEM_FREE' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-stone-800 border-stone-700 text-stone-400'}`}
                            >
                                Sorunsuz Teslimat
                            </button>
                            <button
                                onClick={() => handleStatusSelect('PROBLEMATIC')}
                                className={`p-4 rounded-xl border-2 font-bold transition-all ${formData.deliveryStatus === 'PROBLEMATIC' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-stone-800 border-stone-700 text-stone-400'}`}
                            >
                                Sorunlu Teslimat
                            </button>
                        </div>
                    </div>

                    {formData.deliveryStatus === 'PROBLEMATIC' && (
                        <div className="animate-fade-in space-y-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                            <div>
                                <label className="block text-sm font-medium text-stone-400 mb-2">Sorun Tipi</label>
                                <select
                                    value={formData.problemType}
                                    onChange={e => setFormData({ ...formData, problemType: e.target.value })}
                                    className="w-full bg-stone-800 border border-stone-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                >
                                    <option value="FACTORY_DEFECT">Fabrika Hatası</option>
                                    <option value="TRANSPORT_ASSEMBLY_DEFECT">Nakliye/Montaj Hatası</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-400 mb-2">Sorun Notları</label>
                                <textarea
                                    value={formData.deliveryNotes}
                                    onChange={e => setFormData({ ...formData, deliveryNotes: e.target.value })}
                                    rows={3}
                                    className="w-full bg-stone-800 border border-stone-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="Sorun detaylarını yazınız..."
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">Teslim Alan Kişi</label>
                        <input
                            type="text"
                            value={formData.receiverName}
                            onChange={e => setFormData({ ...formData, receiverName: e.target.value })}
                            className="w-full bg-stone-800 border border-stone-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Ad Soyad"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-400 mb-2">Teslim Tarihi/Saati</label>
                        <input
                            type="datetime-local"
                            value={formData.actualShipmentDate}
                            onChange={e => setFormData({ ...formData, actualShipmentDate: e.target.value })}
                            className="w-full bg-stone-800 border border-stone-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-amber-500 outline-none  text-lg"
                        />
                    </div>


                    <div className="flex gap-3">
                        <button
                            onClick={() => setCurrentStep(0)}
                            className="flex-1 bg-stone-800 text-stone-400 font-bold py-4 rounded-xl"
                        >
                            Geri
                        </button>
                        <button
                            onClick={() => setCurrentStep(2)}
                            disabled={!formData.receiverName}
                            className="flex-2 w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Devam Et
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Files */}
            {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">

                    <div className="bg-stone-800/50 p-4 rounded-xl border border-dashed border-stone-600 text-center relative">
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={e => handleFileChange(e, 'doc')}
                            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                            <Upload className="w-8 h-8 text-amber-500" />
                            <div className="font-bold text-stone-200">İmzalı Belge Yükle</div>
                            {signedDoc ? (
                                <div className="text-green-400 text-sm truncate max-w-full px-4">{signedDoc.name}</div>
                            ) : (
                                <div className="text-stone-500 text-sm">Fotoğraf veya PDF</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-stone-800/50 p-4 rounded-xl border border-dashed border-stone-600 text-center relative">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={e => handleFileChange(e, 'photo')}
                            className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                            <Camera className="w-8 h-8 text-amber-500" />
                            <div className="font-bold text-stone-200">Teslimat Fotoğrafları</div>
                            {photos.length > 0 ? (
                                <div className="text-green-400 text-sm">{photos.length} fotoğraf seçildi</div>
                            ) : (
                                <div className="text-stone-500 text-sm">Ürünlerin durumunu gösteren fotoğraflar</div>
                            )}
                        </div>
                    </div>

                    {/* Photos Preview */}
                    {photos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {photos.map((p, i) => (
                                <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-stone-700">
                                    <img src={URL.createObjectURL(p)} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setCurrentStep(1)}
                            className="flex-1 bg-stone-800 text-stone-400 font-bold py-4 rounded-xl"
                        >
                            Geri
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'Tamamlanıyor...' : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Teslimatı Tamamla
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Success */}
            {currentStep === 3 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in text-center">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border-2 border-green-500 text-green-500">
                        <Check className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Teslimat Kaydedildi!</h2>
                    <p className="text-stone-400 mb-8 max-w-xs">
                        Teslimat bilgileri başarıyla sisteme işlendi. Tarayıcıyı kapatabilirsiniz.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="hidden md:block bg-stone-800 hover:bg-stone-700 text-white font-bold py-3 px-8 rounded-xl"
                    >
                        Ana Sayfaya Dön
                    </button>
                </div>
            )}
        </div>
    )
}
