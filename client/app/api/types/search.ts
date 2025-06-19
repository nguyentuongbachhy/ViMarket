// Search and Filter Types
export interface ProductSearchParams {
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    maxRating?: number;
    brandIds?: string[];
    brandNames?: string[];
    categoryIds?: string[];
    inventoryStatus?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: 'asc' | 'desc';
}

export interface ProductFilterParams {
    q?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    maxRating?: number;
    brandIds?: string[];
    brandNames?: string[];
    categoryIds?: string[];
    inventoryStatus?: string;
    page?: number;
    size?: number;
    sortBy?: 'price' | 'rating' | 'newest' | 'popularity' | 'allTimeQuantitySold' | 'ratingAverage' | 'createdAt';
    direction?: 'asc' | 'desc';
}

// Special product filter for consistent API
export interface SpecialProductFilterParams extends Omit<ProductFilterParams, 'sortBy' | 'direction'> {
    // sortBy và direction sẽ được set tự động trong service
}