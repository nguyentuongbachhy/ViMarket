"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricingService = exports.PricingService = void 0;
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
const logger = new logger_1.Logger('PricingService');
class PricingService {
    calculateCartPricing(items) {
        try {
            const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
            const tax = subtotal * config_1.config.pricing.taxRate;
            const shipping = this.calculateShipping(subtotal);
            const discount = this.calculateDiscount(items, subtotal);
            const total = subtotal + tax + shipping - discount;
            const pricing = {
                subtotal: this.roundToDecimalPlaces(subtotal),
                tax: this.roundToDecimalPlaces(tax),
                shipping: this.roundToDecimalPlaces(shipping),
                discount: this.roundToDecimalPlaces(discount),
                total: this.roundToDecimalPlaces(total),
                currency: config_1.config.pricing.currency,
                taxRate: config_1.config.pricing.taxRate,
                freeShippingThreshold: config_1.config.pricing.freeShippingThreshold,
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
        }
        catch (error) {
            logger.error('Failed to calculate cart pricing', { error, itemCount: items.length });
            const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
            return {
                subtotal: this.roundToDecimalPlaces(subtotal),
                tax: 0,
                shipping: 0,
                discount: 0,
                total: this.roundToDecimalPlaces(subtotal),
                currency: config_1.config.pricing.currency,
                taxRate: 0,
                freeShippingThreshold: config_1.config.pricing.freeShippingThreshold,
                itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
            };
        }
    }
    calculateShipping(subtotal) {
        if (subtotal >= config_1.config.pricing.freeShippingThreshold) {
            return 0;
        }
        return config_1.config.pricing.shippingCost;
    }
    calculateDiscount(items, subtotal) {
        let totalDiscount = 0;
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQuantity > 10) {
            totalDiscount += subtotal * 0.05;
        }
        for (const item of items) {
            if (item.product.categories) {
                for (const category of item.product.categories) {
                    if (category.name.toLowerCase().includes('electronics')) {
                        totalDiscount += item.totalPrice * 0.10;
                    }
                }
            }
        }
        return totalDiscount;
    }
    calculateItemPrice(basePrice, quantity, discountPercentage) {
        let price = basePrice * quantity;
        if (discountPercentage) {
            price = price * (1 - discountPercentage / 100);
        }
        return this.roundToDecimalPlaces(price);
    }
    roundToDecimalPlaces(value) {
        const multiplier = Math.pow(10, config_1.config.pricing.decimalPlaces);
        return Math.round(value * multiplier) / multiplier;
    }
    formatPrice(amount, currency) {
        const currencyCode = currency || config_1.config.pricing.currency;
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: config_1.config.pricing.decimalPlaces,
            maximumFractionDigits: config_1.config.pricing.decimalPlaces,
        }).format(amount);
    }
    validatePricing(pricing) {
        const errors = [];
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
        if (pricing.total < config_1.config.cart.minOrderAmount) {
            errors.push(`Order total must be at least ${this.formatPrice(config_1.config.cart.minOrderAmount)}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.PricingService = PricingService;
exports.pricingService = new PricingService();
//# sourceMappingURL=pricingService.js.map