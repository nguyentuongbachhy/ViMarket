import { CartValidationResult, CartWithProducts, GuestCartItem } from '@/types';
export declare class CartService {
    getCart(userId: string): Promise<CartWithProducts | null>;
    addToCart(userId: string, productId: string, quantity: number): Promise<CartWithProducts>;
    updateCartItem(userId: string, productId: string, quantity: number): Promise<CartWithProducts | null>;
    removeFromCart(userId: string, productId: string): Promise<CartWithProducts | null>;
    clearCart(userId: string): Promise<void>;
    getCartItemCount(userId: string): Promise<number>;
    validateCart(userId: string): Promise<CartValidationResult>;
    mergeGuestCart(userId: string, guestCartItems: GuestCartItem[]): Promise<CartWithProducts | null>;
    prepareCheckout(userId: string): Promise<{
        cart: CartWithProducts;
        validation: CartValidationResult;
        summary: {
            itemCount: number;
            totalAmount: number;
            isReadyForCheckout: boolean;
        };
    }>;
    private enrichCartWithProductData;
    private validateCartItem;
    private roundToDecimalPlaces;
}
export declare const cartService: CartService;
//# sourceMappingURL=cartService.d.ts.map