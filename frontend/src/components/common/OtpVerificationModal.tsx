import { useState, useRef, useEffect } from 'react'
import { X, ShieldCheck, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVerifyGate2FAMutation } from '../../services/userApi'

interface Props {
    isOpen: boolean
    onClose: () => void
    onVerify: () => void
    isLoading?: boolean
    title?: string
    description?: string
}

export default function OtpVerificationModal({
    isOpen,
    onClose,
    onVerify,
    isLoading: externalLoading,
    title = "Güvenlik Doğrulaması",
    description = "Devam etmek için lütfen authenticator uygulamanızdaki 6 haneli kodu giriniz."
}: Props) {
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const [error, setError] = useState('')
    const [verify2FA, { isLoading: isVerifying }] = useVerifyGate2FAMutation()

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setOtp(['', '', '', '', '', ''])
            setError('')
            setTimeout(() => {
                inputRefs.current[0]?.focus()
            }, 100)
        }
    }, [isOpen])

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false

        const newOtp = [...otp]
        newOtp[index] = element.value
        setOtp(newOtp)

        // Clear error when user types
        if (error) setError('')

        // Focus next input
        if (element.value !== '' && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto submit
        if (newOtp.every(digit => digit !== '') && index === 5) {
            handleVerify(newOtp.join(''))
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            if (index > 0 && otp[index] === '') {
                const newOtp = [...otp]
                newOtp[index - 1] = ''
                setOtp(newOtp)
                inputRefs.current[index - 1]?.focus()
            } else {
                const newOtp = [...otp]
                newOtp[index] = ''
                setOtp(newOtp)
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('')
        if (pastedData.every(char => !isNaN(Number(char)))) {
            const newOtp = [...otp]
            pastedData.forEach((char, index) => {
                if (index < 6) newOtp[index] = char
            })
            setOtp(newOtp)
            if (pastedData.length === 6) {
                inputRefs.current[5]?.focus()
                handleVerify(newOtp.join(''))
            } else {
                inputRefs.current[pastedData.length]?.focus()
            }
        }
    }

    const handleVerify = async (codeIs: string) => {
        // Prevent double verify
        if (isVerifying || externalLoading) return

        try {
            const result = await verify2FA(codeIs).unwrap()
            if (result) {
                onVerify()
            } else {
                setError('Hatalı doğrulama kodu')
                setOtp(['', '', '', '', '', ''])
                inputRefs.current[0]?.focus()
            }
        } catch (err) {
            setError('Doğrulama başarısız oldu')
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        }
    }

    const isLoading = isVerifying || externalLoading

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                >
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {title}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                            {description}
                        </p>

                        <div className="flex gap-2 justify-center mb-6">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleChange(e.target, index)}
                                    onKeyDown={e => handleKeyDown(e, index)}
                                    onPaste={handlePaste}
                                    disabled={isLoading}
                                    className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none
                                        ${error
                                            ? 'border-red-300 bg-red-50 text-red-600 focus:ring-red-500'
                                            : 'border-gray-200 bg-gray-50 text-gray-800'
                                        }
                                        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                />
                            ))}
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-500 text-sm font-medium mb-4 bg-red-50 py-2 rounded-lg"
                            >
                                {error}
                            </motion.p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => handleVerify(otp.join(''))}
                                disabled={isLoading || otp.some(d => d === '')}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Kontrol Ediliyor...</span>
                                    </>
                                ) : (
                                    <span>Doğrula</span>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
