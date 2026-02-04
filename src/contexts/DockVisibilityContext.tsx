import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DockVisibilityContextType {
    isVisible: boolean;
    setIsVisible: (visible: boolean) => void;
    hideDock: () => void;
    showDock: () => void;
}

const DockVisibilityContext = createContext<DockVisibilityContextType | undefined>(undefined);

export const DockVisibilityProvider = ({ children }: { children: ReactNode }) => {
    const [isVisible, setIsVisible] = useState(true);

    const hideDock = () => setIsVisible(false);
    const showDock = () => setIsVisible(true);

    return (
        <DockVisibilityContext.Provider value={{ isVisible, setIsVisible, hideDock, showDock }}>
            {children}
        </DockVisibilityContext.Provider>
    );
};

export const useDockVisibility = () => {
    const context = useContext(DockVisibilityContext);
    if (!context) {
        // Return default behavior if not wrapped in provider
        return {
            isVisible: true,
            setIsVisible: () => { },
            hideDock: () => { },
            showDock: () => { }
        };
    }
    return context;
};
