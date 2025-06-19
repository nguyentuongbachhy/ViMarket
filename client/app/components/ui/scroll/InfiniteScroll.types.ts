import type { ReactNode } from 'react';

export interface InfiniteScrollProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    hasMore: boolean;
    loading: boolean;
    onLoadMore: () => Promise<void>;
    threshold?: number;
    loader?: ReactNode;
    endMessage?: ReactNode;
    errorMessage?: string;
    onRetry?: () => void;
    containerClassName?: string;
    loadingVariant?: 'minimal' | 'default' | 'branded' | 'skeleton';
    showLoadMoreButton?: boolean;
}