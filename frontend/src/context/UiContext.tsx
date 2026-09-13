import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import bg1 from '../assets/bg/bg1.jpg';
import bg2 from '../assets/bg/bg2.jpg';
import bg3 from '../assets/bg/bg3.jpg';
import bg4 from '../assets/bg/bg4.jpg';
import logo from '../assets/logo/dark_logo.png';

export const backgrounds = {
    'bg1': bg1,
    'bg2': bg2,
    'bg3': bg3,
    'bg4': bg4
};

export type BackgroundKey = keyof typeof backgrounds;

interface UiContextType {
    currentBg: string;
    bgKey: BackgroundKey;
    setBackground: (key: BackgroundKey) => void;
    logo: string;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
    const [bgKey, setBgKey] = useState<BackgroundKey>(() => {
        return (localStorage.getItem('ui_bg_key') as BackgroundKey) || 'bg1';
    });

    useEffect(() => {
        localStorage.setItem('ui_bg_key', bgKey);

        // Update document title and icon
        document.title = 'StokMate';

        // Update favicon dynamically
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (link) {
            link.href = logo;
        } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = logo;
            document.head.appendChild(newLink);
        }
    }, [bgKey]);

    const handleSetBackground = (key: BackgroundKey) => {
        setBgKey(key);
    };

    return (
        <UiContext.Provider value={{
            currentBg: backgrounds[bgKey],
            bgKey,
            setBackground: handleSetBackground,
            logo
        }}>
            {children}
        </UiContext.Provider>
    );
}

export function useUi() {
    const context = useContext(UiContext);
    if (!context) {
        throw new Error('useUi must be used within a UiProvider');
    }
    return context;
}
