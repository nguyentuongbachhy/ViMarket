export interface SearchSortOptionsProps {
    currentSort?: string;
    currentDirection?: 'asc' | 'desc';
    onSortChange: (sortBy?: string, direction?: 'asc' | 'desc') => void;
}