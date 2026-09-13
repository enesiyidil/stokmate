import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Phone, MapPin, CheckCircle, FileText, X } from 'lucide-react'
import { useUpdateProfileMutation } from '../services/userApi'
import { useAppDispatch } from '../hooks/useAuth'
import { setUser } from '../store/authSlice'

export default function ProfileUpdatePage() {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const [updateProfile, { isLoading }] = useUpdateProfileMutation()

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: ''
    })
    const [kvkkConsent, setKvkkConsent] = useState(false)
    const [showKvkkModal, setShowKvkkModal] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor')
            return
        }

        if (formData.password.length < 8) {
            setError('Şifre en az 8 karakter olmalıdır')
            return
        }

        if (!kvkkConsent) {
            setError('Devam etmek için KVKK metnini okuyup onaylamanız gerekmektedir')
            return
        }

        try {
            const updated = await updateProfile({
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                address: formData.address,
                password: formData.password
            }).unwrap()

            // Update user in Redux store
            dispatch(setUser({
                id: updated.id,
                email: updated.email,
                firstName: updated.firstName || null,
                lastName: updated.lastName || null,
                role: updated.role as 'ADMIN' | 'DEPO' | 'USER',
                active: updated.active
            }))

            navigate('/dashboard')
        } catch (err: any) {
            setError(err.data?.message || 'Profil güncellenirken bir hata oluştu')
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
            {/* Animated background circles */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-orange-400/10 to-amber-400/10 rounded-full blur-3xl animate-pulse"></div>
            </div>

            <div className="relative w-full max-w-2xl">
                <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl shadow-2xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-700 to-orange-700 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-amber-900 mb-2">Profilinizi Tamamlayın</h1>
                        <p className="text-amber-700">İlk giriş yapıyorsunuz. Lütfen bilgilerinizi güncelleyin.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-2">
                                    Ad *
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                    placeholder="Adınız"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-2">
                                    Soyad *
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                    placeholder="Soyadınız"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-amber-700 mb-2">
                                <Phone className="w-4 h-4 inline mr-1" />
                                Telefon
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                placeholder="+90 555 555 55 55"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-amber-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                Adres
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                                placeholder="Adresiniz"
                            />
                        </div>

                        {/* Password Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-2">
                                    <Lock className="w-4 h-4 inline mr-1" />
                                    Yeni Şifre *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                    placeholder="En az 8 karakter"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-amber-700 mb-2">
                                    <Lock className="w-4 h-4 inline mr-1" />
                                    Şifre Tekrar *
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                                    placeholder="Şifrenizi tekrar girin"
                                />
                            </div>
                        </div>

                        {/* KVKK Consent */}
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={kvkkConsent}
                                    onChange={(e) => setKvkkConsent(e.target.checked)}
                                    className="mt-1 w-5 h-5 rounded border-amber-300 bg-white text-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                                />
                                <span className="text-sm text-amber-800 flex-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowKvkkModal(true)}
                                        className="text-amber-700 hover:text-amber-900 underline font-medium inline-flex items-center gap-1"
                                    >
                                        <FileText className="w-4 h-4" />
                                        KVKK Aydınlatma Metni
                                    </button>
                                    {' '}ni okudum, anladım ve kişisel verilerimin işlenmesine açık rıza gösteriyorum. *
                                </span>
                            </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-100 border border-red-300 rounded-xl text-red-800 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-6 py-4 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-semibold"
                        >
                            {isLoading ? (
                                'Güncelleniyor...'
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Profili Tamamla
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* KVKK Modal */}
            {showKvkkModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-amber-200">
                            <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                                <FileText className="w-6 h-6" />
                                KVKK Aydınlatma Metni
                            </h2>
                            <button
                                onClick={() => setShowKvkkModal(false)}
                                className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 text-amber-800 space-y-4 text-sm">
                            <p className="font-semibold text-amber-900">Sayın Kullanıcı,</p>

                            <p>6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verilerinizin korunması bizim için önemlidir. Bu metin ile kişisel verilerinizin StokMate sisteminde nasıl işlendiği konusunda sizi bilgilendiriyoruz.</p>

                            <h3 className="font-semibold text-amber-900 mt-4">1. Veri Sorumlusu</h3>
                            <p>StokMate platformu veri sorumlusu sıfatıyla kişisel verilerinizi işlemektedir.</p>

                            <h3 className="font-semibold text-amber-900 mt-4">2. İşlenen Kişisel Veriler</h3>
                            <p>Aşağıdaki kişisel verileriniz işlenmektedir:</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>Kimlik bilgileri (ad, soyad)</li>
                                <li>İletişim bilgileri (telefon, e-posta, adres)</li>
                                <li>Kullanıcı hesap bilgileri</li>
                                <li>İşlem güvenliği bilgileri (IP adresi, sistem logları)</li>
                            </ul>

                            <h3 className="font-semibold text-amber-900 mt-4">3. Kişisel Verilerin İşlenme Amacı</h3>
                            <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>Stok yönetim sisteminin sunulması ve işletilmesi</li>
                                <li>Kullanıcı hesabınızın oluşturulması ve yönetilmesi</li>
                                <li>Sipariş, ürün ve satış işlemlerinin gerçekleştirilmesi</li>
                                <li>İletişim faaliyetlerinin yürütülmesi</li>
                                <li>Sistem güvenliğinin sağlanması</li>
                                <li>Hukuki yükümlülüklerin yerine getirilmesi</li>
                            </ul>

                            <h3 className="font-semibold text-amber-900 mt-4">4. Kişisel Verilerin Aktarılması</h3>
                            <p>Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda iş ortaklarımıza, tedarikçilerimize, hukuki mercilere ve yetkili kamu kurumlarına KVKK'nın 8. ve 9. maddelerinde belirtilen şartlar çerçevesinde aktarılabilecektir.</p>

                            <h3 className="font-semibold text-amber-900 mt-4">5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h3>
                            <p>Kişisel verileriniz, elektronik ortamda profil oluşturma formları aracılığıyla toplanmakta ve KVKK'nın 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları ve amaçları kapsamında işlenmektedir.</p>

                            <h3 className="font-semibold text-amber-900 mt-4">6. KVKK Kapsamındaki Haklarınız</h3>
                            <p>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                                <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                                <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                                <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                                <li>Eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme</li>
                                <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
                                <li>Düzeltme, silme ve yok edilme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                                <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                                <li>Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
                            </ul>

                            <p className="mt-4 font-medium">Yukarıda belirtilen haklarınızı kullanmak için sistem yöneticisi ile iletişime geçebilirsiniz.</p>
                        </div>
                        <div className="p-6 border-t border-amber-200">
                            <button
                                onClick={() => {
                                    setKvkkConsent(true)
                                    setShowKvkkModal(false)
                                }}
                                className="w-full px-6 py-3 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-xl hover:from-amber-800 hover:to-orange-800 transition-all shadow-md"
                            >
                                Okudum, Anladım ve Onaylıyorum
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
