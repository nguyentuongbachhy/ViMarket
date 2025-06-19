import { useCallback, useEffect, useState } from "react";
import { api, ApiUtils } from '~/api';
import type { Subcategory } from "~/components/features/subcategory/SubcategorySidebar.types";
import { useHydrated } from "~/hooks/utils/useHydrated";

export const useSubcategories = (categoryId: string) => {
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hydrated = useHydrated();

    const fetchSubcategories = useCallback(async () => {
        if (!hydrated || !categoryId) return;

        setLoading(true);
        setError(null);

        try {
            const apiSubcategories = await api.categories.getSubcategories(categoryId);

            // Convert to Subcategory format
            const convertedSubcategories: Subcategory[] = apiSubcategories.map(cat => ({
                id: cat.id,
                name: cat.name,
                url: cat.url,
                productCount: undefined // API might not provide this, can be added later
            }));

            setSubcategories(convertedSubcategories);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to fetch subcategories:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [hydrated, categoryId]);

    useEffect(() => {
        fetchSubcategories();
    }, [fetchSubcategories]);

    return { subcategories, loading, error, refetch: fetchSubcategories };
};