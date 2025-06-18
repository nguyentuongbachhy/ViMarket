import type { UserInfo } from '~/api/types';

// Auth state interface
export interface AuthState {
    // Authentication status
    isLogged: boolean;
    token: string;
    userId?: string;

    // User information (using existing API type)
    user?: UserInfo;

    // Loading states
    loading: boolean;

    // Error states
    error: string | null;

    // Additional auth data
    refreshToken?: string;
    tokenExpiry?: string;
    loginMethod?: 'email' | 'google' | 'facebook' | 'apple';
    rememberMe?: boolean;

    // Security
    lastLoginTime?: string;
    sessionId?: string;
    twoFactorEnabled?: boolean;
    twoFactorVerified?: boolean;
}

// UI state interfaces
export interface UIState {
    // Theme and appearance
    theme: 'light' | 'dark' | 'auto';
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;

    // Loading states for different components
    loading: {
        page: boolean;
        products: boolean;
        categories: boolean;
        search: boolean;
    };

    // Modal states
    modals: {
        login: boolean;
        register: boolean;
        forgotPassword: boolean;
        cart: boolean;
        wishlist: boolean;
        productQuickView: boolean;
    };

    // Notification states
    notifications: {
        show: boolean;
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
        autoHide: boolean;
        duration: number;
    }[];

    // Search state
    search: {
        query: string;
        suggestions: string[];
        isSearching: boolean;
        showSuggestions: boolean;
    };

    // Layout preferences
    preferences: {
        language: string;
        currency: string;
        productsPerPage: number;
        gridView: boolean; // true for grid, false for list
    };
}

// Cart state interface
export interface CartState {
    items: CartItem[];
    total: number;
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    couponCode?: string;
    isLoading: boolean;
    error: string | null;
}

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    image: string;
    variant?: {
        size?: string;
        color?: string;
        style?: string;
    };
    seller: {
        id: string;
        name: string;
        isOfficial: boolean;
    };
    maxQuantity: number;
    inStock: boolean;
    addedAt: string;
}

// Wishlist state interface
export interface WishlistState {
    items: WishlistItem[];
    isLoading: boolean;
    error: string | null;
}

export interface WishlistItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    inStock: boolean;
    addedAt: string;
}

// Order state interface
export interface OrderState {
    orders: Order[];
    currentOrder?: Order;
    isLoading: boolean;
    error: string | null;
}

export interface Order {
    id: string;
    orderNumber: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
    items: CartItem[];
    total: number;
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    couponCode?: string;
    paymentMethod: string;
    shippingAddress: Address;
    billingAddress?: Address;
    createdAt: string;
    updatedAt: string;
    estimatedDelivery?: string;
    tracking?: {
        number: string;
        url: string;
        status: string;
        lastUpdate: string;
    };
}

export interface Address {
    id?: string;
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault?: boolean;
}

// Product state interface (for product pages)
export interface ProductState {
    currentProduct?: ProductDetail;
    relatedProducts: ProductSummary[];
    reviews: ProductReview[];
    isLoading: boolean;
    error: string | null;
}

export interface ProductDetail {
    id: string;
    name: string;
    description: string;
    shortDescription?: string;
    price: number;
    originalPrice?: number;
    images: ProductImage[];
    specifications: ProductSpecification[];
    categories: CategoryInfo[];
    brand: BrandInfo;
    seller: SellerInfo;
    rating: {
        average: number;
        count: number;
        distribution: { [star: number]: number };
    };
    inventory: {
        status: 'available' | 'out_of_stock' | 'discontinued';
        quantity: number;
        reservedQuantity: number;
    };
    variants: ProductVariant[];
    shipping: {
        weight: number;
        dimensions: {
            length: number;
            width: number;
            height: number;
        };
        freeShipping: boolean;
        estimatedDays: number;
    };
    seo: {
        title: string;
        description: string;
        keywords: string[];
    };
    createdAt: string;
    updatedAt: string;
}

export interface ProductVariant {
    id: string;
    name: string;
    type: 'size' | 'color' | 'style' | 'material';
    value: string;
    price?: number; // If different from base price
    image?: string;
    inStock: boolean;
    quantity: number;
}

export interface ProductReview {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    title: string;
    content: string;
    images: string[];
    verified: boolean;
    helpful: number;
    createdAt: string;
    replies: ReviewReply[];
}

export interface ReviewReply {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: string;
    isFromSeller: boolean;
}

// Import types from API for consistency
import type {
    BrandInfo,
    CategoryInfo,
    ProductImage,
    ProductSpecification,
    ProductSummary,
    SellerInfo
} from '~/api/types';
