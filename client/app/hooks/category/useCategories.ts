import { useCallback, useEffect, useState } from "react";
import { api, ApiUtils, type CategoryInfo } from '~/api';
import { useHydrated } from "~/hooks/utils/useHydrated";

import type { LucideIcon } from 'lucide-react';
import {
    Baby, BookOpen, Briefcase, Camera, Car,
    Footprints, Gift, Heart, Home, Laptop, Music,
    Package,
    PenTool,
    Phone, Shirt, ShoppingBag, ShoppingBasket, ShoppingCart,
    Tent, Tv, Watch, Zap
} from 'lucide-react';
import type { Category } from "~/components";
import type { UseCategoriesOptions, UseCategoriesReturn } from "./useCategories.types";


const getIconForCategory = (categoryName: string, categoryId: string): LucideIcon => {
    const name = categoryName.toLowerCase();

    if (name.includes('sách') || name.includes('book')) return BookOpen;
    if (name.includes('nhà cửa') || name.includes('home') || name.includes('đời sống')) return Home;
    if (name.includes('điện thoại') || name.includes('phone') || name.includes('mobile')) return Phone;
    if (name.includes('đồ chơi') || name.includes('mẹ') || name.includes('bé') || name.includes('baby')) return Baby;
    if (name.includes('thiết bị') || name.includes('tivi') || name.includes('tv')) return Tv;
    if (name.includes('điện gia dụng') || name.includes('appliance')) return Zap;
    if (name.includes('làm đẹp') || name.includes('sức khỏe') || name.includes('beauty') || name.includes('health')) return Heart;
    if (name.includes('ô tô') || name.includes('xe') || name.includes('car') || name.includes('motor')) return Car;
    if (name.includes('thời trang nữ') || name.includes('women fashion')) return Shirt;
    if (name.includes('thời trang nam') || name.includes('men fashion')) return Music;
    if (name.includes('bách hóa') || name.includes('grocery')) return ShoppingCart;
    if (name.includes('thể thao') || name.includes('dã ngoại') || name.includes('sport')) return Tent;
    if (name.includes('cross border') || name.includes('quốc tế')) return ShoppingBag;
    if (name.includes('laptop') || name.includes('máy vi tính') || name.includes('computer')) return Laptop;
    if (name.includes('giày') || name.includes('dép') || name.includes('shoes')) return Footprints;
    if (name.includes('máy ảnh') || name.includes('camera')) return Camera;
    if (name.includes('phụ kiện thời trang') || name.includes('accessories')) return PenTool;
    if (name.includes('ngon') || name.includes('food')) return ShoppingBasket;
    if (name.includes('đồng hồ') || name.includes('trang sức') || name.includes('watch') || name.includes('jewelry')) return Watch;
    if (name.includes('balo') || name.includes('vali') || name.includes('bag')) return Briefcase;
    if (name.includes('voucher') || name.includes('dịch vụ') || name.includes('service')) return Gift;
    if (name.includes('túi') || name.includes('handbag')) return ShoppingBag;
    if (name.includes('chăm sóc nhà cửa') || name.includes('household')) return Home;

    return Package;
};

const convertApiCategory = (apiCategory: CategoryInfo): Category => ({
    category: apiCategory.id,
    urlKey: apiCategory.url || `category-${apiCategory.id}`,
    name: apiCategory.name,
    icon: getIconForCategory(apiCategory.name, apiCategory.id)
});

const categoryCache = {
    data: null as Category[] | null,
    timestamp: 0,
    ttl: 5 * 60 * 1000
};

export const useCategories = (options: UseCategoriesOptions = {}): UseCategoriesReturn => {
    const {
        enableCache = true,
        cacheTime = 5 * 60 * 1000,
    } = options;

    const hydrated = useHydrated();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isCacheValid = useCallback(() => {
        if (!enableCache || !categoryCache.data) return false;
        const now = Date.now();
        return (now - categoryCache.timestamp) < (categoryCache.ttl || cacheTime);
    }, [enableCache, cacheTime]);

    const fetchCategories = useCallback(async () => {
        if (!hydrated) return;

        if (isCacheValid() && categoryCache.data) {
            console.log('Using cached categories');
            setCategories(categoryCache.data);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching categories from API...');

            const apiCategories = await api.categories.getAllRootCategories();
            const filteredCategories = apiCategories.filter(category => category.name.toLowerCase() !== 'uncategorized')
            const convertedCategories = filteredCategories.map(convertApiCategory);

            if (enableCache) {
                categoryCache.data = convertedCategories;
                categoryCache.timestamp = Date.now();
                categoryCache.ttl = cacheTime;
            }

            setCategories(convertedCategories);
            console.log(`Loaded ${filteredCategories.length} categories from API`);

        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to fetch categories:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [hydrated, isCacheValid, enableCache, cacheTime, categories.length]);

    const refetch = useCallback(async () => {
        if (enableCache) {
            categoryCache.data = null;
            categoryCache.timestamp = 0;
        }
        await fetchCategories();
    }, [fetchCategories, enableCache]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return {
        categories,
        loading,
        error,
        refetch,
        clearError
    };
};

export const useCategory = (categoryId: string) => {
    const [category, setCategory] = useState<CategoryInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hydrated = useHydrated();

    const fetchCategory = useCallback(async () => {
        if (!hydrated || !categoryId) return;

        setLoading(true);
        setError(null);

        try {
            const apiCategory = await api.categories.getCategoryById(categoryId);
            setCategory(apiCategory);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to fetch category:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [hydrated, categoryId]);

    useEffect(() => {
        fetchCategory();
    }, [fetchCategory]);

    return { category, loading, error, refetch: fetchCategory };
};

export const useCategoryHierarchy = (categoryId: string) => {
    const [hierarchy, setHierarchy] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hydrated = useHydrated();

    const fetchHierarchy = useCallback(async () => {
        if (!hydrated || !categoryId) return;

        setLoading(true);
        setError(null);

        try {
            const apiHierarchy = await api.categories.getCategoryHierarchy(categoryId);
            const convertedHierarchy = apiHierarchy.map(convertApiCategory);
            setHierarchy(convertedHierarchy);
        } catch (err: any) {
            const errorMessage = ApiUtils.formatErrorMessage(err);
            setError(errorMessage);
            console.error('Failed to fetch category hierarchy:', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [hydrated, categoryId]);

    useEffect(() => {
        fetchHierarchy();
    }, [fetchHierarchy]);

    return { hierarchy, loading, error, refetch: fetchHierarchy };
};