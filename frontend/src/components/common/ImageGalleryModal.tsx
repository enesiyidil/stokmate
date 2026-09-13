import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ImageGalleryModalProps {
    isOpen: boolean
    onClose: () => void
    images: string[]
    initialIndex?: number
}

export default function ImageGalleryModal({
    isOpen,
    onClose,
    images,
    initialIndex = 0
}: ImageGalleryModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex)
        }
    }, [isOpen, initialIndex])

    if (!isOpen) return null

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex((prev) => (prev + 1) % images.length)
    }

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    const constructUrl = (path: string) => {
        return `/api/files/view?path=${encodeURIComponent(path)}`
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={onClose}>
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Main Image Container */}
            <div className="relative w-full h-full flex items-center justify-center p-4">
                <img
                    src={constructUrl(images[currentIndex])}
                    alt={`Image ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                />

                {/* Navigation Controls */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-all hover:scale-110"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-all hover:scale-110"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    </>
                )}

                {/* Counter */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm font-medium">
                    {currentIndex + 1} / {images.length}
                </div>
            </div>
        </div>
    )
}
