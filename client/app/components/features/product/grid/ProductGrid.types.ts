import { type VariantProps } from "class-variance-authority";
import { type ProductSummary } from '~/api';
import {
    emptyStateVariants,
    errorContainerVariants,
    gridContainerVariants,
    loadingIndicatorVariants,
    loadMoreButtonVariants,
    productGridVariants,
    skeletonGridVariants,
    titleVariants
} from './ProductGrid.variants';

export interface ProductGridProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof productGridVariants>,
    VariantProps<typeof gridContainerVariants> {
    // Data props
    products: ProductSummary[];
    loading?: boolean;
    error?: string | null;
    hasMore?: boolean;

    // Event handlers
    onLoadMore?: () => void;
    onRetry?: () => void;
    // Display props
    title?: string;
    showBrand?: boolean;
    showSeller?: boolean;
    emptyMessage?: string;
    showLoadMoreButton?: boolean;

    // Card appearance props
    cardHeight?: 'sm' | 'md' | 'lg' | 'xl'; // Thêm prop để control chiều cao card
    imageHeight?: 'sm' | 'md' | 'lg'; // Thêm prop để control chiều cao image

    // Variant props for different parts
    titleSize?: VariantProps<typeof titleVariants>['size'];
    errorSeverity?: VariantProps<typeof errorContainerVariants>['severity'];
    emptyStateSize?: VariantProps<typeof emptyStateVariants>['size'];
    loadMoreVariant?: VariantProps<typeof loadMoreButtonVariants>['variant'];
    loadMoreSize?: VariantProps<typeof loadMoreButtonVariants>['size'];
    loadingVariant?: VariantProps<typeof loadingIndicatorVariants>['variant'];
    skeletonSize?: VariantProps<typeof skeletonGridVariants>['size'];
}

export interface ProductGridSkeletonProps
    extends VariantProps<typeof gridContainerVariants>,
    VariantProps<typeof skeletonGridVariants> {
    count?: number;
    cardHeight?: 'sm' | 'md' | 'lg' | 'xl'; // Thêm prop cardHeight cho skeleton
}

export interface ProductGridHeaderProps {
    title?: string;
    titleSize?: VariantProps<typeof titleVariants>['size'];
    onRetry?: () => void;
    loading?: boolean;
}

export interface ProductGridErrorProps
    extends VariantProps<typeof errorContainerVariants> {
    error: string;
    onRetry?: () => void;
    loading?: boolean;
}

export interface ProductGridEmptyProps
    extends VariantProps<typeof emptyStateVariants> {
    message: string;
    icon?: string;
}

export interface ProductGridLoadMoreProps
    extends VariantProps<typeof loadMoreButtonVariants> {
    onLoadMore: () => void;
    hasMore: boolean;
    loading: boolean;
}

export interface ProductGridLoadingProps
    extends VariantProps<typeof loadingIndicatorVariants> {
    message?: string;
}