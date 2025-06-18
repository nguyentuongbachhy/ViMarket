export declare class KafkaService {
    private kafka;
    private consumer;
    private producer;
    private admin;
    private isConnected;
    private connectionAttempts;
    private readonly maxConnectionAttempts;
    constructor();
    connect(): Promise<void>;
    private ensureTopicsExist;
    startConsumer(): Promise<void>;
    private handleMessage;
    private handleWishlistUpdated;
    private handleInventoryUpdated;
    private handleCartUpdated;
    private handleProductPriceChanged;
    private handleInventoryLowStock;
    private handleCartAbandoned;
    private validateWishlistEvent;
    private validateInventoryEvent;
    private validateCartEvent;
    private validatePriceEvent;
    isHealthy(): Promise<boolean>;
    disconnect(): Promise<void>;
    sendMessage(topic: string, message: any, key?: string): Promise<void>;
}
export declare const kafkaService: KafkaService;
//# sourceMappingURL=kafkaService.d.ts.map