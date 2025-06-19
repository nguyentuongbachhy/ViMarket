import { Loader2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef } from 'react';
import { cn } from '~/lib/utils';
import type { InfiniteScrollProps } from './InfiniteScroll.types';

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
    children,
    hasMore,
    loading,
    onLoadMore,
    threshold = 200,
    loader,
    endMessage,
    className,
    containerClassName,
    ...props
}) => {
    const loadingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const handleLoadMore = useCallback(async () => {
        if (loadingRef.current || !hasMore || loading) return;

        loadingRef.current = true;
        try {
            await onLoadMore();
        } catch (error) {
            console.error('Failed to load more:', error);
        } finally {
            loadingRef.current = false;
        }
    }, [hasMore, loading, onLoadMore]);

    // Intersection Observer for auto-loading
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];
                if (target.isIntersecting && hasMore && !loading) {
                    handleLoadMore();
                }
            },
            {
                rootMargin: `${threshold}px`,
            }
        );

        observer.observe(sentinel);

        return () => {
            observer.unobserve(sentinel);
        };
    }, [hasMore, loading, threshold, handleLoadMore]);

    // Scroll event listener as fallback
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

            if (isNearBottom && hasMore && !loading && !loadingRef.current) {
                handleLoadMore();
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [hasMore, loading, threshold, handleLoadMore]);

    const LoadingComponent = loader || (
        <div className="flex justify-center items-center py-8">
            <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Đang tải thêm...</span>
            </div>
        </div>
    );

    const EndMessage = endMessage || (
        <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Đã hiển thị tất cả kết quả</p>
        </div>
    );

    return (
        <div
            ref={containerRef}
            className={cn("w-full", containerClassName)}
            {...props}
        >
            <div className={cn("space-y-4", className)}>
                {children}
            </div>

            {/* Sentinel element for intersection observer */}
            <div ref={sentinelRef} className="h-px" />

            {/* Loading state */}
            {loading && hasMore && LoadingComponent}

            {/* End message */}
            {!hasMore && !loading && EndMessage}

            {/* Manual load more button (optional fallback) */}
            {hasMore && !loading && (
                <div className="text-center py-4">
                    <button
                        onClick={handleLoadMore}
                        className="px-6 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
                        disabled={loading}
                    >
                        Tải thêm
                    </button>
                </div>
            )}
        </div>
    );
};

export default InfiniteScroll;