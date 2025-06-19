import { CartItemWithProduct, CartPricing } from '@/types';
export declare class PricingService {
    calculateCartPricing(items: CartItemWithProduct[]): CartPricing;
    private calculateShipping;
    private calculateDiscount;
    calculateItemPrice(basePrice: number, quantity: number, discountPercentage?: number): number;
    private roundToDecimalPlaces;
    formatPrice(amount: number, currency?: string): string;
    validatePricing(pricing: CartPricing): {
        isValid: boolean;
        errors: string[];
    };
}
export declare const pricingService: PricingService;
//# sourceMappingURL=pricingService.d.ts.map