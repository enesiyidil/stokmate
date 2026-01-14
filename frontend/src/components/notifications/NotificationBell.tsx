import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X, Check, CheckCheck, AlertCircle, Truck, Package, MessageSquare, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    useGetAllNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
} from '../../services/notificationApi'
import type { NotificationResponse } from '../../services/notificationApi'

const typeConfig = {
    SHIPMENT_APPROVAL_PENDING: { icon: Truck, color: 'text-blue-600 bg-blue-100' },
    PRODUCT_ACCEPTANCE_PENDING: { icon: Package, color: 'text-green-600 bg-green-100' },
    SUPPORT_REQUEST_CREATED: { icon: MessageSquare, color: 'text-amber-600 bg-amber-100' },
    SUPPORT_REQUEST_RESOLVED: { icon: Check, color: 'text-emerald-600 bg-emerald-100' },
    ORDER_STATUS_CHANGED: { icon: AlertCircle, color: 'text-purple-600 bg-purple-100' },
}

export default function NotificationBell() {
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const { data: notifications = [], refetch } = useGetAllNotificationsQuery(undefined, {
        pollingInterval: 30000, // Poll every 30 seconds
    })
    const { data: countData } = useGetUnreadCountQuery(undefined, {
        pollingInterval: 30000,
    })
    const [markAsRead] = useMarkAsReadMutation()
    const [markAllAsRead] = useMarkAllAsReadMutation()

    const unreadCount = countData?.count ?? 0

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleNotificationClick = async (notification: NotificationResponse) => {
        if (!notification.isRead) {
            await markAsRead(notification.id)
        }
        setIsOpen(false)
        if (notification.linkUrl) {
            navigate(notification.linkUrl)
        }
    }

    const handleMarkAllAsRead = async () => {
        await markAllAsRead()
        refetch()
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-amber-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 bg-amber-50">
                        <h3 className="font-semibold text-amber-900">Bildirimler</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Tümünü Okundu İşaretle
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-amber-200 rounded transition-colors"
                            >
                                <X className="w-4 h-4 text-amber-700" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-10 h-10 text-amber-300 mx-auto mb-2" />
                                <p className="text-amber-600 text-sm">Henüz bildirim yok</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const config = typeConfig[notification.type] || { icon: AlertCircle, color: 'text-gray-600 bg-gray-100' }
                                const Icon = config.icon

                                return (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full flex items-start gap-3 p-4 hover:bg-amber-50 transition-colors border-b border-amber-100 text-left ${!notification.isRead ? 'bg-amber-50/50' : ''}`}
                                    >
                                        <div className={`p-2 rounded-lg ${config.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-amber-900' : 'text-amber-800'}`}>
                                                {notification.title}
                                            </p>
                                            {notification.message && (
                                                <p className="text-xs text-amber-600 mt-0.5 line-clamp-2">{notification.message}</p>
                                            )}
                                            <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
                                            </div>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-2" />
                                        )}
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
