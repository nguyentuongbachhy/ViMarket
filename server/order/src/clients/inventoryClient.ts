import { config } from '@/config';
import { Logger } from '@/utils/logger';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('InventoryClient');

interface InventoryServiceClient {
    CheckInventoryBatch(
        request: any,
        callback: (error: grpc.ServiceError | null, response: any) => void
    ): void;

    ReserveInventory(
        request: any,
        callback: (error: grpc.ServiceError | null, response: any) => void
    ): void;

    ConfirmReservation(
        request: any,
        callback: (error: grpc.ServiceError | null, response: any) => void
    ): void;

    CancelReservation(
        request: any,
        callback: (error: grpc.ServiceError | null, response: any) => void
    ): void;
}

export class InventoryClient {
    private client: InventoryServiceClient | null = null;

    constructor() {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            const PROTO_ROOT = path.join(__dirname, '../../proto');
            const INVENTORY_PROTO_PATH = path.join(PROTO_ROOT, 'inventory.proto');

            const packageDefinition = protoLoader.loadSync(INVENTORY_PROTO_PATH, {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
                includeDirs: [PROTO_ROOT]  // Thêm root directory cho includes
            });

            const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
            const inventoryProto = (protoDescriptor as any).ecommerce?.inventory;

            if (!inventoryProto || !inventoryProto.InventoryService) {
                throw new Error('Could not find InventoryService in loaded proto descriptor');
            }

            const serverAddress = `${config.grpc.inventoryService.host}:${config.grpc.inventoryService.port}`;

            this.client = new inventoryProto.InventoryService(
                serverAddress,
                grpc.credentials.createInsecure(),
                {
                    'grpc.keepalive_time_ms': 30000,
                    'grpc.keepalive_timeout_ms': 5000,
                    'grpc.keepalive_permit_without_calls': true,
                }
            );

            logger.info('Inventory gRPC client initialized', { serverAddress });
        } catch (error) {
            logger.error('Failed to initialize Inventory gRPC client', { error });
            throw error;
        }
    }

    // ... rest of the methods remain the same
    async checkInventoryBatch(items: Array<{ productId: string; quantity: number }>): Promise<Array<{
        productId: string;
        available: boolean;
        availableQuantity: number;
        status: string;
    }>> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        return new Promise((resolve, reject) => {
            const request = {
                items: items.map(item => ({
                    product_id: item.productId,
                    quantity: item.quantity,
                })),
                metadata: {
                    data: {
                        source: 'order-service',
                        timestamp: new Date().toISOString(),
                    },
                },
            };

            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, config.grpc.inventoryService.timeout);

            this.client!.CheckInventoryBatch(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.error('Failed to check inventory batch', { error: error.message });
                    reject(error);
                    return;
                }

                const statusCode = response?.result_status?.code;
                if (statusCode !== 'OK') {
                    const errorMessage = response?.result_status?.message || 'Unknown inventory service error';
                    reject(new Error(errorMessage));
                    return;
                }

                const results = response.items?.map((item: any) => ({
                    productId: item.product_id,
                    available: item.available,
                    availableQuantity: item.available_quantity,
                    status: item.status,
                })) || [];

                resolve(results);
            });
        });
    }

    async reserveInventory(
        userId: string,
        items: Array<{ productId: string; quantity: number }>
    ): Promise<{ reservationId: string; allReserved: boolean }> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        const reservationId = uuidv4();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + config.order.reservationTimeoutMinutes);

        return new Promise((resolve, reject) => {
            const request = {
                reservation_id: reservationId,
                user_id: userId,
                items: items.map(item => ({
                    product_id: item.productId,
                    quantity: item.quantity,
                })),
                expires_at: Math.floor(expiresAt.getTime() / 1000),
                metadata: {
                    data: {
                        source: 'order-service',
                        timestamp: new Date().toISOString(),
                    },
                },
            };

            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, config.grpc.inventoryService.timeout);

            this.client!.ReserveInventory(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.error('Failed to reserve inventory', { error: error.message });
                    reject(error);
                    return;
                }

                const statusCode = response?.result_status?.code;
                if (statusCode !== 'OK') {
                    const errorMessage = response?.result_status?.message || 'Unknown inventory service error';
                    reject(new Error(errorMessage));
                    return;
                }

                resolve({
                    reservationId: response.reservation_id,
                    allReserved: response.all_reserved,
                });
            });
        });
    }

    async confirmReservation(reservationId: string, orderId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = {
                reservation_id: reservationId,
                order_id: orderId,
                confirmed_at: new Date().toISOString(),
            };

            // Log để debug
            console.log('Confirming reservation with:', {
                reservation_id: reservationId,
                order_id: orderId,
                order_id_type: typeof orderId,
                confirmed_at: request.confirmed_at
            });

            this.client!.ConfirmReservation(request, (error, response) => {
                if (error) {
                    logger.error('Failed to confirm reservation', {
                        error: error.message,
                        reservationId,
                        orderId,
                        orderIdType: typeof orderId
                    });
                    reject(new Error(`failed to confirm reservation: ${error.message}`));
                    return;
                }

                logger.debug('Reservation confirmed successfully', {
                    reservationId,
                    orderId
                });

                resolve();
            });
        });
    }

    async cancelReservation(reservationId: string, reason: string = 'Order cancelled'): Promise<void> {
        if (!this.client) {
            throw new Error('gRPC client not initialized');
        }

        return new Promise((resolve, reject) => {
            const request = {
                reservation_id: reservationId,
                reason,
                metadata: {
                    data: {
                        source: 'order-service',
                        timestamp: new Date().toISOString(),
                    },
                },
            };

            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, config.grpc.inventoryService.timeout);

            this.client!.CancelReservation(request, (error, response) => {
                clearTimeout(timeout);

                if (error) {
                    logger.error('Failed to cancel reservation', { error: error.message });
                    reject(error);
                    return;
                }

                const statusCode = response?.result_status?.code;
                if (statusCode !== 'OK') {
                    const errorMessage = response?.result_status?.message || 'Unknown inventory service error';
                    reject(new Error(errorMessage));
                    return;
                }

                resolve();
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

export const inventoryClient = new InventoryClient();