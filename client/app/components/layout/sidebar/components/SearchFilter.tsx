import { Search, X } from 'lucide-react';
import React from 'react';

interface SearchFilterProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
    searchTerm,
    onSearchChange,
    placeholder = "Tìm danh mục...",
    disabled = false,
}) => {
    return (
        <div className="sticky top-16 z-10 bg-gray-900 p-4 border-b border-gray-800">
            <div className="relative">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    disabled={disabled}
                    className="w-full px-4 py-2 pl-10 pr-8 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />

                {/* Clear button */}
                {searchTerm && !disabled && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors"
                        aria-label="Xóa tìm kiếm"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                {/* Loading indicator when disabled */}
                {disabled && (
                    <div className="absolute right-3 top-2.5">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
};