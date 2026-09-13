import { useState, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

interface Props {
    image: string
    onClose: () => void
    onCropComplete: (croppedBlob: Blob) => void
}

export default function ImageCropperModal({ image, onClose, onCropComplete }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

    const onCropChange = useCallback((location: { x: number; y: number }) => {
        setCrop(location)
    }, [])

    const onZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom)
    }, [])

    const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const createCroppedImage = async () => {
        if (!croppedAreaPixels) return

        const canvas = document.createElement('canvas')
        const img = new Image()
        img.src = image

        await new Promise((resolve) => {
            img.onload = resolve
        })

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = croppedAreaPixels.width
        canvas.height = croppedAreaPixels.height

        ctx.drawImage(
            img,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
        )

        canvas.toBlob((blob) => {
            if (blob) {
                onCropComplete(blob)
            }
        }, 'image/jpeg', 0.95)
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-amber-200">
                    <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                        <RotateCw className="w-6 h-6" />
                        Resmi Kırp
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-amber-700" />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative h-[500px] bg-gray-900">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropCompleteCallback}
                    />
                </div>

                {/* Controls */}
                <div className="p-6 space-y-4 bg-amber-50">
                    <div className="flex items-center gap-4">
                        <ZoomOut className="w-5 h-5 text-amber-700" />
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <ZoomIn className="w-5 h-5 text-amber-700" />
                        <span className="text-sm text-amber-700 font-medium min-w-[60px]">
                            {Math.round(zoom * 100)}%
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={createCroppedImage}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-lg hover:from-amber-800 hover:to-orange-800 transition-all shadow-md"
                        >
                            <RotateCw className="w-4 h-4" />
                            Kırp ve Kaydet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
