import { ProductSummary } from '@/types';
export declare class ProductGrpcClient {
    private client;
    private retryAttempts;
    private retryDelay;
    constructor();
    private initialize;
    getProductsBatch(productIds: string[]): Promise<ProductSummary[]>;
    private mapGrpcResponseToProducts;
    close(): void;
}
export declare const productGrpcClient: ProductGrpcClient;
//# sourceMappingURL=productClient.d.ts.map