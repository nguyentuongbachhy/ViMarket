import * as grpc from '@grpc/grpc-js';
export declare class CartGrpcServer {
    private server;
    constructor();
    private setupServices;
    private getCart;
    private prepareCheckout;
    private clearCart;
    private validateCart;
    private mapCartToGrpcResponse;
    start(): Promise<void>;
    stop(): Promise<void>;
    getServer(): grpc.Server;
}
export declare const cartGrpcServer: CartGrpcServer;
//# sourceMappingURL=cartGrpcServer.d.ts.map