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
        code: string,
        message: string
    },
    latency_ms: number,
    metadata?: {
        data: { [key: string]: string };
    }
}

interface ProductServiceClient {
    GetProductsBatch(
        request: ProductBatchRequest,
        callback: (error: grpc.ServiceError | null, response: ProductBatchResponse) => void
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

            const packageDefinition = protoLoader.loadSync([PROTO_PATH, COMMON_PROTO_PATH], {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
                includeDirs: [path.join(__dirname, '../../proto')]
            })

            const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
            const productProto = (protoDescriptor as any).ecommerce?.product;

            if (!productProto || !productProto.ProductService) {
                throw new Error('Could not find ProductService in loaded proto descriptor');
            }

            const serverAddress = `${config.grpc.productService.host}:${config.grpc.productService.port}`

            this.client = new productProto.ProductService(
                serverAddress,
                grpc.credentials.createInsecure(),
                {
                    'grpc.keepalive_time_ms': 30000,
                    'grpc.keepalive_timeout_ms': 5000,
                    'grpc.keepalive_permit_without_calls': true,
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
                            source: 'cart-service',
                            timestamp: new Date().toISOString(),
                        },
                    },
                };

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

                    // Fix: Check for numeric 0 (OK status)
                    const isSuccessStatus = response?.status?.code === 'OK';

                    if (!response || !isSuccessStatus) {
                        const errorMessage = response?.status?.message || 'Unknown gRPC error';
                        logger.error('gRPC response error', {
                            status: response?.status,
                            productIds,
                            expectedCode: 0,
                            actualCode: response?.status?.code,
                        });
                        reject(new Error(errorMessage));
                        return;
                    }

                    try {
                        if (!response.products || !Array.isArray(response.products)) {
                            logger.warn('No products in response', {
                                products: response.products,
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
                        logger.error('Failed to map gRPC response', { error: mappingError });
                        reject(mappingError);
                    }
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