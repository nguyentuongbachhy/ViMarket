import type { Category } from "~/components";

export interface UseCategoriesOptions {
    enableCache?: boolean;
    cacheTime?: number;
}

export interface UseCategoriesReturn {
    categories: Category[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    clearError: () => void;
}