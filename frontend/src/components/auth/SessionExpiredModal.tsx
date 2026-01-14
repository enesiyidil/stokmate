import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Shield, LogOut, RefreshCcw, AlertTriangle } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '../../hooks/useAuth'
import { logout, setCredentials, setSessionExpired } from '../../store/authSlice'
import { useReauthenticateMutation } from '../../api/auth.api'

export default function SessionExpiredModal() {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const { sessionExpired, user } = useAppSelector((state) => state.auth)
    const [reauthenticate, { isLoading }] = useReauthenticateMutation()

    const [password, setPassword] = useState('')
    const [twoFactorCode, setTwoFactorCode] = useState('')
    const [showTwoFactor, setShowTwoFactor] = useState(false)
    const [error, setError] = useState('')

    // Reset state when modal opens
    useEffect(() => {
        if (sessionExpired) {
            setPassword('')
            setTwoFactorCode('')
            setShowTwoFactor(false)
            setError('')
        }
    }, [sessionExpired])

    const handleReauth = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!user?.email) {
            setError('Kullanıcı bilgisi bulunamadı')
            return
        }

        try {
            const result = await reauthenticate({
                email: user.email,
                password,
                twoFactorCode: showTwoFactor ? twoFactorCode : undefined,
            }).unwrap()

            // Check if 2FA is required
            if (result.requiresTwoFactor && !showTwoFactor) {
                setShowTwoFactor(true)
                return
            }

            // Success - update credentials and reload page to refresh all data
            if (result.token && result.user) {
                dispatch(setCredentials({ user: result.user, token: result.token }))
                // Reload the page to refresh all data
                window.location.reload()
            }
        } catch (err: any) {
            setError(err?.data?.message || 'Kimlik doğrulama başarısız')
        }
    }

    const handleLogout = () => {
        dispatch(logout())
        dispatch(setSessionExpired(false))
        navigate('/login')
    }

    if (!sessionExpired) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Oturumunuz Sona Erdi</h3>
                            <p className="text-amber-100 text-sm">Devam etmek için şifrenizi girin</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* User info */}
                    <div className="mb-6 p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <p className="text-sm text-amber-700">Oturum açan kullanıcı:</p>
                        <p className="font-semibold text-amber-900">{user?.email}</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleReauth} className="space-y-4">
                        {/* Password field */}
                        <div>
                            <label className="block text-sm font-medium text-amber-800 mb-2">
                                Şifre
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    placeholder="Şifrenizi girin"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* 2FA field - shown if required */}
                        {showTwoFactor && (
                            <div>
                                <label className="block text-sm font-medium text-amber-800 mb-2">
                                    Google Authenticator Kodu
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                                    <input
                                        type="text"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                                        maxLength={6}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-widest text-center text-lg"
                                        placeholder="000000"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                            >
                                <LogOut className="w-4 h-4" />
                                Çıkış Yap
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !password || (showTwoFactor && twoFactorCode.length !== 6)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? 'Doğrulanıyor...' : 'Oturumu Yenile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
