import type { BrandInfo } from './brand';
import type { CategoryInfo } from './category';
import type { SellerInfo } from './seller';

// Product API Types
export interface ProductSummary {
    id: string;
    name: string;
    shortDescription?: string;
    price: number;
    originalPrice?: number;
    ratingAverage?: number;
    reviewCount: number;
    inventoryStatus: string;
    quantitySold: number;
    allTimeQuantitySold: number;

    brand: BrandInfo;
    seller: SellerInfo;
    images: ProductImage[];
    categories?: CategoryInfo[];
    createdAt: string;
    updatedAt: string;
}

export interface ProductDetail extends ProductSummary {
    description?: string;
    categories: CategoryInfo[];
    specifications: ProductSpecification[];
}

export interface ProductImage {
    id: string;
    url: string;
    position: number;
}

export interface ProductSpecification {
    id: string;
    specGroup: string;
    specName: string;
    specValue: string;
}