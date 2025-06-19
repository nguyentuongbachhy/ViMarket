// Common API Response Structure
export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    data: T;
    message?: string;
    meta?: PageMeta;
}

// Pagination Types
export interface PageMeta {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export interface PagedResponse<T> {
    content: T[];
    meta: PageMeta;
}

// Error Types
export interface ApiError {
    status: number;
    message: string;
    details?: any;
    timestamp?: string;
}

// Request Config Types
export interface RequestConfig {
    timeout?: number;
    retries?: number;
    cache?: boolean;
    cacheTTL?: number;
}