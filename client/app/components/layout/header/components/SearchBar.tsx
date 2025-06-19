// ~/components/layout/Header/components/SearchBar.tsx
import { Clock, Search, TrendingUp, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { cn } from '~/lib/utils';

interface SearchBarProps {
    onSearch?: (query: string) => void;
    placeholder?: string;
    className?: string;
}

// Configuration
const CONFIG = {
    MAX_SUGGESTIONS: 6,
    MAX_RECENT_SEARCHES: 5,
    DEBOUNCE_DELAY: 300,
    STORAGE_KEY: 'recentSearches'
};

// Mock data
const TRENDING_SEARCHES = [
    "iPhone 15 Pro Max",
    "MacBook Air M3",
    "Samsung Galaxy S24",
    "AirPods Pro 2",
    "iPad Pro 12.9"
];

const MOCK_SUGGESTIONS = [
    "iPhone 15 Pro Max 256GB",
    "iPhone 15 Pro Natural Titanium",
    "iPhone 15 Plus Blue",
    "MacBook Air M3 15 inch",
    "MacBook Pro 14 M3",
    "Samsung Galaxy S24 Ultra",
    "Samsung Galaxy Tab S9",
    "AirPods Pro 2nd generation",
    "iPad Pro 12.9 M2",
    "Apple Watch Series 9",
    "Dell XPS 13",
    "Surface Pro 9"
];

export const SearchBar: React.FC<SearchBarProps> = ({
    onSearch,
    placeholder = "Tìm kiếm sản phẩm, thương hiệu...",
    className
}) => {
    const navigate = useNavigate();

    // States
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Load recent searches on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setRecentSearches(parsed.slice(0, CONFIG.MAX_RECENT_SEARCHES));
                }
            }
        } catch (error) {
            console.warn('Failed to load recent searches:', error);
        }
    }, []);

    // Generate suggestions with debounce
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!query.trim()) {
            setSuggestions([]);
            setSelectedIndex(-1);
            return;
        }

        setIsLoading(true);

        debounceRef.current = setTimeout(() => {
            const filtered = MOCK_SUGGESTIONS
                .filter(item =>
                    item.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, CONFIG.MAX_SUGGESTIONS);

            setSuggestions(filtered);
            setSelectedIndex(-1);
            setIsLoading(false);
        }, CONFIG.DEBOUNCE_DELAY);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Memoized computed values
    const hasQuery = useMemo(() => query.trim().length > 0, [query]);
    const hasSuggestions = useMemo(() => suggestions.length > 0, [suggestions]);
    const hasRecentSearches = useMemo(() => recentSearches.length > 0, [recentSearches]);
    const showSuggestions = useMemo(() => hasSuggestions && hasQuery, [hasSuggestions, hasQuery]);
    const showTrending = useMemo(() => !hasQuery && !isLoading, [hasQuery, isLoading]);
    const showRecent = useMemo(() => !hasQuery && hasRecentSearches && !isLoading, [hasQuery, hasRecentSearches, isLoading]);

    // Save search to recent searches
    const saveRecentSearch = useCallback((searchQuery: string) => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return;

        try {
            const updated = [
                trimmed,
                ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())
            ].slice(0, CONFIG.MAX_RECENT_SEARCHES);

            setRecentSearches(updated);
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
            console.warn('Failed to save recent search:', error);
        }
    }, [recentSearches]);

    // Clear recent searches
    const clearRecentSearches = useCallback(() => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to clear recent searches:', error);
        }
    }, []);

    // Handle search execution
    const executeSearch = useCallback((searchQuery: string) => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return;

        saveRecentSearch(trimmed);
        onSearch?.(trimmed);
        setIsOpen(false);
        setQuery(trimmed);
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }, [saveRecentSearch, onSearch, navigate]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;

            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;

            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    executeSearch(suggestions[selectedIndex]);
                } else {
                    executeSearch(query);
                }
                break;

            case 'Escape':
                setIsOpen(false);
                inputRef.current?.blur();
                break;
        }
    }, [selectedIndex, suggestions, executeSearch, query]);

    // Handle input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    }, []);

    // Handle input focus
    const handleInputFocus = useCallback(() => {
        setIsOpen(true);
    }, []);

    // Handle clear query
    const handleClearQuery = useCallback(() => {
        setQuery('');
        setSuggestions([]);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    }, []);

    // Toggle mobile search
    const toggleMobileSearch = useCallback(() => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            {/* Mobile Search Button */}
            <div className="md:hidden">
                <button
                    onClick={toggleMobileSearch}
                    className="p-2 text-white hover:text-blue-400 transition-colors duration-200 rounded-lg hover:bg-white/10"
                    aria-label="Toggle search"
                    aria-expanded={isOpen}
                >
                    <Search size={24} />
                </button>

                {/* Mobile Search Dropdown */}
                {isOpen && (
                    <div className="absolute right-0 top-full mt-2 z-50">
                        <div className="w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                            <MobileSearchContent
                                query={query}
                                placeholder={placeholder}
                                isLoading={isLoading}
                                showSuggestions={showSuggestions}
                                showTrending={showTrending}
                                showRecent={showRecent}
                                suggestions={suggestions}
                                recentSearches={recentSearches}
                                selectedIndex={selectedIndex}
                                inputRef={inputRef}
                                onInputChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onClearQuery={handleClearQuery}
                                onExecuteSearch={executeSearch}
                                onClearRecent={clearRecentSearches}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop Search Input */}
            <div className="hidden md:block relative">
                <div className="relative group">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={handleInputFocus}
                        className="w-72 lg:w-96 pl-12 pr-10 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-gray-700/50 transition-all duration-200"
                        autoComplete="off"
                    />

                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={20} />

                    {hasQuery && (
                        <button
                            onClick={handleClearQuery}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            aria-label="Clear search"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Desktop Suggestions Dropdown */}
                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                        <DesktopSearchContent
                            isLoading={isLoading}
                            showSuggestions={showSuggestions}
                            showTrending={showTrending}
                            showRecent={showRecent}
                            suggestions={suggestions}
                            recentSearches={recentSearches}
                            selectedIndex={selectedIndex}
                            onExecuteSearch={executeSearch}
                            onClearRecent={clearRecentSearches}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Mobile Search Content Component
interface SearchContentProps {
    query?: string;
    placeholder?: string;
    isLoading: boolean;
    showSuggestions: boolean;
    showTrending: boolean;
    showRecent: boolean;
    suggestions: string[];
    recentSearches: string[];
    selectedIndex: number;
    inputRef?: React.RefObject<HTMLInputElement | null>;
    onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onClearQuery?: () => void;
    onExecuteSearch: (query: string) => void;
    onClearRecent: () => void;
}

const MobileSearchContent: React.FC<SearchContentProps> = ({
    query = '',
    placeholder,
    isLoading,
    showSuggestions,
    showTrending,
    showRecent,
    suggestions,
    recentSearches,
    selectedIndex,
    inputRef,
    onInputChange,
    onKeyDown,
    onClearQuery,
    onExecuteSearch,
    onClearRecent
}) => (
    <>
        {/* Search Input */}
        <div className="relative p-4 border-b border-gray-100">
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={onInputChange}
                onKeyDown={onKeyDown}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                autoComplete="off"
            />
            <Search className="absolute left-7 top-7 text-gray-400" size={20} />
            {query && onClearQuery && (
                <button
                    onClick={onClearQuery}
                    className="absolute right-7 top-7 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                >
                    <X size={20} />
                </button>
            )}
        </div>

        {/* Search Content */}
        <SearchDropdownContent
            isLoading={isLoading}
            showSuggestions={showSuggestions}
            showTrending={showTrending}
            showRecent={showRecent}
            suggestions={suggestions}
            recentSearches={recentSearches}
            selectedIndex={selectedIndex}
            onExecuteSearch={onExecuteSearch}
            onClearRecent={onClearRecent}
        />
    </>
);

const DesktopSearchContent: React.FC<Omit<SearchContentProps, 'query' | 'placeholder' | 'inputRef' | 'onInputChange' | 'onKeyDown' | 'onClearQuery'>> = (props) => (
    <SearchDropdownContent {...props} />
);

// Shared Search Dropdown Content
const SearchDropdownContent: React.FC<Omit<SearchContentProps, 'query' | 'placeholder' | 'inputRef' | 'onInputChange' | 'onKeyDown' | 'onClearQuery'>> = ({
    isLoading,
    showSuggestions,
    showTrending,
    showRecent,
    suggestions,
    recentSearches,
    selectedIndex,
    onExecuteSearch,
    onClearRecent
}) => (
    <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
            <div className="py-8 px-4 text-center">
                <div className="inline-flex items-center space-x-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="text-sm">Đang tìm kiếm...</span>
                </div>
            </div>
        ) : showSuggestions ? (
            <SuggestionsSection
                suggestions={suggestions}
                selectedIndex={selectedIndex}
                onSelect={onExecuteSearch}
            />
        ) : (
            <>
                {showRecent && (
                    <RecentSearchesSection
                        searches={recentSearches}
                        onSelect={onExecuteSearch}
                        onClear={onClearRecent}
                    />
                )}
                {showTrending && (
                    <TrendingSearchesSection
                        searches={TRENDING_SEARCHES}
                        onSelect={onExecuteSearch}
                    />
                )}
                {!showRecent && !showTrending && (
                    <EmptySearchState />
                )}
            </>
        )}
    </div>
);

// Search Sections
const SuggestionsSection: React.FC<{
    suggestions: string[];
    selectedIndex: number;
    onSelect: (query: string) => void;
}> = ({ suggestions, selectedIndex, onSelect }) => (
    <div className="py-2">
        <SectionHeader icon={Search} title="Gợi ý tìm kiếm" />
        {suggestions.map((suggestion, index) => (
            <SearchItem
                key={suggestion}
                icon={Search}
                text={suggestion}
                isSelected={selectedIndex === index}
                onClick={() => onSelect(suggestion)}
            />
        ))}
    </div>
);

const RecentSearchesSection: React.FC<{
    searches: string[];
    onSelect: (query: string) => void;
    onClear: () => void;
}> = ({ searches, onSelect, onClear }) => (
    <div className="py-2 border-b border-gray-100">
        <SectionHeader
            icon={Clock}
            title="Tìm kiếm gần đây"
            action={
                <button
                    onClick={onClear}
                    className="text-gray-400 hover:text-gray-600 text-xs transition-colors"
                >
                    Xóa
                </button>
            }
        />
        {searches.map((search) => (
            <SearchItem
                key={search}
                icon={Clock}
                text={search}
                onClick={() => onSelect(search)}
            />
        ))}
    </div>
);

const TrendingSearchesSection: React.FC<{
    searches: string[];
    onSelect: (query: string) => void;
}> = ({ searches, onSelect }) => (
    <div className="py-2">
        <SectionHeader icon={TrendingUp} title="Tìm kiếm phổ biến" />
        {searches.map((search) => (
            <SearchItem
                key={search}
                icon={TrendingUp}
                text={search}
                onClick={() => onSelect(search)}
            />
        ))}
    </div>
);

const EmptySearchState: React.FC = () => (
    <div className="py-8 px-4 text-center text-gray-500">
        <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Nhập từ khóa để tìm kiếm</p>
    </div>
);

// Utility Components
const SectionHeader: React.FC<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    action?: React.ReactNode;
}> = ({ icon: Icon, title, action }) => (
    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center justify-between">
        <div className="flex items-center">
            <Icon className="w-3 h-3 mr-1" />
            {title}
        </div>
        {action}
    </div>
);

const SearchItem: React.FC<{
    icon: React.ComponentType<{ className?: string; size?: number }>;
    text: string;
    isSelected?: boolean;
    onClick: () => void;
}> = ({ icon: Icon, text, isSelected = false, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors flex items-center",
            isSelected && "bg-blue-50 text-blue-700"
        )}
    >
        <Icon className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" size={16} />
        <span className="truncate">{text}</span>
    </button>
);