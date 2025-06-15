import { Cart, CartItem } from '@/types';
export declare class RedisService {
    private client;
    private isConnected;
    constructor();
    private setupEventListeners;
    private connect;
    getCart(userId: string): Promise<Cart | null>;
    saveCart(cart: Cart): Promise<void>;
    setCartReservation(userId: string, reservationId: string): Promise<void>;
    getCartReservation(userId: string): Promise<string | null>;
    clearCartReservation(userId: string): Promise<void>;
    addItemToCart(userId: string, item: CartItem): Promise<void>;
    removeItemFromCart(userId: string, productId: string): Promise<void>;
    clearCart(userId: string): Promise<void>;
    getCartItemCount(userId: string): Promise<number>;
    isHealthy(): Promise<boolean>;
    disconnect(): Promise<void>;
}
export declare const redisService: RedisService;
//# sourceMappingURL=redisService.d.ts.map