import {
    TrendingUp,
    Package,
    ShoppingCart,
    Users,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react'

export default function DashboardPage() {
    const stats = [
        {
            title: 'Toplam Sipariş',
            value: '1,234',
            change: '+12.5%',
            isPositive: true,
            icon: ShoppingCart,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            title: 'Toplam Ürün',
            value: '456',
            change: '+8.2%',
            isPositive: true,
            icon: Package,
            color: 'from-purple-500 to-pink-500'
        },
        {
            title: 'Aktif Müşteri',
            value: '89',
            change: '+23.1%',
            isPositive: true,
            icon: Users,
            color: 'from-green-500 to-emerald-500'
        },
        {
            title: 'Toplam Gelir',
            value: '₺45.2K',
            change: '-3.4%',
            isPositive: false,
            icon: DollarSign,
            color: 'from-orange-500 to-yellow-500'
        }
    ]

    const recentOrders = [
        { id: '#12345', customer: 'Ahmet Yılmaz', product: 'Laptop', status: 'Tamamlandı', amount: '₺15,000' },
        { id: '#12346', customer: 'Ayşe Demir', product: 'Mouse', status: 'Beklemede', amount: '₺250' },
        { id: '#12347', customer: 'Mehmet Kaya', product: 'Keyboard', status: 'İptal', amount: '₺500' },
        { id: '#12348', customer: 'Fatma Şahin', product: 'Monitor', status: 'Tamamlandı', amount: '₺3,200' },
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Tamamlandı':
                return 'bg-green-500/20 text-green-300 border-green-500/30'
            case 'Beklemede':
                return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
            case 'İptal':
                return 'bg-red-500/20 text-red-300 border-red-500/30'
            default:
                return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
        }
    }

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl group animate-slide-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-semibold ${stat.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                {stat.isPositive ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4" />
                                )}
                                {stat.change}
                            </div>
                        </div>
                        <h3 className="text-purple-200 text-sm font-medium mb-1">{stat.title}</h3>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-purple-400" />
                        Son Siparişler
                    </h2>
                    <button className="text-purple-300 hover:text-white text-sm font-medium transition-colors">
                        Tümünü Gör →
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-purple-200 font-semibold text-sm">Sipariş No</th>
                                <th className="text-left py-3 px-4 text-purple-200 font-semibold text-sm">Müşteri</th>
                                <th className="text-left py-3 px-4 text-purple-200 font-semibold text-sm">Ürün</th>
                                <th className="text-left py-3 px-4 text-purple-200 font-semibold text-sm">Durum</th>
                                <th className="text-right py-3 px-4 text-purple-200 font-semibold text-sm">Tutar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                    <td className="py-4 px-4">
                                        <span className="text-white font-mono text-sm">{order.id}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="text-purple-100">{order.customer}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="text-purple-100">{order.product}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <span className="text-white font-semibold">{order.amount}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 rounded-2xl p-6 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 hover:scale-105 group">
                    <Package className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-semibold mb-1">Yeni Ürün</h3>
                    <p className="text-purple-200 text-sm">Sisteme ürün ekle</p>
                </button>

                <button className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/20 rounded-2xl p-6 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 hover:scale-105 group">
                    <ShoppingCart className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-semibold mb-1">Yeni Sipariş</h3>
                    <p className="text-purple-200 text-sm">Sipariş oluştur</p>
                </button>

                <button className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/20 rounded-2xl p-6 hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300 hover:scale-105 group">
                    <Users className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-semibold mb-1">Yeni Müşteri</h3>
                    <p className="text-purple-200 text-sm">Müşteri kaydı yap</p>
                </button>
            </div>
        </div>
    )
}
