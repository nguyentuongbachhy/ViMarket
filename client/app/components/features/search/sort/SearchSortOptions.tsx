// components/features/search/sort/SearchSortOptions.tsx
import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '~/lib/utils';
import type { SearchSortOptionsProps } from './SearchSortOptions.types';

export const SearchSortOptions: React.FC<SearchSortOptionsProps> = ({
    currentSort,
    currentDirection,
    onSortChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const sortOptions = [
        { value: 'relevance', label: 'Liên quan nhất', direction: 'desc' as const },
        { value: 'price', label: 'Giá: Thấp đến cao', direction: 'asc' as const },
        { value: 'price', label: 'Giá: Cao đến thấp', direction: 'desc' as const },
        { value: 'rating', label: 'Đánh giá cao nhất', direction: 'desc' as const },
        { value: 'newest', label: 'Mới nhất', direction: 'desc' as const },
        { value: 'popularity', label: 'Phổ biến nhất', direction: 'desc' as const },
    ];

    const getCurrentLabel = () => {
        const current = sortOptions.find(
            option => option.value === currentSort && option.direction === currentDirection
        );
        return current?.label || 'Liên quan nhất';
    };

    const handleSortSelect = (sortBy: string, direction: 'asc' | 'desc') => {
        onSortChange(sortBy, direction);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
                <span className="text-sm">Sắp xếp: {getCurrentLabel()}</span>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full right-0 mt-1 w-56 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-20">
                        <div className="py-1">
                            {sortOptions.map((option, index) => (
                                <button
                                    key={`${option.value}-${option.direction}`}
                                    onClick={() => handleSortSelect(option.value, option.direction)}
                                    className={cn(
                                        "w-full text-left px-4 py-2 text-sm transition-colors",
                                        option.value === currentSort && option.direction === currentDirection
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SearchSortOptions;