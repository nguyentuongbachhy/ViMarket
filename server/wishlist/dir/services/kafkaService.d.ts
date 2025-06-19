import { WishlistPriceRequest } from '@/types';
declare class KafkaService {
    private kafka;
    private producer;
    private consumer;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendWishlistPriceRequest(request: WishlistPriceRequest): Promise<void>;
    startConsumer(): Promise<void>;
    private handlePriceResponse;
}
export declare const kafkaService: KafkaService;
export {};
//# sourceMappingURL=kafkaService.d.ts.map