import { config } from '@/config';
import { Logger } from '@/utils/logger';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('CartClient');

interface CartServiceClient {
    GetCart(request: any, callback: (error: grpc.ServiceError | null, response: any) => void): void;
    PrepareCheckout(request: any, callback: (error: grpc.ServiceError | null, response: any) => void): void;
    ClearCart(request: any, callback: (error: grpc.ServiceError | null, response: any) => void): void;
    ValidateCart(request: any, callback: (error: grpc.ServiceError | null, response: any) => void): void;
}

export class CartClient {
    private client: CartServiceClient | null = null;
    private isConnected: boolean = false;

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
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

            const serverAddress = `${config.grpc.cartService.host}:${config.grpc.cartService.port}`;

            this.client = new cartProto.CartService(
                serverAddress,
                grpc.credentials.createInsecure(),
                {
                    'grpc.keepalive_time_ms': 30000,
                    'grpc.keepalive_timeout_ms': 5000,
                    'grpc.keepalive_permit_without_calls': true,
                    'grpc.max_receive_message_length': 10 * 1024 * 1024,
                    'grpc.max_send_message_length': 10 * 1024 * 1024,
                }
            );

            logger.info('Cart gRPC client initialized', { serverAddress });

            // Test connection
            await this.testConnection();
            this.isConnected = true;

        } catch (error) {
            logger.error('Failed to initialize Cart gRPC client', error);
            this.isConnected = false;
            throw error;
        }
    }

    private async testConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                reject(new Error('Client not initialized'));
                return;
            }

            // Test với một user ID test
            const testRequest = {
                user_id: 'test_connection_user',
                metadata: {
                    data: {
                        source: 'order-service-test',
                        timestamp: new Date().toISOString(),
                        operation: 'connection_test',
                        request_id: uuidv4(),
                    },
                },
            };

            const timeout = setTimeout(() => {
                logger.warn('gRPC connection test timeout');
                resolve(); // Don't reject, just warn
            }, 5000);

            this.client.GetCart(testRequest, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.warn('gRPC connection test failed', {
                        error: error.message,
                        code: error.code
                    });
                    // Don't reject for test failures, service might still work
                    resolve();
                    return;
                }

                const statusCode = response?.result_status?.code;
                if (statusCode === 'OK' || statusCode === 'NOT_FOUND') {
                    logger.info('gRPC connection test successful');
                } else {
                    logger.warn('gRPC connection test returned error status', {
                        statusCode,
                        message: response?.result_status?.message
                    });
                }

                resolve();
            });
        });
    }

    async getCart(userId: string): Promise<any> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        return new Promise((resolve, reject) => {
            const request = {
                user_id: userId,
                metadata: {
                    data: {
                        source: 'order-service',
                        timestamp: new Date().toISOString(),
                        operation: 'get_cart',
                        request_id: uuidv4(),
                    },
                },
            };

            logger.debug('Sending get cart request', { userId });

            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, config.grpc.cartService.timeout);

            this.client!.GetCart(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.error('Failed to get cart', {
                        error: error.message,
                        code: error.code,
                        userId
                    });
                    reject(error);
                    return;
                }

                const statusCode = response?.result_status?.code;

                if (statusCode === 'NOT_FOUND') {
                    logger.debug('Cart not found', { userId });
                    resolve(null);
                    return;
                }

                if (statusCode !== 'OK') {
                    const errorMessage = response?.result_status?.message || 'Unknown cart service error';
                    logger.error('Cart service returned error', {
                        userId,
                        statusCode,
                        message: errorMessage
                    });
                    reject(new Error(errorMessage));
                    return;
                }

                logger.debug('Cart retrieved successfully', {
                    userId,
                    itemCount: response.cart?.items?.length || 0,
                    totalAmount: response.cart?.pricing?.total || 0
                });

                resolve(response.cart);
            });
        });
    }

    async prepareCheckout(userId: string): Promise<any> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        return new Promise((resolve, reject) => {
            const request = {
                user_id: userId,
                metadata: {
                    data: {
                        source: 'order-service',
                        timestamp: new Date().toISOString(),
                        operation: 'prepare_checkout',
                        request_id: uuidv4(),
                    },
                },
            };

            logger.debug('Sending prepare checkout request', { userId });

            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, config.grpc.cartService.timeout);

            this.client!.PrepareCheckout(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.error('Failed to prepare checkout', {
                        error: error.message,
                        code: error.code,
                        userId
                    });
                    reject(error);
                    return;
                }

                const statusCode = response?.result_status?.code;
                if (statusCode !== 'OK') {
                    const errorMessage = response?.result_status?.message || 'Unknown cart service error';
                    logger.error('Cart service returned error for checkout preparation', {
                        userId,
                        statusCode,
                        message: errorMessage
                    });
                    reject(new Error(errorMessage));
                    return;
                }

                logger.debug('Checkout preparation successful', {
                    userId,
                    isValid: response.validation?.is_valid,
                    isReady: response.summary?.is_ready_for_checkout,
                    itemCount: response.summary?.item_count,
                    totalAmount: response.summary?.total_amount
                });

                resolve({
                    cart: response.cart,
                    validation: response.validation,
                    summary: response.summary,
                });
            });
        });
    }

    async clearCart(userId: string, reason: string = 'Order completed'): Promise<void> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        return new Promise((resolve, reject) => {
            const request = {
                user_id: userId,
                reason,
                metadata: {
                    data: {
                        source: 'order-service',
                        timestamp: new Date().toISOString(),
                        operation: 'clear_cart',
                        request_id: uuidv4(),
                    },
                },
            };

            logger.debug('Sending clear cart request', { userId, reason });

            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, config.grpc.cartService.timeout);

            this.client!.ClearCart(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.error('Failed to clear cart', {
                        error: error.message,
                        code: error.code,
                        userId
                    });
                    reject(error);
                    return;
                }

                const statusCode = response?.result_status?.code;
                if (statusCode !== 'OK') {
                    const errorMessage = response?.result_status?.message || 'Unknown cart service error';
                    logger.error('Cart service returned error for clear cart', {
                        userId,
                        statusCode,
                        message: errorMessage
                    });
                    reject(new Error(errorMessage));
                    return;
                }

                logger.info('Cart cleared successfully', { userId, reason });
                resolve();
            });
        });
    }

    async validateCart(userId: string): Promise<any> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        return new Promise((resolve, reject) => {
            const request = {
                user_id: userId,
                metadata: {
                    data: {
                        source: 'order-service',
                        timestamp: new Date().toISOString(),
                        operation: 'validate_cart',
                        request_id: uuidv4(),
                    },
                },
            };

            logger.debug('Sending validate cart request', { userId });

            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, config.grpc.cartService.timeout);

            this.client!.ValidateCart(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.error('Failed to validate cart', {
                        error: error.message,
                        code: error.code,
                        userId
                    });
                    reject(error);
                    return;
                }

                const statusCode = response?.result_status?.code;
                if (statusCode !== 'OK') {
                    const errorMessage = response?.result_status?.message || 'Unknown cart service error';
                    reject(new Error(errorMessage));
                    return;
                }

                logger.debug('Cart validation completed', {
                    userId,
                    isValid: response.validation?.is_valid,
                    errorCount: response.validation?.errors?.length || 0
                });

                resolve(response.validation);
            });
        });
    }

    isHealthy(): boolean {
        return this.isConnected && this.client !== null;
    }

    close(): void {
        if (this.client) {
            logger.info('Closing Cart gRPC client');
            this.client = null;
            this.isConnected = false;
        }
    }
}

export const cartClient = new CartClient();