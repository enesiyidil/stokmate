import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Info, Mail, User, Calendar, Tag, Globe, Code } from 'lucide-react'
import { useTopbar } from '../context/TopbarContext'
import { useEffect } from 'react'

const AboutPage: React.FC = () => {
    const navigate = useNavigate()
    const { setTopbarContent } = useTopbar()

    useEffect(() => {
        setTopbarContent({
            title: 'Hakkında',
            description: 'StokMate Uygulama Bilgileri',
            icon: <Info className="w-8 h-8" />,
            showFiltersInTopbar: true,
            filters: (
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Geri
                </button>
            )
        })

        return () => setTopbarContent(null)
    }, [setTopbarContent, navigate])

    return (
        <div className="min-h-screen">
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* Main About Card */}
                <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <span className="text-3xl font-bold text-white">S</span>
                        </div>
                        <h1 className="text-3xl font-bold text-amber-900 mb-2">StokMate</h1>
                        <p className="text-amber-600">Modern Stok Yönetim Sistemi</p>
                    </div>

                    <div className="prose prose-amber max-w-none text-amber-800 mb-8">
                        <p className="text-center leading-relaxed">
                            StokMate, işletmelerin stok ve envanter süreçlerini daha düzenli, hızlı ve güvenilir şekilde
                            yönetebilmesi için geliştirilmiş modern bir stok yönetim uygulamasıdır.
                        </p>
                        <p className="text-center leading-relaxed">
                            Kullanıcı dostu arayüzü ve esnek yapısı sayesinde günlük operasyonları kolaylaştırmayı,
                            veri takibini sadeleştirmeyi ve operasyonel verimliliği artırmayı amaçlar.
                        </p>
                        <p className="text-center leading-relaxed">
                            Uygulama; ürün, stok hareketleri ve temel operasyonel süreçlerin yönetimini tek bir platform
                            üzerinden sunarak, işletmelerin süreçlerine pratik ve ölçeklenebilir bir çözüm sağlar.
                        </p>
                    </div>
                </div>

                {/* Application Info Card */}
                <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">
                    <h2 className="text-xl font-bold text-amber-900 mb-6 flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Uygulama Bilgileri
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Tag className="w-5 h-5 text-amber-600" />
                                <span className="text-sm text-amber-700">Sürüm</span>
                            </div>
                            <p className="text-lg font-bold text-amber-900 font-mono">{import.meta.env.VITE_APP_VERSION}</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Code className="w-5 h-5 text-blue-600" />
                                <span className="text-sm text-blue-700">Ortam</span>
                            </div>
                            <p className="text-lg font-bold text-blue-900">Test</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-green-700">Yayın Tarihi</span>
                            </div>
                            <p className="text-lg font-bold text-green-900">05.01.2026</p>
                        </div>
                    </div>
                </div>

                {/* Developer Card */}
                <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">
                    <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Geliştirici
                    </h2>
                    <p className="text-amber-800">
                        Bu uygulama <span className="font-semibold text-amber-900">Enes İyidil</span> tarafından geliştirilmiştir.
                    </p>
                </div>

                {/* Support Card */}
                <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">
                    <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Destek & İletişim
                    </h2>
                    <p className="text-amber-800 mb-4">
                        Her türlü soru, geri bildirim ve destek talepleriniz için:
                    </p>
                    <a
                        href="mailto:support@stokmate.com"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-md"
                    >
                        <Mail className="w-4 h-4" />
                        support@stokmate.com
                    </a>
                </div>

                {/* Footer */}
                <div className="text-center py-4">
                    <p className="text-amber-600 text-sm">
                        © 2026 StokMate. Tüm hakları saklıdır.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AboutPage
