import type { LucideIcon } from 'lucide-react';

export interface Category {
    category: string;
    urlKey: string;
    name: string;
    icon: LucideIcon;
}

export interface FilterState {
    q?: string;
    categoryIds?: string[];
    brandIds?: string[];
    brandNames?: string[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    maxRating?: number;
    inventoryStatus?: string;
    sortBy?: string;
    direction?: 'asc' | 'desc';
}

export interface SidebarProps {
    windowWidth: number;
    menuOpen: boolean;
    setMenuOpen: (open: boolean) => void;

    // Filter state from parent
    currentFilters?: FilterState;

    // Callbacks to parent
    onCategorySelect?: (category: Category) => void;
    onFilterChange?: (filters: Partial<FilterState>) => void;
    onClearFilters?: () => void;

    // Display options
    showFilters?: boolean;
    showCategories?: boolean;
    className?: string;
}

// Brand data type for sidebar
export interface BrandOption {
    id: string;
    name: string;
    count?: number;
}

// Price range options
export interface PriceRangeOption {
    label: string;
    min: number;
    max?: number;
}

// Inventory status options
export interface InventoryStatusOption {
    value: string;
    label: string;
}

// Layout context interface
export interface LayoutContext {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
}