export type { ProductSummary } from '~/api';

import type { ProductSummary } from '~/api';
export interface ProductListViewProps {
    products: ProductSummary[];
    loading?: boolean;
    error?: string | null;
    showBrand?: boolean;
    showSeller?: boolean;
}