import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoginMutation, useLoginWithOtpMutation, useForgotPasswordMutation } from '../../api/auth.api'
import { useAppDispatch } from '../../hooks/useAuth'
import { setCredentials } from '../../store/authSlice'
import { Lock, Mail, ArrowRight, Sparkles, Key, CheckCircle } from 'lucide-react'
import { useUi } from '../../context/UiContext'

export default function LoginPage() {
    const { currentBg, logo } = useUi()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const [login, { isLoading: isLoginLoading }] = useLoginMutation()
    const [loginWithOtp, { isLoading: isOtpLoading }] = useLoginWithOtpMutation()
    const [forgotPassword, { isLoading: isForgotLoading }] = useForgotPasswordMutation()

    const [view, setView] = useState<'login' | 'forgot-password' | 'otp-input'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [otpCode, setOtpCode] = useState('')
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const isLoading = isLoginLoading || isOtpLoading || isForgotLoading

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            // Smart detection: If input is exactly 6 digits, treat as OTP
            const isOtp = /^\d{6}$/.test(password)

            if (isOtp) {
                const result = await loginWithOtp({ email, code: password }).unwrap()
                dispatch(setCredentials(result))
                // For OTP login, we redirect to profile update to encourage password reset/update
                navigate('/profile/update')
            } else {
                const result = await login({ email, password }).unwrap()
                dispatch(setCredentials(result))
                navigate('/dashboard')
            }
        } catch (err: any) {
            setError(err?.data?.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.')
        }
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            await forgotPassword({ email }).unwrap()
            setSuccessMessage(`${email} adresine doğrulama kodu gönderildi.`)
            setView('otp-input')
        } catch (err: any) {
            setError(err?.data?.message || 'Kod gönderilemedi. Lütfen tekrar deneyin.')
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            const result = await loginWithOtp({ email, code: otpCode }).unwrap()
            dispatch(setCredentials(result))
            // Always redirect to profile update after OTP login to force password change per requirement
            navigate('/profile/update')
        } catch (err: any) {
            setError(err?.data?.message || 'Kod doğrulanamadı. Lütfen kontrol edin.')
        }
    }

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
                <div className="w-full max-w-md">
                    {/* Brand */}
                    <div className="text-center mb-8 animate-fade-in">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 border border-white/20 rounded-2xl shadow-2xl mb-4 animate-bounce-slow overflow-hidden p-3 backdrop-blur-md">
                            <img src={logo} alt="StokMate Logo" className="w-full h-full object-contain drop-shadow-md" />
                        </div>
                        <h1 className="text-4xl font-bold text-amber-900 mb-2 flex items-center justify-center gap-2 drop-shadow-sm">
                            StokMate
                            <Sparkles className="w-6 h-6 text-amber-600 animate-pulse" />
                        </h1>
                        <p className="text-amber-800 font-medium">Modern Stok Yönetim Sistemi</p>
                    </div>

                    <div className="backdrop-blur-md bg-white/80 border border-white/40 rounded-3xl shadow-2xl p-8 animate-slide-up ring-1 ring-white/50">

                        {/* Messages */}
                        {error && (
                            <div className="mb-6 bg-red-500/20 backdrop-blur-sm border border-red-500/50 text-red-900 px-4 py-3 rounded-xl flex items-center gap-2 animate-shake">
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}
                        {successMessage && (
                            <div className="mb-6 bg-green-500/20 backdrop-blur-sm border border-green-500/50 text-green-900 px-4 py-3 rounded-xl flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">{successMessage}</span>
                            </div>
                        )}

                        {view === 'login' && (
                            <form onSubmit={handleLogin} className="space-y-6">
                                <h2 className="text-xl font-semibold text-amber-900 text-center mb-4">Giriş Yap</h2>
                                <div className="group">
                                    <label className="block text-sm font-medium text-amber-800 mb-2">Email Adresi</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                            placeholder="ornek@stokmate.com"
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-amber-800">Şifre veya OTP Kodu</label>
                                        <button
                                            type="button"
                                            onClick={() => setView('forgot-password')}
                                            className="text-xs font-semibold text-amber-600 hover:text-amber-800 hover:underline"
                                        >
                                            Şifremi Unuttum?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                            placeholder="Şifre veya 6 haneli kod"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-2xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Giriş Yapılıyor...' : (
                                        <>
                                            <span>Giriş Yap</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {view === 'forgot-password' && (
                            <form onSubmit={handleForgotPassword} className="space-y-6">
                                <h2 className="text-xl font-semibold text-amber-900 text-center mb-4">Şifremi Unuttum</h2>
                                <p className="text-sm text-amber-700 text-center mb-4">
                                    Email adresinizi girin. Size geçici bir giriş kodu göndereceğiz.
                                </p>
                                <div className="group">
                                    <label className="block text-sm font-medium text-amber-800 mb-2">Email Adresi</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                            placeholder="ornek@stokmate.com"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-2xl disabled:opacity-50"
                                    >
                                        {isLoading ? 'Gönderiliyor...' : 'Kod Gönder'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setView('login')}
                                        className="text-amber-700 hover:text-amber-900 text-sm font-medium py-2"
                                    >
                                        Giriş Ekranına Dön
                                    </button>
                                </div>
                            </form>
                        )}

                        {view === 'otp-input' && (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <h2 className="text-xl font-semibold text-amber-900 text-center mb-4">Kodu Doğrula</h2>
                                <p className="text-sm text-amber-700 text-center mb-4">
                                    Email adresinize gönderilen 6 haneli kodu girin.
                                </p>
                                <div className="group">
                                    <label className="block text-sm font-medium text-amber-800 mb-2">OTP Kodu</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={(e) => setOtpCode(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono tracking-widest text-center text-lg"
                                            placeholder="123456"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-2xl disabled:opacity-50"
                                    >
                                        {isLoading ? 'Doğrulanıyor...' : 'Doğrula ve Giriş Yap'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setView('login')}
                                        className="text-amber-700 hover:text-amber-900 text-sm font-medium py-2"
                                    >
                                        İptal
                                    </button>
                                </div>
                            </form>
                        )}

                    </div>

                    <p className="text-center text-amber-700 text-sm mt-6 animate-fade-in">
                        © 2025 StokMate. Tüm hakları saklıdır.
                    </p>
                </div>
            </div>
        </div>
    )
}
