import { config } from '@/config'
import { Logger } from '@/utils/logger'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

const logger = new Logger('InventoryGrpcClient')

interface CheckInventoryRequest {
    product_id: string;
    quantity: number;
    metadata?: {
        data: { [key: string]: string };
    };
    product_info?: {
        inventory_status: string;
        name: string;
        price: number;
    };
}

interface CheckInventoryResponse {
    product_id: string;
    available: boolean;
    available_quantity: number;
    status: string;
    result_status: {
        code: string;
        message: string;
    };
    latency_ms: number;
}

interface CheckInventoryBatchRequest {
    items: Array<{
        product_id: string;
        quantity: number;
    }>;
    metadata?: {
        data: { [key: string]: string };
    }
}

interface CheckInventoryBatchResponse {
    items: Array<{
        product_id: string;
        available: boolean;
        available_quantity: number;
        reserved_quantity: number;
        status: string;
        error_message?: string;
    }>;
    result_status: {
        code: string;
        message: string;
    };
    latency_ms: number;
}

interface ReserveInventoryRequest {
    reservation_id: string;
    user_id: string;
    items: Array<{
        product_id: string;
        quantity: number;
    }>;
    expires_at: number;
    metadata?: {
        data: { [key: string]: string };
    }
}

interface ReserveInventoryResponse {
    reservation_id: string;
    results: Array<{
        product_id: string;
        requested_quantity: number;
        reserved_quantity: number;
        success: boolean;
        error_message?: string;
    }>;
    all_reserved: boolean;
    result_status: {
        code: string;
        message: string;
    };
    latency_ms: number;
}

interface InventoryServiceClient {
    CheckInventory(
        request: CheckInventoryRequest,
        callback: (error: grpc.ServiceError | null, response: CheckInventoryResponse) => void
    ): void;

    CheckInventoryBatch(
        request: CheckInventoryBatchRequest,
        callback: (error: grpc.ServiceError | null, response: CheckInventoryBatchResponse) => void
    ): void;

    ReserveInventory(
        request: ReserveInventoryRequest,
        callback: (error: grpc.ServiceError | null, response: ReserveInventoryResponse) => void
    ): void;
}

export class InventoryGrpcClient {
    private client: InventoryServiceClient | null = null

    constructor() {
        this.initialize()
    }

    private async initialize(): Promise<void> {
        try {
            const INVENTORY_PROTO_PATH = path.join(__dirname, '../../proto/inventory.proto')
            const COMMON_PROTO_PATH = path.join(__dirname, '../../proto/common.proto')

            const packageDefinition = protoLoader.loadSync([INVENTORY_PROTO_PATH, COMMON_PROTO_PATH], {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
                includeDirs: [path.join(__dirname, '../../proto')]
            })

            const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
            const inventoryProto = (protoDescriptor as any).ecommerce?.inventory

            if (!inventoryProto || !inventoryProto.InventoryService) {
                throw new Error('Could not find InventoryService in loaded proto descriptor');
            }

            const serverAddress = `${config.grpc.inventoryService.host}:${config.grpc.inventoryService.port}`

            this.client = new inventoryProto.InventoryService(
                serverAddress,
                grpc.credentials.createInsecure(),
                {
                    'grpc.keepalive_time_ms': 30000,
                    'grpc.keepalive_timeout_ms': 5000,
                    'grpc.keepalive_permit_without_calls': true,
                    'grpc.max_receive_message_length': 10 * 1024 * 1024, // 10MB
                    'grpc.max_send_message_length': 10 * 1024 * 1024, // 10MB
                }
            )

            logger.info('Inventory gRPC client initialized', { serverAddress });

            // Test connection
            await this.testConnection();
        } catch (error) {
            logger.error('Failed to initialize Inventory gRPC client', error);
            throw error;
        }
    }

    private async testConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                reject(new Error('Client not initialized'));
                return;
            }

            const testRequest: CheckInventoryRequest = {
                product_id: '0000fd37-3c4f-4566-8015-a2421d1918f2',
                quantity: 1,
                metadata: {
                    data: {
                        source: 'cart-service-test',
                        timestamp: new Date().toISOString(),
                        operation: 'connection_test'
                    },
                },
            };

            const timeout = setTimeout(() => {
                logger.warn('gRPC connection test timeout');
                resolve(); // Don't reject, just warn
            }, 5000);

            this.client.CheckInventory(testRequest, (error, response) => {
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

                // Check if response indicates successful test
                const statusCode = response?.result_status?.code;
                const isSuccess = statusCode === 'OK';

                if (isSuccess) {
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

    async checkInventory(
        productId: string,
        quantity: number,
        productInfo: { inventoryStatus: string; name: string; price: number }
    ): Promise<{ available: boolean, availableQuantity: number, status: string }> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        return new Promise((resolve, reject) => {
            const request: CheckInventoryRequest = {
                product_id: productId,
                quantity,
                metadata: {
                    data: {
                        source: 'cart-service',
                        timestamp: new Date().toISOString(),
                        operation: 'check_inventory'
                    },
                },
                product_info: {
                    inventory_status: productInfo.inventoryStatus || '',
                    name: productInfo.name || '',
                    price: productInfo.price || 0
                },
            };

            logger.debug('Sending inventory check request', {
                productId,
                quantity,
                productInfo: request.product_info
            });

            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 10000);

            this.client!.CheckInventory(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.error('Failed to check inventory', {
                        error: {
                            message: error.message,
                            code: error.code,
                            details: error.details
                        },
                        productId,
                        quantity,
                        productInfo,
                    });
                    reject(error);
                    return;
                }

                logger.debug('Inventory check response received', {
                    productId,
                    response: {
                        available: response?.available,
                        availableQuantity: response?.available_quantity,
                        status: response?.status,
                        resultStatus: response?.result_status
                    }
                });

                // Handle both enum (0 = OK) and string ('OK') status codes
                const statusCode = response?.result_status?.code;
                const isSuccess = statusCode === 'OK';

                if (!isSuccess) {
                    const errorMessage = response?.result_status?.message || 'Unknown inventory service error';
                    logger.error('Inventory service returned error', {
                        productId,
                        statusCode,
                        statusMessage: response?.result_status?.message
                    });
                    reject(new Error(errorMessage));
                    return;
                }

                resolve({
                    available: response.available,
                    availableQuantity: response.available_quantity,
                    status: response.status,
                });
            });
        });
    }

    async checkInventoryBatch(items: Array<{
        productId: string,
        quantity: number,
        productInfo?: { inventoryStatus: string; name: string; price: number }
    }>): Promise<Array<{
        productId: string;
        available: boolean;
        availableQuantity: number;
        reservedQuantity: number;
        status: string;
        errorMessage?: string;
    }>> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        if (!items || items.length === 0) {
            return [];
        }

        return new Promise((resolve, reject) => {
            const request: CheckInventoryBatchRequest = {
                items: items.map(item => ({
                    product_id: item.productId,
                    quantity: item.quantity,
                })),
                metadata: {
                    data: {
                        source: 'cart-service',
                        timestamp: new Date().toISOString(),
                        operation: 'check_inventory_batch',
                        item_count: items.length.toString(),
                    },
                },
            };

            const timeout = setTimeout(() => {
                reject(new Error('Batch request timeout'));
            }, 15000);

            this.client!.CheckInventoryBatch(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.error('Failed to check inventory batch', {
                        error: error.message,
                        itemCount: items.length,
                    });
                    reject(error);
                    return;
                }

                const statusCode = response?.result_status?.code;
                const isSuccess = statusCode === 'OK';

                if (!isSuccess) {
                    const errorMessage = response?.result_status?.message || 'Unknown inventory service error';
                    reject(new Error(errorMessage));
                    return;
                }

                const results = response.items?.map(item => ({
                    productId: item.product_id,
                    available: item.available,
                    availableQuantity: item.available_quantity,
                    reservedQuantity: item.reserved_quantity,
                    status: item.status,
                    errorMessage: item.error_message,
                })) || [];

                resolve(results);
            });
        });
    }

    async reserveInventory(
        reservationId: string,
        userId: string,
        items: Array<{ productId: string, quantity: number }>,
        expiresAt: Date
    ): Promise<{
        reservationId: string;
        allReserved: boolean;
        results: Array<{
            productId: string;
            requestedQuantity: number;
            reservedQuantity: number;
            success: boolean;
            errorMessage?: string;
        }>;
    }> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        return new Promise((resolve, reject) => {
            const request: ReserveInventoryRequest = {
                reservation_id: reservationId,
                user_id: userId,
                items: items.map(item => ({
                    product_id: item.productId,
                    quantity: item.quantity,
                })),
                expires_at: Math.floor(expiresAt.getTime() / 1000),
                metadata: {
                    data: {
                        source: 'cart-service',
                        timestamp: new Date().toISOString(),
                    },
                },
            };

            const timeout = setTimeout(() => {
                reject(new Error('Reserve request timeout'));
            }, 15000);

            this.client!.ReserveInventory(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.error('Failed to reserve inventory', {
                        error: error.message,
                        reservationId,
                        userId,
                        itemCount: items.length,
                    });
                    reject(error);
                    return;
                }

                const statusCode = response?.result_status?.code;
                const isSuccess = statusCode === 'OK';

                if (!isSuccess) {
                    const errorMessage = response?.result_status?.message || 'Unknown inventory service error';
                    reject(new Error(errorMessage));
                    return;
                }

                const results = response.results?.map(result => ({
                    productId: result.product_id,
                    requestedQuantity: result.requested_quantity,
                    reservedQuantity: result.reserved_quantity,
                    success: result.success,
                    errorMessage: result.error_message,
                })) || [];

                resolve({
                    reservationId: response.reservation_id,
                    allReserved: response.all_reserved,
                    results,
                });
            });
        });
    }

    close(): void {
        if (this.client) {
            logger.info('Closing Inventory gRPC client');
            this.client = null;
        }
    }
}

export const inventoryGrpcClient = new InventoryGrpcClient();