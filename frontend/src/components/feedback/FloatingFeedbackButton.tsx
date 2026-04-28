import { useState } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import FeedbackFormModal from './FeedbackFormModal'

export default function FloatingFeedbackButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-105"
                title="Geri Bildirim Gönder"
            >
                <MessageSquarePlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            <FeedbackFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    )
}
