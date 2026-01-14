import React, { type ReactNode } from 'react'
import { Search, Filter, ChevronDown } from 'lucide-react'

interface FilterOption {
    key: string
    label: string
    activeColor?: string // e.g., 'bg-amber-600', 'bg-red-600', etc.
}

interface FilterGroup {
    label: string
    options: FilterOption[]
    value: string
    onChange: (value: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
    type?: 'buttons' | 'dropdown'
}

interface FilterSearchBarProps {
    filters: FilterGroup[]
    searchPlaceholder: string
    searchValue: string
    onSearchChange: (value: string) => void
    extraContent?: ReactNode // For custom elements like tabs
}

const FilterSearchBar: React.FC<FilterSearchBarProps> = ({
    filters,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    extraContent
}) => {
    return (
        <div className="relative group">
            {/* Main Panel - Cream/Amber Theme */}
            <div className="backdrop-blur-xl bg-[#FFFBF0]/95 border border-amber-200 rounded-3xl p-6 shadow-xl shadow-amber-900/5 transition-all">

                {/* Search Bar */}
                <div className="relative mb-8">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-amber-600" />
                    </div>
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-12 pr-28 py-4 bg-white border border-amber-200 rounded-2xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all text-lg font-light shadow-sm"
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <div className="px-3 py-1.5 rounded-lg bg-amber-50 text-xs text-amber-600 font-medium border border-amber-100">
                            CTRL + K
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-y-6 gap-x-8">
                        {filters.map((group) => (
                            <div key={group.label} className="flex flex-col gap-2">
                                <span className="text-amber-800 text-xs font-bold uppercase tracking-wider pl-1 flex items-center gap-1.5">
                                    <Filter className="w-3.5 h-3.5" />
                                    {group.label}
                                </span>

                                <div className="flex flex-wrap gap-2">
                                    {group.type === 'dropdown' ? (
                                        <div className="relative">
                                            <select
                                                value={group.value}
                                                onChange={(e) => group.onChange(e.target.value)}
                                                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm bg-white text-amber-900 border border-amber-200 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer min-w-[160px] font-medium shadow-sm"
                                            >
                                                {group.options.map((option) => (
                                                    <option
                                                        key={option.key}
                                                        value={option.key}
                                                        className="bg-white text-amber-900 py-2"
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 pointer-events-none" />
                                        </div>
                                    ) : (
                                        group.options.map((option) => {
                                            const isActive = group.value === option.key
                                            const activeColorClass = option.activeColor || 'bg-amber-600'

                                            // Handle shadow matching active color if needed, but amber shadow usually works well with amber theme
                                            // Tailwind dynamic classes like `shadow-${color}` are unreliable without safelist.
                                            // We'll stick to amber-900/10 shadow for conformity or specific if active.

                                            return (
                                                <button
                                                    key={option.key}
                                                    onClick={() => group.onChange(option.key)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${isActive
                                                            ? `${activeColorClass} text-white border-transparent transform scale-105 shadow-md shadow-amber-900/10`
                                                            : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900 shadow-sm'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {extraContent && (
                    <div className="mt-8 pt-6 border-t border-amber-200/60">
                        {extraContent}
                    </div>
                )}
            </div>
        </div>
    )
}

export default FilterSearchBar
