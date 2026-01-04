import { MessageSquare } from 'lucide-react'
import { useTopbar } from '../context/TopbarContext'
import { useEffect } from 'react'

export default function RequestsPage() {
    const { setTopbarContent } = useTopbar()

    useEffect(() => {
        setTopbarContent({
            title: 'Talepler',
            description: 'Talep yönetimi - Yakında aktif olacak',
            icon: <MessageSquare className="w-8 h-8" />
        })

        return () => setTopbarContent(null)
    }, [setTopbarContent])

    return (
        <div className="p-6">
            <div className="backdrop-blur-sm bg-white/95 border border-amber-200 rounded-2xl p-12 text-center shadow-lg">
                <MessageSquare className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-amber-900 mb-4">Talepler</h1>
                <p className="text-amber-700">Bu sayfa yakında aktif olacak...</p>
            </div>
        </div>
    )
}
