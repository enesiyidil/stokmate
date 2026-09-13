import { useEffect } from 'react'
import { TruckIcon } from 'lucide-react'
import { useTopbar } from '../context/TopbarContext'

export default function ProductOutgoingPage() {
    const { setTopbarContent } = useTopbar()

    useEffect(() => {
        setTopbarContent({
            title: 'Ürün Çıkışı',
            description: 'Ürün çıkış işlemlerini yönetin',
            icon: <TruckIcon className="w-6 h-6" />,
        })
    }, [setTopbarContent])

    return (
        <div className="p-6">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
                <TruckIcon className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold text-white mb-2">Ürün Çıkışı</h2>
                <p className="text-purple-300">Ürün çıkış modülü yakında eklenecek...</p>
            </div>
        </div>
    )
}
