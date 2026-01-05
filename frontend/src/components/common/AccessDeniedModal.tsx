import { useState, useEffect } from 'react'
import { ShieldX } from 'lucide-react'

export default function AccessDeniedModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        const handleAccessDenied = (event: CustomEvent<{ message: string }>) => {
            setMessage(event.detail.message || 'Bu işlem için yetkiniz bulunmamaktadır')
            setIsOpen(true)
        }

        window.addEventListener('access-denied', handleAccessDenied as EventListener)

        return () => {
            window.removeEventListener('access-denied', handleAccessDenied as EventListener)
        }
    }, [])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white border border-red-200 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <ShieldX className="w-8 h-8 text-red-600" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-red-800 mb-2">Yetkiniz Bulunmamaktadır</h3>
                <p className="text-red-600 mb-6">{message}</p>
                <button
                    onClick={() => setIsOpen(false)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium"
                >
                    Tamam
                </button>
            </div>
        </div>
    )
}
