import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    showSearchModal: boolean;
    openSearch: () => void;
    closeSearch: () => void;
    clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchModal, setShowSearchModal] = useState(false);

    const openSearch = useCallback(() => setShowSearchModal(true), []);
    const closeSearch = useCallback(() => setShowSearchModal(false), []);
    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setShowSearchModal(false);
    }, []);

    return (
        <SearchContext.Provider value={{
            searchQuery,
            setSearchQuery,
            showSearchModal,
            openSearch,
            closeSearch,
            clearSearch
        }}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
};
