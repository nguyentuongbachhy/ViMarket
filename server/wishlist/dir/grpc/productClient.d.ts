declare class ProductGrpcClient {
    private client;
    constructor();
    getProductsBatch(productIds: string[]): Promise<any[]>;
    getProductDetail(productId: string, productName?: string): Promise<any>;
    disconnect(): void;
}
export declare const productGrpcClient: ProductGrpcClient;
export {};
//# sourceMappingURL=productClient.d.ts.map