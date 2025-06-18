import type { ReactNode } from 'react';

export interface InfiniteScrollProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    hasMore: boolean;
    loading: boolean;
    onLoadMore: () => Promise<void>;
    threshold?: number;
    loader?: ReactNode;
    endMessage?: ReactNode;
    containerClassName?: string;
}