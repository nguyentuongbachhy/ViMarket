import { Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '~/lib/utils';
import { type SearchInputProps } from './SearchInput.types';

export const SearchInput: React.FC<SearchInputProps> = ({
    onSearch,
    loading = false,
    suggestions = [],
    showSuggestions = false,
    onSuggestionSelect,
    placeholder = "Search...",
    className,
    value: controlledValue,
    onChange,
    ...props
}) => {
    const [value, setValue] = useState(controlledValue || '');
    const [isFocused, setIsFocused] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (controlledValue !== undefined) {
            setValue(controlledValue);
        }
    }, [controlledValue]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        onChange?.(e);
        setShowDropdown(showSuggestions && suggestions.length > 0 && newValue.length > 0);
    };

    const handleSearch = () => {
        onSearch?.(typeof value === 'string' ? value : Array.isArray(value) ? value.join(',') : String(value));
        setShowDropdown(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setValue(suggestion);
        onSuggestionSelect?.(suggestion);
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    const handleClear = () => {
        setValue('');
        onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
        inputRef.current?.focus();
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className={cn("h-5 w-5", loading ? "animate-pulse" : "text-gray-400")} />
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onFocus={() => {
                        setIsFocused(true);
                        if (
                            showSuggestions &&
                            suggestions.length > 0 &&
                            ((typeof value === 'string' && value.length > 0) ||
                                (Array.isArray(value) && value.length > 0))
                        ) {
                            setShowDropdown(true);
                        }
                    }}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className={cn(
                        "w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                        "transition-colors duration-200",
                        isFocused && "ring-2 ring-blue-500 border-blue-500",
                        className
                    )}
                    {...props}
                />

                {value && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && suggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                    {suggestions
                        .filter(suggestion => {
                            const suggestionStr = typeof suggestion === 'string' ? suggestion : String(suggestion);
                            const valueStr = typeof value === 'string' ? value : Array.isArray(value) ? value.join(',') : String(value);
                            return suggestionStr.toLowerCase().includes(valueStr.toLowerCase());
                        })
                        .map((suggestion, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleSuggestionClick(
                                    typeof suggestion === 'string' ? suggestion : String(suggestion)
                                )}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                            >
                                <div className="flex items-center">
                                    <Search className="h-4 w-4 text-gray-400 mr-3" />
                                    <span className="text-gray-900">{typeof suggestion === 'string' ? suggestion : String(suggestion)}</span>
                                </div>
                            </button>
                        ))
                    }
                </div>
            )}
        </div>
    );
};

export default SearchInput;