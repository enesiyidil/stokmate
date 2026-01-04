import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface TopbarContextType {
    title: string
    description: string
    icon?: React.ReactNode
    actions: ReactNode
    filters: ReactNode
    showFiltersInTopbar: boolean
    setTopbarContent: (content?: { title?: string; description?: string; icon?: React.ReactNode; actions?: ReactNode; filters?: ReactNode; showFiltersInTopbar?: boolean } | null) => void
}

const TopbarContext = createContext<TopbarContextType | undefined>(undefined)

export function TopbarProvider({ children }: { children: ReactNode }) {
    const [title, setTitle] = useState('Dashboard')
    const [description, setDescription] = useState('Hoşgeldiniz')
    const [icon, setIcon] = useState<React.ReactNode>(null)
    const [actions, setActions] = useState<ReactNode>(null)
    const [filters, setFilters] = useState<ReactNode>(null)
    const [showFiltersInTopbar, setShowFiltersInTopbar] = useState(false)

    const setTopbarContent = useCallback((content?: { title?: string; description?: string; icon?: React.ReactNode; actions?: ReactNode; filters?: ReactNode; showFiltersInTopbar?: boolean } | null) => {
        if (!content) {
            setTitle('Dashboard')
            setDescription('Hoşgeldiniz')
            setIcon(null)
            setActions(null)
            setFilters(null)
            setShowFiltersInTopbar(false)
            return
        }
        setTitle(content.title ?? 'Dashboard')
        setDescription(content.description ?? 'Hoşgeldiniz')
        setIcon(content.icon ?? null)
        setActions(content.actions ?? null)
        setFilters(content.filters ?? null)
        setShowFiltersInTopbar(content.showFiltersInTopbar ?? false)
    }, [])

    return (
        <TopbarContext.Provider value={{ title, description, icon, actions, filters, showFiltersInTopbar, setTopbarContent }}>
            {children}
        </TopbarContext.Provider>
    )
}

export function useTopbar() {
    const context = useContext(TopbarContext)
    if (!context) {
        throw new Error('useTopbar must be used within TopbarProvider')
    }
    return context
}
