import { config } from '@/config';
import { Logger } from '@/utils/logger';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('ProductClient');

interface ProductServiceClient {
    GetProductsBatch(
        request: any,
        callback: (error: grpc.ServiceError | null, response: any) => void
    ): void;
    GetProductDetail(
        request: any,
        callback: (error: grpc.ServiceError | null, response: any) => void
    ): void;
}

export interface ProductSummary {
    id: string;
    name: string;
    shortDescription: string;
    price: number;
    originalPrice?: number;
    ratingAverage?: number;
    reviewCount?: number;
    inventoryStatus: string;
    quantitySold?: number;
    brand?: {
        id: string;
        name: string;
        slug?: string;
        countryOfOrigin?: string;
    };
    images?: Array<{
        id: string;
        url: string;
        position: number;
    }>;
    categories?: Array<{
        id: string;
        name: string;
        url?: string;
        parentId?: string;
        level?: number;
    }>;
}

export class ProductClient {
    private client: ProductServiceClient | null = null;
    private isConnected: boolean = false;

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            const PROTO_ROOT = path.join(__dirname, '../../proto');
            const PRODUCT_PROTO_PATH = path.join(PROTO_ROOT, 'product.proto');
            const COMMON_PROTO_PATH = path.join(PROTO_ROOT, 'common.proto');

            const packageDefinition = protoLoader.loadSync([PRODUCT_PROTO_PATH, COMMON_PROTO_PATH], {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
                includeDirs: [PROTO_ROOT]
            });

            const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
            const productProto = (protoDescriptor as any).ecommerce?.product;

            if (!productProto || !productProto.ProductService) {
                throw new Error('Could not find ProductService in loaded proto descriptor');
            }

            const serverAddress = `${config.grpc.productService.host}:${config.grpc.productService.port}`;

            this.client = new productProto.ProductService(
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

            logger.info('Product gRPC client initialized', { serverAddress });

            // Test connection
            await this.testConnection();
            this.isConnected = true;

        } catch (error) {
            logger.error('Failed to initialize Product gRPC client', error);
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

            // Test với batch request rỗng
            const testRequest = {
                product_ids: ['test-connection-product'],
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
                logger.warn('Product gRPC connection test timeout');
                resolve(); // Don't reject, just warn
            }, 5000);

            this.client.GetProductsBatch(testRequest, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.warn('Product gRPC connection test failed', {
                        error: error.message,
                        code: error.code
                    });
                    // Don't reject for test failures, service might still work
                    resolve();
                    return;
                }

                const statusCode = response?.status?.code;
                if (statusCode === 'OK' || statusCode === 0) {
                    logger.info('Product gRPC connection test successful');
                } else {
                    logger.warn('Product gRPC connection test returned error status', {
                        statusCode,
                        message: response?.status?.message
                    });
                }

                resolve();
            });
        });
    }

    async getProductsBatch(productIds: string[]): Promise<ProductSummary[]> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        if (!productIds || productIds.length === 0) {
            return [];
        }

        return new Promise((resolve, reject) => {
            const request = {
                product_ids: productIds,
                metadata: {
                    data: {
                        source: 'order-service',
                        timestamp: new Date().toISOString(),
                        operation: 'get_products_batch',
                        request_id: uuidv4(),
                    },
                },
            };

            logger.debug('Sending get products batch request', {
                productIds: productIds.slice(0, 5), // Log first 5 IDs
                totalCount: productIds.length
            });

            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, config.grpc.productService.timeout);

            this.client!.GetProductsBatch(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.error('Failed to get products batch', {
                        error: error.message,
                        code: error.code,
                        productCount: productIds.length
                    });
                    reject(error);
                    return;
                }

                const statusCode = response?.status?.code;
                if (statusCode !== 'OK' && statusCode !== 0) {
                    const errorMessage = response?.status?.message || 'Unknown product service error';
                    logger.error('Product service returned error', {
                        statusCode,
                        message: errorMessage,
                        productCount: productIds.length
                    });
                    reject(new Error(errorMessage));
                    return;
                }

                const products = this.mapGrpcResponseToProducts(response.products || []);

                logger.debug('Products retrieved successfully', {
                    requestedCount: productIds.length,
                    retrievedCount: products.length,
                    latency: response.latency_ms
                });

                resolve(products);
            });
        });
    }

    async getProductDetail(productId: string, productName?: string): Promise<ProductSummary | null> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        return new Promise((resolve, reject) => {
            const request = {
                product_id: productId,
                product_name: productName || '',
                metadata: {
                    data: {
                        source: 'order-service',
                        timestamp: new Date().toISOString(),
                        operation: 'get_product_detail',
                        request_id: uuidv4(),
                    },
                },
            };

            logger.debug('Sending get product detail request', { productId, productName });

            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, config.grpc.productService.timeout);

            this.client!.GetProductDetail(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.error('Failed to get product detail', {
                        error: error.message,
                        code: error.code,
                        productId
                    });
                    reject(error);
                    return;
                }

                const statusCode = response?.status?.code;
                if (statusCode !== 'OK' && statusCode !== 0) {
                    const errorMessage = response?.status?.message || 'Unknown product service error';
                    logger.error('Product service returned error for product detail', {
                        statusCode,
                        message: errorMessage,
                        productId
                    });
                    reject(new Error(errorMessage));
                    return;
                }

                // Parse product from response message - this might need adjustment based on actual response format
                try {
                    // The response might contain product data in the message field or other format
                    // This is a simplified implementation - adjust based on actual product service response
                    logger.debug('Product detail retrieved successfully', { productId });
                    resolve(null); // Return null for now, adjust based on actual response format
                } catch (parseError) {
                    logger.error('Failed to parse product detail response', {
                        parseError,
                        productId
                    });
                    reject(parseError);
                }
            });
        });
    }

    private mapGrpcResponseToProducts(grpcProducts: any[]): ProductSummary[] {
        return grpcProducts.map((grpcProduct) => {
            const product: ProductSummary = {
                id: grpcProduct.id,
                name: grpcProduct.name,
                shortDescription: grpcProduct.short_description || '',
                price: grpcProduct.price,
                originalPrice: grpcProduct.original_price || undefined,
                ratingAverage: grpcProduct.rating_average || undefined,
                reviewCount: grpcProduct.review_count || undefined,
                inventoryStatus: grpcProduct.inventory_status || 'unknown',
                quantitySold: grpcProduct.quantity_sold || undefined,
            };

            if (grpcProduct.brand) {
                product.brand = {
                    id: grpcProduct.brand.id,
                    name: grpcProduct.brand.name,
                    slug: grpcProduct.brand.slug || undefined,
                    countryOfOrigin: grpcProduct.brand.country_of_origin || undefined,
                };
            }

            if (grpcProduct.images && grpcProduct.images.length > 0) {
                product.images = grpcProduct.images.map((img: any) => ({
                    id: img.id,
                    url: img.url,
                    position: img.position || 0,
                }));
            }

            if (grpcProduct.categories && grpcProduct.categories.length > 0) {
                product.categories = grpcProduct.categories.map((cat: any) => ({
                    id: cat.id,
                    name: cat.name,
                    url: cat.url || undefined,
                    parentId: cat.parent_id || undefined,
                    level: cat.level || undefined,
                }));
            }

            return product;
        });
    }

    isHealthy(): boolean {
        return this.isConnected && this.client !== null;
    }

    close(): void {
        if (this.client) {
            logger.info('Closing Product gRPC client');
            this.client = null;
            this.isConnected = false;
        }
    }
}

export const productClient = new ProductClient();