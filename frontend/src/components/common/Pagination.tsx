import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    page: number
    totalPages: number
    totalElements: number
    onPageChange: (page: number) => void
    itemLabel?: string
}

export default function Pagination({ page, totalPages, totalElements, onPageChange, itemLabel = 'kayıt' }: PaginationProps) {
    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-between px-6 py-4 border-t border-amber-200/50">
            <p className="text-sm text-amber-700">
                Toplam <span className="font-semibold text-amber-900">{totalElements}</span> {itemLabel}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 px-3 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Önceki
                </button>
                <span className="px-3 py-2 text-sm text-amber-900 font-medium">
                    {page + 1} / {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 px-3 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
                >
                    Sonraki
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
