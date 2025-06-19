import { config } from '@/config';
import { cartService } from '@/services/cartService';
import { Logger } from '@/utils/logger';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const logger = new Logger('CartGrpcServer');

export class CartGrpcServer {
    private server: grpc.Server;

    constructor() {
        this.server = new grpc.Server();
        this.setupServices();
    }

    private setupServices(): void {
        try {
            const PROTO_ROOT = path.join(__dirname, '../../proto');
            const CART_PROTO_PATH = path.join(PROTO_ROOT, 'cart.proto');
            const COMMON_PROTO_PATH = path.join(PROTO_ROOT, 'common.proto');

            const packageDefinition = protoLoader.loadSync([CART_PROTO_PATH, COMMON_PROTO_PATH], {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
                includeDirs: [PROTO_ROOT]
            });

            const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
            const cartProto = (protoDescriptor as any).ecommerce?.cart;

            if (!cartProto || !cartProto.CartService) {
                throw new Error('Could not find CartService in loaded proto descriptor');
            }

            this.server.addService(cartProto.CartService.service, {
                GetCart: this.getCart.bind(this),
                PrepareCheckout: this.prepareCheckout.bind(this),
                ClearCart: this.clearCart.bind(this),
                ValidateCart: this.validateCart.bind(this),
            });

            logger.info('Cart gRPC services registered successfully');
        } catch (error) {
            logger.error('Failed to setup gRPC services', error);
            throw error;
        }
    }

    private async getCart(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
        const startTime = Date.now();
        const { user_id, metadata } = call.request;

        try {
            logger.debug('Getting cart via gRPC', {
                userId: user_id,
                source: metadata?.data?.source,
                requestId: metadata?.data?.request_id
            });

            const cart = await cartService.getCart(user_id);

            if (!cart) {
                const response = {
                    cart: null,
                    result_status: {
                        code: 'NOT_FOUND',
                        message: 'Cart not found or empty'
                    },
                    latency_ms: Date.now() - startTime,
                };
                callback(null, response);
                return;
            }

            const response = {
                cart: this.mapCartToGrpcResponse(cart),
                result_status: { code: 'OK', message: 'Success' },
                latency_ms: Date.now() - startTime,
            };

            logger.debug('Cart retrieved via gRPC successfully', {
                userId: user_id,
                itemCount: cart.items.length,
                totalAmount: cart.pricing.total
            });

            callback(null, response);
        } catch (error) {
            logger.error('Failed to get cart via gRPC', {
                error: error instanceof Error ? error.message : error,
                userId: user_id
            });

            const response = {
                cart: null,
                result_status: {
                    code: 'ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                },
                latency_ms: Date.now() - startTime,
            };
            callback(null, response);
        }
    }

    private async prepareCheckout(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
        const startTime = Date.now();
        const { user_id, metadata } = call.request;

        try {
            logger.debug('Preparing checkout via gRPC', {
                userId: user_id,
                source: metadata?.data?.source
            });

            const checkoutData = await cartService.prepareCheckout(user_id);

            const response = {
                cart: this.mapCartToGrpcResponse(checkoutData.cart),
                validation: {
                    is_valid: checkoutData.validation.isValid,
                    errors: checkoutData.validation.errors,
                    invalid_items: checkoutData.validation.invalidItems,
                },
                summary: {
                    item_count: checkoutData.summary.itemCount,
                    total_amount: checkoutData.summary.totalAmount,
                    is_ready_for_checkout: checkoutData.summary.isReadyForCheckout,
                },
                result_status: { code: 'OK', message: 'Success' },
                latency_ms: Date.now() - startTime,
            };

            logger.debug('Checkout preparation completed via gRPC', {
                userId: user_id,
                isValid: checkoutData.validation.isValid,
                isReady: checkoutData.summary.isReadyForCheckout,
                totalAmount: checkoutData.summary.totalAmount
            });

            callback(null, response);
        } catch (error) {
            logger.error('Failed to prepare checkout via gRPC', {
                error: error instanceof Error ? error.message : error,
                userId: user_id
            });

            const response = {
                cart: null,
                validation: null,
                summary: null,
                result_status: {
                    code: 'ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                },
                latency_ms: Date.now() - startTime,
            };
            callback(null, response);
        }
    }

    private async clearCart(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
        const startTime = Date.now();
        const { user_id, reason, metadata } = call.request;

        try {
            logger.debug('Clearing cart via gRPC', {
                userId: user_id,
                reason,
                source: metadata?.data?.source
            });

            await cartService.clearCart(user_id);

            const response = {
                success: true,
                result_status: { code: 'OK', message: 'Cart cleared successfully' },
                latency_ms: Date.now() - startTime,
            };

            logger.info('Cart cleared via gRPC successfully', {
                userId: user_id,
                reason
            });

            callback(null, response);
        } catch (error) {
            logger.error('Failed to clear cart via gRPC', {
                error: error instanceof Error ? error.message : error,
                userId: user_id
            });

            const response = {
                success: false,
                result_status: {
                    code: 'ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                },
                latency_ms: Date.now() - startTime,
            };
            callback(null, response);
        }
    }

    private async validateCart(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
        const startTime = Date.now();
        const { user_id, metadata } = call.request;

        try {
            logger.debug('Validating cart via gRPC', {
                userId: user_id,
                source: metadata?.data?.source
            });

            const validation = await cartService.validateCart(user_id);

            const response = {
                validation: {
                    is_valid: validation.isValid,
                    errors: validation.errors,
                    invalid_items: validation.invalidItems,
                },
                result_status: { code: 'OK', message: 'Success' },
                latency_ms: Date.now() - startTime,
            };

            logger.debug('Cart validation completed via gRPC', {
                userId: user_id,
                isValid: validation.isValid,
                errorCount: validation.errors.length
            });

            callback(null, response);
        } catch (error) {
            logger.error('Failed to validate cart via gRPC', {
                error: error instanceof Error ? error.message : error,
                userId: user_id
            });

            const response = {
                validation: null,
                result_status: {
                    code: 'ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                },
                latency_ms: Date.now() - startTime,
            };
            callback(null, response);
        }
    }

    private mapCartToGrpcResponse(cart: any): any {
        return {
            user_id: cart.userId,
            items: cart.items.map((item: any) => ({
                product_id: item.productId,
                quantity: item.quantity,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    short_description: item.product.shortDescription || '',
                    price: item.product.price,
                    original_price: item.product.originalPrice || 0,
                    rating_average: item.product.ratingAverage || 0,
                    review_count: item.product.reviewCount || 0,
                    inventory_status: item.product.inventoryStatus,
                    quantity_sold: item.product.quantitySold || 0,
                    brand: item.product.brand ? {
                        id: item.product.brand.id,
                        name: item.product.brand.name,
                        slug: item.product.brand.slug || '',
                        country_of_origin: item.product.brand.countryOfOrigin || '',
                    } : null,
                    images: item.product.images ? item.product.images.map((img: any) => ({
                        id: img.id,
                        url: img.url,
                        position: img.position,
                    })) : [],
                    categories: item.product.categories ? item.product.categories.map((cat: any) => ({
                        id: cat.id,
                        name: cat.name,
                        url: cat.url || '',
                        parent_id: cat.parentId || '',
                        level: cat.level || 0,
                    })) : [],
                },
                total_price: item.totalPrice,
                is_available: item.isAvailable,
                available_quantity: item.availableQuantity,
                added_at: this.toISOString(item.addedAt),
                updated_at: this.toISOString(item.updatedAt),
            })),
            total_items: cart.totalItems,
            pricing: {
                subtotal: cart.pricing.subtotal,
                tax: cart.pricing.tax,
                shipping: cart.pricing.shipping,
                discount: cart.pricing.discount,
                total: cart.pricing.total,
                currency: cart.pricing.currency,
                tax_rate: cart.pricing.taxRate,
                free_shipping_threshold: cart.pricing.freeShippingThreshold,
                item_count: cart.pricing.itemCount,
            },
            created_at: this.toISOString(cart.createdAt),
            updated_at: this.toISOString(cart.updatedAt),
            expires_at: this.toISOString(cart.expiresAt),
        };
    }

    private toISOString(dateValue: any): string {
        try {
            if (!dateValue) {
                return new Date().toISOString();
            }

            // If already a string, return as is
            if (typeof dateValue === 'string') {
                return dateValue;
            }

            // If it's a Date object, convert to ISO string
            if (dateValue instanceof Date) {
                return dateValue.toISOString();
            }

            // If it's a timestamp number, convert to Date first
            if (typeof dateValue === 'number') {
                return new Date(dateValue).toISOString();
            }

            // Try to parse as Date
            const parsed = new Date(dateValue);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString();
            }

            // Fallback to current time
            logger.warn('Could not parse date value, using current time', { dateValue });
            return new Date().toISOString();
        } catch (error) {
            logger.error('Error converting date to ISO string', { error, dateValue });
            return new Date().toISOString();
        }
    }

    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            const host = config.grpc.server.host
            const port = config.grpc.server.port
            this.server.bindAsync(
                `${host}:${port}`,
                grpc.ServerCredentials.createInsecure(),
                (error, boundPort) => {
                    if (error) {
                        logger.error('Failed to start Cart gRPC server', error);
                        reject(error);
                        return;
                    }

                    logger.info('Cart gRPC server started successfully', {
                        host,
                        port: boundPort,
                        services: ['GetCart', 'PrepareCheckout', 'ClearCart', 'ValidateCart']
                    });
                    resolve();
                }
            );
        });
    }

    async stop(): Promise<void> {
        return new Promise((resolve) => {
            this.server.tryShutdown((error) => {
                if (error) {
                    logger.error('Error stopping Cart gRPC server', error);
                    // Force shutdown
                    this.server.forceShutdown();
                } else {
                    logger.info('Cart gRPC server stopped gracefully');
                }
                resolve();
            });
        });
    }

    getServer(): grpc.Server {
        return this.server;
    }
}

export const cartGrpcServer = new CartGrpcServer();