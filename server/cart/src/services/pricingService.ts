// services/pricingService.ts
import { config } from '@/config';
import { CartItemWithProduct, CartPricing } from '@/types';
import { Logger } from '@/utils/logger';

const logger = new Logger('PricingService');

export class PricingService {
    calculateCartPricing(items: CartItemWithProduct[]): CartPricing {
        try {
            const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

            // Calculate tax
            const tax = subtotal * config.pricing.taxRate;

            // Calculate shipping
            const shipping = this.calculateShipping(subtotal);

            // Calculate discount (if any)
            const discount = this.calculateDiscount(items, subtotal);

            // Calculate total
            const total = subtotal + tax + shipping - discount;

            const pricing: CartPricing = {
                subtotal: this.roundToDecimalPlaces(subtotal),
                tax: this.roundToDecimalPlaces(tax),
                shipping: this.roundToDecimalPlaces(shipping),
                discount: this.roundToDecimalPlaces(discount),
                total: this.roundToDecimalPlaces(total),
                currency: config.pricing.currency,
                taxRate: config.pricing.taxRate,
                freeShippingThreshold: config.pricing.freeShippingThreshold,
                itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
            };

            logger.debug('Cart pricing calculated', {
                itemCount: items.length,
                subtotal: pricing.subtotal,
                tax: pricing.tax,
                shipping: pricing.shipping,
                discount: pricing.discount,
                total: pricing.total,
            });

            return pricing;
        } catch (error) {
            logger.error('Failed to calculate cart pricing', { error, itemCount: items.length });

            // Return default pricing in case of error
            const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
            return {
                subtotal: this.roundToDecimalPlaces(subtotal),
                tax: 0,
                shipping: 0,
                discount: 0,
                total: this.roundToDecimalPlaces(subtotal),
                currency: config.pricing.currency,
                taxRate: 0,
                freeShippingThreshold: config.pricing.freeShippingThreshold,
                itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
            };
        }
    }

    private calculateShipping(subtotal: number): number {
        // Free shipping if above threshold
        if (subtotal >= config.pricing.freeShippingThreshold) {
            return 0;
        }

        return config.pricing.shippingCost;
    }

    private calculateDiscount(items: CartItemWithProduct[], subtotal: number): number {
        let totalDiscount = 0;

        // Bulk discount: 5% off if more than 10 items
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQuantity > 10) {
            totalDiscount += subtotal * 0.05;
        }

        // Category-based discounts
        for (const item of items) {
            if (item.product.categories) {
                for (const category of item.product.categories) {
                    // Example: 10% off electronics
                    if (category.name.toLowerCase().includes('electronics')) {
                        totalDiscount += item.totalPrice * 0.10;
                    }
                }
            }
        }

        return totalDiscount;
    }

    calculateItemPrice(basePrice: number, quantity: number, discountPercentage?: number): number {
        let price = basePrice * quantity;

        if (discountPercentage) {
            price = price * (1 - discountPercentage / 100);
        }

        return this.roundToDecimalPlaces(price);
    }

    private roundToDecimalPlaces(value: number): number {
        const multiplier = Math.pow(10, config.pricing.decimalPlaces);
        return Math.round(value * multiplier) / multiplier;
    }

    // Utility method to format price for display
    formatPrice(amount: number, currency?: string): string {
        const currencyCode = currency || config.pricing.currency;

        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: config.pricing.decimalPlaces,
            maximumFractionDigits: config.pricing.decimalPlaces,
        }).format(amount);
    }

    // Validate pricing constraints
    validatePricing(pricing: CartPricing): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (pricing.subtotal < 0) {
            errors.push('Subtotal cannot be negative');
        }

        if (pricing.tax < 0) {
            errors.push('Tax cannot be negative');
        }

        if (pricing.shipping < 0) {
            errors.push('Shipping cannot be negative');
        }

        if (pricing.discount < 0) {
            errors.push('Discount cannot be negative');
        }

        if (pricing.total < 0) {
            errors.push('Total cannot be negative');
        }

        if (pricing.total < config.cart.minOrderAmount) {
            errors.push(`Order total must be at least ${this.formatPrice(config.cart.minOrderAmount)}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

export const pricingService = new PricingService();