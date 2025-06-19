export declare class InventoryGrpcClient {
    private client;
    constructor();
    private initialize;
    private testConnection;
    checkInventory(productId: string, quantity: number, productInfo: {
        inventoryStatus: string;
        name: string;
        price: number;
    }): Promise<{
        available: boolean;
        availableQuantity: number;
        status: string;
    }>;
    checkInventoryBatch(items: Array<{
        productId: string;
        quantity: number;
        productInfo?: {
            inventoryStatus: string;
            name: string;
            price: number;
        };
    }>): Promise<Array<{
        productId: string;
        available: boolean;
        availableQuantity: number;
        reservedQuantity: number;
        status: string;
        errorMessage?: string;
    }>>;
    reserveInventory(reservationId: string, userId: string, items: Array<{
        productId: string;
        quantity: number;
    }>, expiresAt: Date): Promise<{
        reservationId: string;
        allReserved: boolean;
        results: Array<{
            productId: string;
            requestedQuantity: number;
            reservedQuantity: number;
            success: boolean;
            errorMessage?: string;
        }>;
    }>;
    close(): void;
}
export declare const inventoryGrpcClient: InventoryGrpcClient;
//# sourceMappingURL=inventoryClient.d.ts.map