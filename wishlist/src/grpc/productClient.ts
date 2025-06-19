import { config } from '@/config'
import { ProductSummary } from '@/types'
import { Logger } from '@/utils/logger'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

const logger = new Logger('ProductGrpcClient')

interface ProductBatchRequest {
    product_ids: string[];
    metadata?: {
        data: { [key: string]: string };
    }
}

interface ProductBatchResponse {
    products: any[],
    status: {
        code: string | number,
        message: string
    },
    latency_ms: number,
    metadata?: {
        data: { [key: string]: string };
    }
}

interface ProductDetailRequest {
    product_id: string;
    product_name?: string;
    metadata?: {
        data: { [key: string]: string };
    }
}

interface ProductDetailResponse {
    message: string;
    ui_action?: any;
    status: {
        code: string | number;
        message: string;
    };
    latency_ms: number;
    metadata?: {
        data: { [key: string]: string };
    }
}

interface ProductServiceClient {
    GetProductsBatch(
        request: ProductBatchRequest,
        callback: (error: grpc.ServiceError | null, response: ProductBatchResponse) => void
    ): void;

    GetProductDetail(
        request: ProductDetailRequest,
        callback: (error: grpc.ServiceError | null, response: ProductDetailResponse) => void
    ): void;
}

export class ProductGrpcClient {
    private client: ProductServiceClient | null = null
    private retryAttempts = 3
    private retryDelay = 1000

    constructor() {
        this.initialize()
    }

    private async initialize(): Promise<void> {
        try {
            const PROTO_PATH = path.join(__dirname, '../../proto/product.proto')
            const COMMON_PROTO_PATH = path.join(__dirname, '../../proto/common.proto')

            // Load both proto files
            const packageDefinition = protoLoader.loadSync([PROTO_PATH, COMMON_PROTO_PATH], {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
                includeDirs: [path.join(__dirname, '../../proto')]
            })

            const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

            const productProto = protoDescriptor.ecommerce?.product as any;

            const serverAddress = `${config.grpc.productService.host}:${config.grpc.productService.port}`

            this.client = new productProto.ProductService(
                serverAddress,
                grpc.credentials.createInsecure(),
                {
                    'grpc.keepalive_time_ms': 30000,
                    'grpc.keepalive_timeout_ms': 5000,
                    'grpc.keepalive_permit_without_calls': true,
                    'grpc.http2.max_pings_without_data': 0,
                    'grpc.http2.min_time_between_pings_ms': 10000,
                    'grpc.http2.min_ping_interval_without_data_ms': 300000,
                }
            )

            logger.info('Product gRPC client initialized', { serverAddress });
        } catch (error) {
            logger.error('Failed to initialize Product gRPC client', error);
            throw error;
        }
    }

    async getProductsBatch(productIds: string[]): Promise<ProductSummary[]> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        if (!productIds || productIds.length === 0) {
            return [];
        }

        return new Promise((resolve, reject) => {
            let attempts = 0;

            const makeRequest = () => {
                attempts++;

                const request: ProductBatchRequest = {
                    product_ids: productIds,
                    metadata: {
                        data: {
                            source: 'wishlist-service',
                            timestamp: new Date().toISOString(),
                        },
                    },
                };

                logger.info('Sending gRPC request', {
                    serverAddress: `${config.grpc.productService.host}:${config.grpc.productService.port}`,
                    productIds,
                    attempts
                });

                this.client!.GetProductsBatch(request, (error, response) => {
                    if (error) {
                        logger.error(`gRPC request failed (attempt ${attempts})`, {
                            error: error.message,
                            productIds,
                            attempts,
                        });

                        if (attempts < this.retryAttempts) {
                            setTimeout(makeRequest, this.retryDelay * attempts);
                            return;
                        }

                        reject(error);
                        return;
                    }

                    // Log full response for debugging
                    logger.debug('gRPC response received', {
                        response: JSON.stringify(response, null, 2),
                        responseType: typeof response,
                        statusType: typeof response?.status?.code,
                        statusValue: response?.status?.code
                    });

                    // Check for both numeric 0 and string "OK"
                    const isSuccessStatus = response?.status?.code === 'OK' || response?.status?.code === 0

                    if (!response || !isSuccessStatus) {
                        const errorMessage = response?.status?.message || 'Unknown gRPC error';
                        logger.error('gRPC response error', {
                            status: response?.status,
                            productIds,
                            expectedCode: '0 or "OK"',
                            actualCode: response?.status?.code,
                            actualType: typeof response?.status?.code
                        });
                        reject(new Error(errorMessage));
                        return;
                    }

                    try {
                        // Check if products array exists
                        if (!response.products || !Array.isArray(response.products)) {
                            logger.warn('No products in response or products is not an array', {
                                products: response.products,
                                productsType: typeof response.products,
                                responseKeys: Object.keys(response || {})
                            });
                            resolve([]);
                            return;
                        }

                        const products = this.mapGrpcResponseToProducts(response.products);
                        logger.info('Successfully fetched products via gRPC', {
                            productCount: products.length,
                            requestedCount: productIds.length,
                            latencyMs: response.latency_ms,
                        });
                        resolve(products);
                    } catch (mappingError) {
                        logger.error('Failed to map gRPC response', {
                            error: mappingError,
                            response: JSON.stringify(response, null, 2)
                        });
                        reject(mappingError);
                    }
                });
            };

            makeRequest();
        });
    }

    async getProductDetail(productId: string, productName?: string): Promise<any> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        return new Promise((resolve, reject) => {
            let attempts = 0;

            const makeRequest = () => {
                attempts++;

                const request: ProductDetailRequest = {
                    product_id: productId,
                    product_name: productName || '',
                    metadata: {
                        data: {
                            source: 'wishlist-service',
                            timestamp: new Date().toISOString(),
                        },
                    },
                };

                logger.info('Sending GetProductDetail gRPC request', {
                    productId,
                    productName,
                    attempts
                });

                this.client!.GetProductDetail(request, (error, response) => {
                    if (error) {
                        logger.error(`GetProductDetail gRPC request failed (attempt ${attempts})`, {
                            error: error.message,
                            productId,
                            attempts,
                        });

                        if (attempts < this.retryAttempts) {
                            setTimeout(makeRequest, this.retryDelay * attempts);
                            return;
                        }

                        reject(error);
                        return;
                    }

                    logger.debug('GetProductDetail gRPC response received', {
                        response: JSON.stringify(response, null, 2),
                        statusValue: response?.status?.code
                    });

                    // Check for both numeric 0 and string "OK"
                    const isSuccessStatus = response?.status?.code === 'OK' || response?.status?.code === 0

                    if (!response || !isSuccessStatus) {
                        const errorMessage = response?.status?.message || 'Unknown gRPC error';
                        logger.error('GetProductDetail gRPC response error', {
                            status: response?.status,
                            productId,
                        });
                        reject(new Error(errorMessage));
                        return;
                    }

                    logger.info('Successfully fetched product detail via gRPC', {
                        productId,
                        latencyMs: response.latency_ms,
                    });

                    resolve(response);
                });
            };

            makeRequest();
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
            }

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

            return product
        })
    }

    close(): void {
        if (this.client) {
            logger.info('Closing Product gRPC client');
            this.client = null;
        }
    }
}

export const productGrpcClient = new ProductGrpcClient();