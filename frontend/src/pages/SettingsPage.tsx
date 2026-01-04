import { useEffect } from 'react'
import { Settings as SettingsIcon, Image, Check } from 'lucide-react'
import { useTopbar } from '../context/TopbarContext'
import { useUi, backgrounds } from '../context/UiContext'
import type { BackgroundKey } from '../context/UiContext'

export default function SettingsPage() {
    const { setTopbarContent } = useTopbar()
    const { bgKey, setBackground, currentBg } = useUi()

    useEffect(() => {
        setTopbarContent({
            title: 'Ayarlar',
            description: 'Görünüm ve sistem ayarları',
            icon: <SettingsIcon className="w-6 h-6" />,
        })
    }, [setTopbarContent])

    return (
        <div className="space-y-8">
            {/* Appearance Settings */}
            <div className="backdrop-blur-xl bg-stone-900/60 border border-amber-700/30 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-amber-700/30">
                    <h3 className="text-xl font-bold text-amber-100 flex items-center gap-2">
                        <Image className="w-5 h-5 text-amber-500" />
                        Görünüm
                    </h3>
                    <p className="text-amber-400/60 text-sm mt-1">
                        Sistem arkaplanını ve temasını özelleştirin
                    </p>
                </div>

                <div className="p-8">
                    <label className="block text-sm font-medium text-amber-200/80 mb-4">
                        Arkaplan Resmi
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {(Object.keys(backgrounds) as BackgroundKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => setBackground(key)}
                                className={`
                                    relative aspect-video rounded-xl overflow-hidden transition-all duration-300 group
                                    ${bgKey === key
                                        ? 'ring-4 ring-amber-500 ring-offset-4 ring-offset-stone-900 scale-105 shadow-xl shadow-amber-900/20'
                                        : 'hover:scale-105 hover:shadow-lg hover:ring-2 hover:ring-amber-500/50'
                                    }
                                `}
                            >
                                <img
                                    src={backgrounds[key]}
                                    alt={key}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                {bgKey === key && (
                                    <div className="absolute inset-0 bg-amber-900/20 flex items-center justify-center backdrop-blur-[1px]">
                                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center shadow-lg transform scale-100 animate-bounce-short">
                                            <Check className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                                    <p className="text-white text-xs font-medium text-center capitalize">
                                        {key.replace('bg', 'Arkaplan ')}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Other Settings Placeholder */}
            <div className="backdrop-blur-xl bg-stone-900/60 border border-amber-700/30 rounded-2xl p-12 text-center opacity-70 cursor-not-allowed">
                <SettingsIcon className="w-12 h-12 text-amber-700/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-amber-200/50">Diğer Ayarlar</h3>
                <p className="text-amber-400/30 text-sm">Bildirim ve hesap ayarları yakında eklenecek</p>
            </div>
        </div>
    )
}
