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
exports.kafkaService = exports.KafkaService = void 0;
const config_1 = require("@/config");
const types_1 = require("@/types");
const logger_1 = require("@/utils/logger");
const kafkajs_1 = require("kafkajs");
const uuid_1 = require("uuid");
const notificationService_1 = require("./notificationService");
const logger = new logger_1.Logger('KafkaService');
class KafkaService {
    constructor() {
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 10;
        this.kafka = new kafkajs_1.Kafka({
            clientId: config_1.config.kafka.clientId,
            brokers: config_1.config.kafka.brokers,
            connectionTimeout: 10000,
            requestTimeout: 30000,
            retry: {
                initialRetryTime: 300,
                retries: 10,
                maxRetryTime: 30000,
                factor: 2,
                multiplier: 2,
                restartOnFailure: (e) => __awaiter(this, void 0, void 0, function* () {
                    logger.error('Kafka restart on failure', e);
                    return true;
                }),
            },
            logLevel: config_1.config.server.nodeEnv === 'development' ? 1 : 2, // INFO in dev, WARN in prod
        });
        this.consumer = this.kafka.consumer({
            groupId: config_1.config.kafka.groupId,
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
            maxWaitTimeInMs: 5000,
            retry: {
                initialRetryTime: 300,
                retries: 8,
                maxRetryTime: 30000,
            },
            allowAutoTopicCreation: true,
        });
        this.producer = this.kafka.producer({
            retry: {
                initialRetryTime: 300,
                retries: 5,
                maxRetryTime: 30000,
            },
            allowAutoTopicCreation: true,
        });
        this.admin = this.kafka.admin();
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const maxRetries = 30;
            const retryDelay = 2000;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    logger.info(`Attempting to connect to Kafka (${attempt}/${maxRetries})...`);
                    // Test admin connection first
                    yield this.admin.connect();
                    logger.info('Kafka admin connected successfully');
                    // Connect producer
                    yield this.producer.connect();
                    logger.info('Kafka producer connected successfully');
                    // Connect consumer
                    yield this.consumer.connect();
                    logger.info('Kafka consumer connected successfully');
                    // Create topics if they don't exist
                    yield this.ensureTopicsExist();
                    // Subscribe to topics
                    const topics = Object.values(config_1.config.kafka.topics);
                    yield this.consumer.subscribe({
                        topics,
                        fromBeginning: false,
                    });
                    logger.info('Subscribed to Kafka topics successfully', { topics });
                    this.isConnected = true;
                    this.connectionAttempts = 0;
                    return;
                }
                catch (error) {
                    logger.warn(`Kafka connection attempt ${attempt} failed`, {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        brokers: config_1.config.kafka.brokers,
                    });
                    if (attempt === maxRetries) {
                        logger.error('Failed to connect to Kafka after maximum attempts', {
                            attempts: maxRetries,
                            brokers: config_1.config.kafka.brokers,
                        });
                        throw error;
                    }
                    yield new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        });
    }
    ensureTopicsExist() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const topics = Object.values(config_1.config.kafka.topics);
                const existingTopics = yield this.admin.listTopics();
                const topicsToCreate = topics.filter(topic => !existingTopics.includes(topic));
                if (topicsToCreate.length > 0) {
                    logger.info('Creating missing Kafka topics', { topics: topicsToCreate });
                    yield this.admin.createTopics({
                        topics: topicsToCreate.map(topic => ({
                            topic,
                            numPartitions: 3,
                            replicationFactor: 1,
                            configEntries: [
                                { name: 'cleanup.policy', value: 'delete' },
                                { name: 'retention.ms', value: '604800000' }, // 7 days
                                { name: 'segment.ms', value: '86400000' }, // 1 day
                            ],
                        })),
                        waitForLeaders: true,
                        timeout: 30000,
                    });
                    logger.info('Kafka topics created successfully', { topics: topicsToCreate });
                }
                else {
                    logger.info('All Kafka topics already exist', { topics });
                }
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('Topic already exists')) {
                    logger.info('Topics already exist, continuing...');
                    return;
                }
                logger.error('Failed to ensure topics exist', error);
                throw error;
            }
        });
    }
    startConsumer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                throw new Error('Kafka consumer not connected');
            }
            try {
                yield this.consumer.run({
                    partitionsConsumedConcurrently: 3,
                    eachMessage: (payload) => __awaiter(this, void 0, void 0, function* () {
                        yield this.handleMessage(payload);
                    }),
                });
                logger.info('Kafka consumer started successfully');
            }
            catch (error) {
                logger.error('Failed to start Kafka consumer', error);
                throw error;
            }
        });
    }
    handleMessage(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { topic, partition, message, heartbeat } = payload;
            const messageKey = (_a = message.key) === null || _a === void 0 ? void 0 : _a.toString();
            const messageOffset = message.offset;
            try {
                // Heartbeat early
                yield heartbeat();
                const messageValue = (_b = message.value) === null || _b === void 0 ? void 0 : _b.toString();
                if (!messageValue) {
                    logger.warn('Received empty message', {
                        topic,
                        partition,
                        offset: messageOffset,
                        key: messageKey,
                    });
                    return;
                }
                let data;
                try {
                    data = JSON.parse(messageValue);
                }
                catch (parseError) {
                    logger.error('Failed to parse message JSON', {
                        topic,
                        partition,
                        offset: messageOffset,
                        key: messageKey,
                        error: parseError,
                        rawMessage: messageValue.substring(0, 200), // Log first 200 chars
                    });
                    return;
                }
                logger.debug('Processing Kafka message', {
                    topic,
                    partition,
                    offset: messageOffset,
                    key: messageKey,
                    timestamp: message.timestamp,
                    eventId: data.eventId,
                });
                // Route message to appropriate handler
                switch (topic) {
                    case config_1.config.kafka.topics.wishlistUpdated:
                        yield this.handleWishlistUpdated(data);
                        break;
                    case config_1.config.kafka.topics.inventoryUpdated:
                        yield this.handleInventoryUpdated(data);
                        break;
                    case config_1.config.kafka.topics.cartUpdated:
                        yield this.handleCartUpdated(data);
                        break;
                    case config_1.config.kafka.topics.productPriceChanged:
                        yield this.handleProductPriceChanged(data);
                        break;
                    case config_1.config.kafka.topics.inventoryLowStock:
                        yield this.handleInventoryLowStock(data);
                        break;
                    case config_1.config.kafka.topics.cartAbandoned:
                        yield this.handleCartAbandoned(data);
                        break;
                    default:
                        logger.warn('Unknown topic received', {
                            topic,
                            availableTopics: Object.values(config_1.config.kafka.topics)
                        });
                }
                // Final heartbeat
                yield heartbeat();
                logger.debug('Message processed successfully', {
                    topic,
                    partition,
                    offset: messageOffset,
                    key: messageKey,
                    eventId: data.eventId,
                });
            }
            catch (error) {
                logger.error('Error processing Kafka message', {
                    error: error instanceof Error ? {
                        message: error.message,
                        stack: error.stack,
                    } : error,
                    topic,
                    partition,
                    offset: messageOffset,
                    key: messageKey,
                });
                // Don't throw error to avoid stopping the consumer
                // The message will be marked as processed but we logged the error
            }
        });
    }
    // Enhanced event handlers with better error handling
    handleWishlistUpdated(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.validateWishlistEvent(event)) {
                    logger.warn('Invalid wishlist event received', { event });
                    return;
                }
                logger.debug('Processing wishlist updated event', {
                    eventId: event.eventId,
                    userId: event.userId,
                    productId: event.productId,
                    action: event.action,
                });
                // Check if product came back in stock
                if (event.action === 'added' && event.productInfo.inventoryStatus === 'available') {
                    const notification = {
                        id: (0, uuid_1.v4)(),
                        type: types_1.NotificationEventType.WISHLIST_PRODUCT_RESTOCKED,
                        userId: event.userId,
                        title: 'Good news! 🎉',
                        message: `${event.productInfo.name} is back in stock!`,
                        data: {
                            productId: event.productId,
                            productName: event.productInfo.name,
                            productPrice: event.productInfo.price,
                            productImage: event.productInfo.imageUrl,
                            eventId: event.eventId,
                        },
                        priority: types_1.NotificationPriority.HIGH,
                        channels: [types_1.NotificationChannel.PUSH, types_1.NotificationChannel.IN_APP],
                        metadata: {
                            source: 'wishlist-service',
                            productId: event.productId,
                            timestamp: event.timestamp,
                            eventId: event.eventId,
                        },
                    };
                    yield notificationService_1.notificationService.sendNotification(notification);
                }
            }
            catch (error) {
                logger.error('Failed to handle wishlist updated event', {
                    error: error instanceof Error ? error.message : error,
                    eventId: event.eventId,
                    userId: event.userId,
                });
            }
        });
    }
    handleInventoryUpdated(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.validateInventoryEvent(event)) {
                    logger.warn('Invalid inventory event received', { event });
                    return;
                }
                logger.debug('Processing inventory updated event', {
                    eventId: event.eventId,
                    productId: event.productId,
                    oldStatus: event.oldStatus,
                    newStatus: event.newStatus,
                });
                // Check if product came back in stock
                if (event.oldStatus === 'out_of_stock' && event.newStatus === 'available') {
                    logger.info('Product back in stock detected', {
                        eventId: event.eventId,
                        productId: event.productId,
                        productName: event.productName,
                        newQuantity: event.newQuantity,
                    });
                    // Here you would typically query users who have this product in their wishlist
                    // For now, we log the event for potential broadcast implementation
                }
            }
            catch (error) {
                logger.error('Failed to handle inventory updated event', {
                    error: error instanceof Error ? error.message : error,
                    eventId: event.eventId,
                    productId: event.productId,
                });
            }
        });
    }
    handleCartUpdated(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.validateCartEvent(event)) {
                    logger.warn('Invalid cart event received', { event });
                    return;
                }
                logger.debug('Processing cart updated event', {
                    eventId: event.eventId,
                    userId: event.userId,
                    action: event.action,
                    itemCount: event.items.length,
                });
                // Check for low stock items in cart
                const lowStockItems = event.items.filter(item => item.availableQuantity > 0 &&
                    item.availableQuantity < item.quantity);
                if (lowStockItems.length > 0) {
                    const notification = {
                        id: (0, uuid_1.v4)(),
                        type: types_1.NotificationEventType.CART_ITEM_LOW_STOCK,
                        userId: event.userId,
                        title: 'Limited Stock Alert! ⚠️',
                        message: lowStockItems.length === 1
                            ? `Only ${lowStockItems[0].availableQuantity} left of ${lowStockItems[0].productName}`
                            : `${lowStockItems.length} items in your cart have limited stock`,
                        data: {
                            cartId: event.cartId,
                            lowStockItems: lowStockItems.map(item => ({
                                productId: item.productId,
                                productName: item.productName,
                                requestedQuantity: item.quantity,
                                availableQuantity: item.availableQuantity,
                            })),
                            eventId: event.eventId,
                        },
                        priority: types_1.NotificationPriority.HIGH,
                        channels: [types_1.NotificationChannel.PUSH, types_1.NotificationChannel.IN_APP],
                        metadata: {
                            source: 'cart-service',
                            timestamp: event.timestamp,
                            eventId: event.eventId,
                        },
                    };
                    yield notificationService_1.notificationService.sendNotification(notification);
                }
            }
            catch (error) {
                logger.error('Failed to handle cart updated event', {
                    error: error instanceof Error ? error.message : error,
                    eventId: event.eventId,
                    userId: event.userId,
                });
            }
        });
    }
    handleProductPriceChanged(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.validatePriceEvent(event)) {
                    logger.warn('Invalid price change event received', { event });
                    return;
                }
                logger.debug('Processing product price changed event', {
                    eventId: event.eventId,
                    productId: event.productId,
                    oldPrice: event.oldPrice,
                    newPrice: event.newPrice,
                });
                // Only notify if price decreased significantly (more than 5%)
                if (event.newPrice < event.oldPrice) {
                    const discountPercentage = Math.round(((event.oldPrice - event.newPrice) / event.oldPrice) * 100);
                    if (discountPercentage >= 5) { // Only notify for significant price drops
                        logger.info('Significant price drop detected', {
                            eventId: event.eventId,
                            productId: event.productId,
                            productName: event.productName,
                            discountPercentage,
                            oldPrice: event.oldPrice,
                            newPrice: event.newPrice,
                        });
                        // Here you would typically query users who have this product in their wishlist
                        // For now, we log the event for potential implementation
                    }
                }
            }
            catch (error) {
                logger.error('Failed to handle product price changed event', {
                    error: error instanceof Error ? error.message : error,
                    eventId: event.eventId,
                    productId: event.productId,
                });
            }
        });
    }
    handleInventoryLowStock(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.validateInventoryEvent(event)) {
                    logger.warn('Invalid low stock event received', { event });
                    return;
                }
                logger.info('Low stock alert generated', {
                    eventId: event.eventId,
                    productId: event.productId,
                    productName: event.productName,
                    currentQuantity: event.newQuantity,
                    threshold: event.lowStockThreshold,
                });
                // Here you would send notifications to admin users
                // For now, we just log the event
            }
            catch (error) {
                logger.error('Failed to handle inventory low stock event', {
                    error: error instanceof Error ? error.message : error,
                    eventId: event.eventId,
                    productId: event.productId,
                });
            }
        });
    }
    handleCartAbandoned(event) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.validateCartEvent(event)) {
                    logger.warn('Invalid cart abandoned event received', { event });
                    return;
                }
                logger.debug('Processing cart abandoned event', {
                    eventId: event.eventId,
                    userId: event.userId,
                    itemCount: event.items.length,
                });
                const totalValue = event.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const notification = {
                    id: (0, uuid_1.v4)(),
                    type: types_1.NotificationEventType.CART_ABANDONED,
                    userId: event.userId,
                    title: 'Don\'t forget your items! 🛒',
                    message: `You have ${event.items.length} items waiting in your cart`,
                    data: {
                        cartId: event.cartId,
                        itemCount: event.items.length,
                        totalValue,
                        abandonedAt: event.abandonedAt,
                        items: event.items.slice(0, 3).map(item => ({
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            price: item.price,
                        })),
                        eventId: event.eventId,
                    },
                    priority: types_1.NotificationPriority.NORMAL,
                    channels: [types_1.NotificationChannel.PUSH, types_1.NotificationChannel.EMAIL],
                    metadata: {
                        source: 'cart-service',
                        timestamp: event.timestamp,
                        eventId: event.eventId,
                    },
                };
                yield notificationService_1.notificationService.sendNotification(notification);
            }
            catch (error) {
                logger.error('Failed to handle cart abandoned event', {
                    error: error instanceof Error ? error.message : error,
                    eventId: event.eventId,
                    userId: event.userId,
                });
            }
        });
    }
    // Validation methods
    validateWishlistEvent(event) {
        return !!(event.eventId && event.userId && event.productId && event.action && event.productInfo);
    }
    validateInventoryEvent(event) {
        return !!(event.eventId && event.productId && event.productName);
    }
    validateCartEvent(event) {
        return !!(event.eventId && event.userId && event.action && Array.isArray(event.items));
    }
    validatePriceEvent(event) {
        return !!(event.eventId && event.productId && event.productName &&
            typeof event.oldPrice === 'number' && typeof event.newPrice === 'number');
    }
    // Health check
    isHealthy() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isConnected) {
                    return false;
                }
                // Test admin connection
                yield Promise.race([
                    this.admin.listTopics(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 5000))
                ]);
                return true;
            }
            catch (error) {
                logger.warn('Kafka health check failed', { error: error instanceof Error ? error.message : error });
                return false;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger.info('Disconnecting from Kafka...');
                yield Promise.all([
                    this.consumer.disconnect().catch(error => logger.warn('Error disconnecting consumer', error)),
                    this.producer.disconnect().catch(error => logger.warn('Error disconnecting producer', error)),
                    this.admin.disconnect().catch(error => logger.warn('Error disconnecting admin', error)),
                ]);
                this.isConnected = false;
                logger.info('Kafka disconnected successfully');
            }
            catch (error) {
                logger.error('Error during Kafka disconnect', error);
            }
        });
    }
    // Send message method for testing
    sendMessage(topic, message, key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.producer.send({
                    topic,
                    messages: [{
                            key,
                            value: JSON.stringify(message),
                            timestamp: Date.now().toString(),
                        }],
                });
                logger.debug('Message sent successfully', { topic, key, messageId: message.id });
            }
            catch (error) {
                logger.error('Failed to send message', { error, topic, key });
                throw error;
            }
        });
    }
}
exports.KafkaService = KafkaService;
exports.kafkaService = new KafkaService();
//# sourceMappingURL=kafkaService.js.map