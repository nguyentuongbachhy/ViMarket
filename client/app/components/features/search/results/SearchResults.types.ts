import type { ProductSummary } from '~/api/types';

export interface SearchResultsProps {
    products: ProductSummary[];
    loading: boolean;
    error: string | null;
    isEmpty: boolean;
    hasMore: boolean;
    viewMode: 'grid' | 'list';
    query: string;
    onLoadMore: () => Promise<void>;
    onRetry: () => Promise<void>;
    onClearError: () => void;
}