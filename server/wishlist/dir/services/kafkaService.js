"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kafkaService = void 0;
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
const kafkajs_1 = require("kafkajs");
class KafkaService {
    constructor() {
        this.producer = null;
        this.consumer = null;
        this.kafka = new kafkajs_1.Kafka({
            clientId: config_1.CONFIG.KAFKA_CLIENT_ID,
            brokers: config_1.CONFIG.KAFKA_BROKERS,
            retry: {
                initialRetryTime: 100,
                retries: 8,
            },
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.producer = this.kafka.producer({
                    maxInFlightRequests: 1,
                    idempotent: true,
                    transactionTimeout: 30000,
                });
                yield this.producer.connect();
                logger_1.logger.info('Kafka producer connected successfully');
                this.consumer = this.kafka.consumer({
                    groupId: config_1.CONFIG.KAFKA_GROUP_ID,
                });
                yield this.consumer.connect();
                yield this.consumer.subscribe({
                    topic: config_1.CONFIG.KAFKA_TOPICS.PRODUCT_PRICE_RESPONSE,
                    fromBeginning: false,
                });
                logger_1.logger.info('Kafka consumer connected successfully');
            }
            catch (error) {
                logger_1.logger.error('Failed to connect to Kafka:', error);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.producer) {
                    yield this.producer.disconnect();
                }
                if (this.consumer) {
                    yield this.consumer.disconnect();
                }
                logger_1.logger.info('Kafka disconnected successfully');
            }
            catch (error) {
                logger_1.logger.error('Error disconnecting from Kafka:', error);
            }
        });
    }
    sendWishlistPriceRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.producer) {
                throw new Error('Kafka producer not initialized');
            }
            try {
                yield this.producer.send({
                    topic: config_1.CONFIG.KAFKA_TOPICS.WISHLIST_PRICE_REQUEST,
                    messages: [
                        {
                            key: request.requestId,
                            value: JSON.stringify(request),
                            timestamp: Date.now().toString(),
                        },
                    ],
                });
                logger_1.logger.info(`Sent wishlist price request: ${request.requestId}`);
            }
            catch (error) {
                logger_1.logger.error('Failed to send wishlist price request:', error);
                throw error;
            }
        });
    }
    startConsumer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.consumer) {
                throw new Error('Kafka consumer not initialized');
            }
            yield this.consumer.run({
                eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ topic, partition, message }) {
                    var _b, _c;
                    try {
                        const value = (_b = message.value) === null || _b === void 0 ? void 0 : _b.toString();
                        if (!value)
                            return;
                        const data = JSON.parse(value);
                        logger_1.logger.info(`Received message from topic ${topic}:`, {
                            partition,
                            offset: message.offset,
                            key: (_c = message.key) === null || _c === void 0 ? void 0 : _c.toString(),
                        });
                        if (topic === config_1.CONFIG.KAFKA_TOPICS.PRODUCT_PRICE_RESPONSE) {
                            yield this.handlePriceResponse(data);
                        }
                    }
                    catch (error) {
                        logger_1.logger.error('Error processing Kafka message:', error);
                    }
                }),
            });
        });
    }
    handlePriceResponse(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info('Processing price response:', data);
            }
            catch (error) {
                logger_1.logger.error('Error handling price response:', error);
            }
        });
    }
}
exports.kafkaService = new KafkaService();
//# sourceMappingURL=kafkaService.js.map