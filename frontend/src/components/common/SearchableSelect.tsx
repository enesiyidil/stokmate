import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'

interface Props {
    value: string
    onChange: (value: string) => void
    options: string[]
    placeholder?: string
    className?: string
    required?: boolean
}

export default function SearchableSelect({ value, onChange, options, placeholder, className = '', required }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
    )

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
                <span className={value ? 'text-white' : 'text-purple-300'}>{value || placeholder}</span>
                <ChevronDown className="w-4 h-4 text-purple-300" />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-white/10 rounded-lg shadow-xl max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Ara..."
                                className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        onChange(option)
                                        setIsOpen(false)
                                        setSearch('')
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${value === option
                                            ? 'bg-purple-500/30 text-white font-medium'
                                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-purple-300 text-sm">
                                Sonuç bulunamadı
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
