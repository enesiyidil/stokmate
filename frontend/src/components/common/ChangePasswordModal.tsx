import { useState, useEffect } from 'react'
import { X, Lock, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useChangePasswordMutation } from '../../services/userApi'
import { useAppSelector } from '../../hooks/useAuth'
import { useToast } from '../../context/ToastContext'

interface ChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const { user } = useAppSelector(state => state.auth)
    const { success, error } = useToast()
    const [changePassword, { isLoading }] = useChangePasswordMutation()

    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [totpCode, setTotpCode] = useState('')

    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Reset form on close
    useEffect(() => {
        if (!isOpen) {
            setOldPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setTotpCode('')
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (newPassword !== confirmPassword) {
            error('Yeni şifreler eşleşmiyor')
            return
        }

        if (newPassword.length < 6) {
            error('Yeni şifre en az 6 karakter olmalı')
            return
        }

        if (user?.totpEnabled && !totpCode) {
            error('2FA kodu gerekli')
            return
        }

        try {
            await changePassword({
                oldPassword,
                newPassword,
                totpCode: user?.totpEnabled ? totpCode : undefined
            }).unwrap()

            success('Şifreniz başarıyla değiştirildi')
            onClose()
        } catch (err: any) {
            const message = err?.data?.message || 'Şifre değiştirme başarısız'
            error(message)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-amber-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-amber-900">Şifre Değiştir</h2>
                            <p className="text-sm text-amber-700">Hesap şifrenizi güncelleyin</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-amber-700" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Old Password */}
                    <div>
                        <label className="block text-sm font-medium text-amber-700 mb-2">
                            Mevcut Şifre *
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                            <input
                                type={showOldPassword ? 'text' : 'password'}
                                required
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full bg-white border border-amber-300 rounded-xl py-3 pl-10 pr-12 text-amber-900 focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder="Mevcut şifrenizi girin"
                            />
                            <button
                                type="button"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-800"
                            >
                                {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-amber-700 mb-2">
                            Yeni Şifre *
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-white border border-amber-300 rounded-xl py-3 pl-10 pr-12 text-amber-900 focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder="Yeni şifrenizi girin"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-800"
                            >
                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-amber-700 mb-2">
                            Yeni Şifre (Tekrar) *
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full bg-white border rounded-xl py-3 pl-10 pr-12 text-amber-900 focus:outline-none transition-colors ${confirmPassword && newPassword !== confirmPassword
                                    ? 'border-red-400 focus:border-red-500'
                                    : 'border-amber-300 focus:border-amber-500'
                                    }`}
                                placeholder="Yeni şifrenizi tekrar girin"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-800"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">Şifreler eşleşmiyor</p>
                        )}
                    </div>

                    {/* 2FA Code - if enabled */}
                    {user?.totpEnabled && (
                        <div>
                            <label className="block text-sm font-medium text-amber-700 mb-2">
                                2FA Kodu *
                            </label>
                            <input
                                type="text"
                                required
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full bg-white border border-amber-300 rounded-xl py-3 px-4 text-amber-900 text-center text-2xl tracking-widest focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder="000000"
                                maxLength={6}
                            />
                            <p className="text-xs text-amber-600 mt-1">Authenticator uygulamanızdaki 6 haneli kodu girin</p>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 bg-amber-100 text-amber-800 rounded-xl font-medium hover:bg-amber-200 transition-colors disabled:opacity-50"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                            className="flex-1 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl font-bold hover:from-amber-800 hover:to-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
