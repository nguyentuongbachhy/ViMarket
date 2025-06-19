import type { ProductSummary } from "~/api";

export interface ProductCardProps {
    product: ProductSummary;
    className?: string;
    showBrand?: boolean;
    showSeller?: boolean;
    imageHeight?: 'sm' | 'md' | 'lg';
    cardHeight?: 'sm' | 'md' | 'lg' | 'xl';
}