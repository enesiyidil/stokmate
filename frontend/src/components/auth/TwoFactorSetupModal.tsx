import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

interface TwoFactorSetupModalProps {
    isOpen: boolean;
    email?: string;
    qrCodeImage?: string;
    secret?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({
    isOpen,
    email: propEmail,
    qrCodeImage: propQrCodeImage,
    secret: propSecret,
    onClose,
    onSuccess,
}) => {
    const [qrCodeImage, setQrCodeImage] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && propQrCodeImage && propSecret) {
            setQrCodeImage(propQrCodeImage);
            setSecret(propSecret);
        }
    }, [isOpen, propQrCodeImage, propSecret]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const email = propEmail || '';
            console.log('Sending complete-setup:', { email, code: verificationCode });

            const response = await axios.post('/api/auth/complete-setup', {
                email,
                code: verificationCode
            });

            // Save token and user
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }

            onSuccess();
        } catch (error: any) {
            console.error('Setup error:', error.response?.data);
            setError(error.response?.data?.message || error.response?.data?.detail || 'Doğrulama başarısız. Lütfen kodu kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        İki Faktörlü Doğrulama Kurulumu
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Instructions */}
                <div className="mb-6 space-y-3">
                    <p className="text-sm text-gray-600">
                        <strong className="text-gray-900">1.</strong> Google Authenticator uygulamasını açın
                    </p>
                    <p className="text-sm text-gray-600">
                        <strong className="text-gray-900">2.</strong> Aşağıdaki QR kodunu tarayın
                    </p>
                    <p className="text-sm text-gray-600">
                        <strong className="text-gray-900">3.</strong> Uygulamada görünen 6 haneli kodu girin
                    </p>
                </div>

                {/* QR Code */}
                {qrCodeImage && (
                    <div className="flex justify-center mb-6">
                        <div className="border-4 border-gray-200 rounded-xl p-4 bg-white">
                            <img
                                src={qrCodeImage}
                                alt="QR Code"
                                className="w-48 h-48"
                            />
                        </div>
                    </div>
                )}

                {/* Secret (manual entry option) */}
                {secret && (
                    <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">
                            Manuel giriş için kod:
                        </p>
                        <p className="text-sm font-mono text-gray-900 break-all">
                            {secret}
                        </p>
                    </div>
                )}

                {/* Verification Form */}
                <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Doğrulama Kodu (6 haneli)
                        </label>
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                            placeholder="000000"
                            maxLength={6}
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                            disabled={loading || verificationCode.length !== 6}
                        >
                            {loading ? 'Doğrulanıyor...' : 'Doğrula'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
