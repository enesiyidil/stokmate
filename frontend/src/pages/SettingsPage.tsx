import { useEffect } from 'react'
import { Settings, Image } from 'lucide-react'
import { useTopbar } from '../context/TopbarContext'
import { useUi, backgrounds } from '../context/UiContext'

export default function SettingsPage() {
    const { setTopbarContent } = useTopbar()
    const { currentBg, setBackground } = useUi()

    useEffect(() => {
        setTopbarContent({
            title: 'Ayarlar',
            description: 'Sistem ayarlarınızı yönetin',
            icon: <Settings className="w-8 h-8" />
        })
    }, [setTopbarContent])

    return (
        <div className="p-6 space-y-6">
            {/* Background Selection */}
            <div className="backdrop-blur-md bg-white/95 border border-amber-200 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                        <Image className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-amber-900">Arka Plan Görseli</h2>
                        <p className="text-sm text-amber-700">Sistem arka plan görselini seçin</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(backgrounds).map(([key, bgUrl]) => (
                        <button
                            key={key}
                            onClick={() => setBackground(key as any)}
                            className={`relative aspect-video rounded-xl overflow-hidden border-4 transition-all hover:scale-105 ${currentBg === bgUrl
                                ? 'border-amber-600 shadow-xl'
                                : 'border-transparent hover:border-amber-300'
                                }`}
                        >
                            <img
                                src={bgUrl}
                                alt={`Background ${key}`}
                                className="w-full h-full object-cover"
                            />
                            {currentBg === bgUrl && (
                                <div className="absolute inset-0 bg-amber-600/20 flex items-center justify-center">
                                    <div className="bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        Seçili
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Other Settings Placeholder */}
            <div className="backdrop-blur-md bg-white/95 border border-amber-200 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-amber-900 mb-4">Diğer Ayarlar</h2>
                <p className="text-amber-700">Yakında daha fazla ayar eklenecek...</p>
            </div>
        </div>
    )
}
