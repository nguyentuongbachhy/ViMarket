import { Loader2, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
    errorMessage,
    onRetry,
    className,
    containerClassName,
    loadingVariant = 'default',
    showLoadMoreButton = false,
    ...props
}) => {
    const loadingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);

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
                setIsIntersecting(target.isIntersecting);
                
                if (target.isIntersecting && hasMore && !loading && !loadingRef.current) {
                    handleLoadMore();
                }
            },
            {
                rootMargin: `${threshold}px`,
                threshold: 0.1,
            }
        );

        observer.observe(sentinel);

        return () => {
            observer.unobserve(sentinel);
        };
    }, [hasMore, loading, threshold, handleLoadMore]);

    // Enhanced Loading Component
    const LoadingComponent = loader || (
        <div className="flex justify-center items-center py-8">
            <div className={cn(
                "flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-300",
                loadingVariant === 'minimal' && "text-gray-500",
                loadingVariant === 'default' && "text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
                loadingVariant === 'branded' && "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
                loadingVariant === 'skeleton' && "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse"
            )}>
                {loadingVariant === 'skeleton' ? (
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                    </div>
                ) : (
                    <>
                        <Loader2 className={cn(
                            "animate-spin",
                            loadingVariant === 'minimal' && "w-4 h-4",
                            loadingVariant === 'default' && "w-5 h-5",
                            loadingVariant === 'branded' && "w-5 h-5"
                        )} />
                        <span className={cn(
                            "font-medium",
                            loadingVariant === 'minimal' && "text-sm",
                            loadingVariant === 'default' && "text-sm",
                            loadingVariant === 'branded' && "text-sm"
                        )}>
                            Đang tải thêm sản phẩm...
                        </span>
                        {isIntersecting && (
                            <div className="flex gap-1">
                                <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    // Enhanced End Message
    const EndMessage = endMessage || (
        <div className="text-center py-12">
            <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Đã hiển thị tất cả kết quả
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Bạn đã xem hết tất cả sản phẩm có sẵn
                </p>
            </div>
        </div>
    );

    // Error State
    const ErrorMessage = errorMessage && (
        <div className="text-center py-8">
            <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.134 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                    Có lỗi xảy ra
                </h3>
                <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                    {errorMessage}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Thử lại
                    </button>
                )}
            </div>
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
            <div ref={sentinelRef} className="h-px opacity-0" />

            {/* Error state */}
            {errorMessage && ErrorMessage}

            {/* Loading state */}
            {loading && hasMore && !errorMessage && LoadingComponent}

            {/* Manual load more button (when showLoadMoreButton is true) */}
            {showLoadMoreButton && hasMore && !loading && !errorMessage && (
                <div className="text-center py-6">
                    <button
                        onClick={handleLoadMore}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                        disabled={loading}
                    >
                        <Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
                        Tải thêm sản phẩm
                    </button>
                </div>
            )}

            {/* End message */}
            {!hasMore && !loading && !errorMessage && EndMessage}
        </div>
    );
};

export default InfiniteScroll;