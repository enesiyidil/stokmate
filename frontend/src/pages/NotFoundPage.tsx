import { useNavigate } from 'react-router-dom'
import { FileX, Home, Sparkles } from 'lucide-react'
import { useUi } from '../context/UiContext'

export default function NotFoundPage() {
    const { currentBg, logo } = useUi()
    const navigate = useNavigate()

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Dynamic Background with Fade */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out scale-105"
                    style={{ backgroundImage: `url(${currentBg})` }}
                />
                <div className="absolute inset-0 bg-stone-900/30" />
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    {/* Brand */}
                    <div className="text-center mb-8 animate-fade-in">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 border border-white/20 rounded-2xl shadow-2xl mb-4 animate-bounce-slow overflow-hidden p-3 backdrop-blur-md">
                            <img src={logo} alt="StokMate Logo" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                        <div className="flex items-center justify-center gap-3">
                            <h1 className="text-4xl font-bold text-amber-900 flex items-center gap-2 drop-shadow-sm">
                                StokMate
                                <Sparkles className="w-6 h-6 text-amber-600 animate-pulse" />
                            </h1>
                            <span className="text-2xl font-light text-stone-700 border-l-2 border-stone-400 pl-3">
                                Inventory
                            </span>
                        </div>
                    </div>

                    {/* Error Card */}
                    <div className="backdrop-blur-md bg-white/80 border border-white/40 rounded-3xl shadow-2xl p-12 animate-slide-up ring-1 ring-white/50 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-6 rounded-full border-4 border-amber-300/50 shadow-lg">
                                <FileX className="w-20 h-20 text-amber-700" strokeWidth={1.5} />
                            </div>
                        </div>

                        <h2 className="text-6xl font-bold text-amber-900 mb-4">404</h2>
                        <h3 className="text-2xl font-semibold text-amber-800 mb-3">Sayfa Bulunamadı</h3>
                        <p className="text-amber-700 mb-8 text-lg">
                            Aradığınız sayfa bulunamadı veya kaldırılmış olabilir.
                        </p>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white font-semibold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-2xl flex items-center justify-center gap-3 group mx-auto text-lg"
                        >
                            <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span>Dashboard'a Dön</span>
                        </button>
                    </div>

                    <p className="text-center text-stone-900 font-medium text-sm mt-6 animate-fade-in">
                        © 2026 StokMate. Tüm hakları saklıdır.
                    </p>
                </div>
            </div>
        </div>
    )
}
