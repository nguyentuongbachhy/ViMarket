import { config } from '@/config';
import {
    CartUpdatedEvent,
    InventoryUpdatedEvent,
    NotificationChannel,
    NotificationEvent,
    NotificationEventType,
    NotificationPriority,
    ProductPriceChangedEvent,
    WishlistUpdatedEvent,
} from '@/types';
import { Logger } from '@/utils/logger';
import { Admin, Consumer, EachMessagePayload, Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { notificationService } from './notificationService';

const logger = new Logger('KafkaService');

export class KafkaService {
    private kafka: Kafka;
    private consumer: Consumer;
    private producer: Producer;
    private admin: Admin;
    private isConnected = false;
    private connectionAttempts = 0;
    private readonly maxConnectionAttempts = 10;

    constructor() {
        this.kafka = new Kafka({
            clientId: config.kafka.clientId,
            brokers: config.kafka.brokers,
            connectionTimeout: 10000,
            requestTimeout: 30000,
            retry: {
                initialRetryTime: 300,
                retries: 10,
                maxRetryTime: 30000,
                factor: 2,
                multiplier: 2,
                restartOnFailure: async (e) => {
                    logger.error('Kafka restart on failure', e);
                    return true;
                },
            },
            logLevel: config.server.nodeEnv === 'development' ? 1 : 2, // INFO in dev, WARN in prod
        });

        this.consumer = this.kafka.consumer({
            groupId: config.kafka.groupId,
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

    async connect(): Promise<void> {
        const maxRetries = 30;
        const retryDelay = 2000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.info(`Attempting to connect to Kafka (${attempt}/${maxRetries})...`);

                // Test admin connection first
                await this.admin.connect();
                logger.info('Kafka admin connected successfully');

                // Connect producer
                await this.producer.connect();
                logger.info('Kafka producer connected successfully');

                // Connect consumer
                await this.consumer.connect();
                logger.info('Kafka consumer connected successfully');

                // Create topics if they don't exist
                await this.ensureTopicsExist();

                // Subscribe to topics
                const topics = Object.values(config.kafka.topics);
                await this.consumer.subscribe({
                    topics,
                    fromBeginning: false,
                });

                logger.info('Subscribed to Kafka topics successfully', { topics });
                this.isConnected = true;
                this.connectionAttempts = 0;
                return;

            } catch (error) {
                logger.warn(`Kafka connection attempt ${attempt} failed`, {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    brokers: config.kafka.brokers,
                });

                if (attempt === maxRetries) {
                    logger.error('Failed to connect to Kafka after maximum attempts', {
                        attempts: maxRetries,
                        brokers: config.kafka.brokers,
                    });
                    throw error;
                }

                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    private async ensureTopicsExist(): Promise<void> {
        try {
            const topics = Object.values(config.kafka.topics);
            const existingTopics = await this.admin.listTopics();

            const topicsToCreate = topics.filter(topic => !existingTopics.includes(topic));

            if (topicsToCreate.length > 0) {
                logger.info('Creating missing Kafka topics', { topics: topicsToCreate });

                await this.admin.createTopics({
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
            } else {
                logger.info('All Kafka topics already exist', { topics });
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('Topic already exists')) {
                logger.info('Topics already exist, continuing...');
                return;
            }
            logger.error('Failed to ensure topics exist', error);
            throw error;
        }
    }

    async startConsumer(): Promise<void> {
        if (!this.isConnected) {
            throw new Error('Kafka consumer not connected');
        }

        try {
            await this.consumer.run({
                partitionsConsumedConcurrently: 3,
                eachMessage: async (payload: EachMessagePayload) => {
                    await this.handleMessage(payload);
                },
            });

            logger.info('Kafka consumer started successfully');
        } catch (error) {
            logger.error('Failed to start Kafka consumer', error);
            throw error;
        }
    }

    private async handleMessage(payload: EachMessagePayload): Promise<void> {
        const { topic, partition, message, heartbeat } = payload;
        const messageKey = message.key?.toString();
        const messageOffset = message.offset;

        try {
            // Heartbeat early
            await heartbeat();

            const messageValue = message.value?.toString();
            if (!messageValue) {
                logger.warn('Received empty message', {
                    topic,
                    partition,
                    offset: messageOffset,
                    key: messageKey,
                });
                return;
            }

            let data: any;
            try {
                data = JSON.parse(messageValue);
            } catch (parseError) {
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
                case config.kafka.topics.wishlistUpdated:
                    await this.handleWishlistUpdated(data as WishlistUpdatedEvent);
                    break;

                case config.kafka.topics.inventoryUpdated:
                    await this.handleInventoryUpdated(data as InventoryUpdatedEvent);
                    break;

                case config.kafka.topics.cartUpdated:
                    await this.handleCartUpdated(data as CartUpdatedEvent);
                    break;

                case config.kafka.topics.productPriceChanged:
                    await this.handleProductPriceChanged(data as ProductPriceChangedEvent);
                    break;

                case config.kafka.topics.inventoryLowStock:
                    await this.handleInventoryLowStock(data as InventoryUpdatedEvent);
                    break;

                case config.kafka.topics.cartAbandoned:
                    await this.handleCartAbandoned(data as CartUpdatedEvent);
                    break;

                default:
                    logger.warn('Unknown topic received', {
                        topic,
                        availableTopics: Object.values(config.kafka.topics)
                    });
            }

            // Final heartbeat
            await heartbeat();

            logger.debug('Message processed successfully', {
                topic,
                partition,
                offset: messageOffset,
                key: messageKey,
                eventId: data.eventId,
            });

        } catch (error) {
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
    }

    // Enhanced event handlers with better error handling
    private async handleWishlistUpdated(event: WishlistUpdatedEvent): Promise<void> {
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
                const notification: NotificationEvent = {
                    id: uuidv4(),
                    type: NotificationEventType.WISHLIST_PRODUCT_RESTOCKED,
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
                    priority: NotificationPriority.HIGH,
                    channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
                    metadata: {
                        source: 'wishlist-service',
                        productId: event.productId,
                        timestamp: event.timestamp,
                        eventId: event.eventId,
                    },
                };

                await notificationService.sendNotification(notification);
            }
        } catch (error) {
            logger.error('Failed to handle wishlist updated event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                userId: event.userId,
            });
        }
    }

    private async handleInventoryUpdated(event: InventoryUpdatedEvent): Promise<void> {
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
        } catch (error) {
            logger.error('Failed to handle inventory updated event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                productId: event.productId,
            });
        }
    }

    private async handleCartUpdated(event: CartUpdatedEvent): Promise<void> {
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
            const lowStockItems = event.items.filter(item =>
                item.availableQuantity > 0 &&
                item.availableQuantity < item.quantity
            );

            if (lowStockItems.length > 0) {
                const notification: NotificationEvent = {
                    id: uuidv4(),
                    type: NotificationEventType.CART_ITEM_LOW_STOCK,
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
                    priority: NotificationPriority.HIGH,
                    channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
                    metadata: {
                        source: 'cart-service',
                        timestamp: event.timestamp,
                        eventId: event.eventId,
                    },
                };

                await notificationService.sendNotification(notification);
            }
        } catch (error) {
            logger.error('Failed to handle cart updated event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                userId: event.userId,
            });
        }
    }

    private async handleProductPriceChanged(event: ProductPriceChangedEvent): Promise<void> {
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
                const discountPercentage = Math.round(
                    ((event.oldPrice - event.newPrice) / event.oldPrice) * 100
                );

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
        } catch (error) {
            logger.error('Failed to handle product price changed event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                productId: event.productId,
            });
        }
    }

    private async handleInventoryLowStock(event: InventoryUpdatedEvent): Promise<void> {
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
        } catch (error) {
            logger.error('Failed to handle inventory low stock event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                productId: event.productId,
            });
        }
    }

    private async handleCartAbandoned(event: CartUpdatedEvent): Promise<void> {
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

            const notification: NotificationEvent = {
                id: uuidv4(),
                type: NotificationEventType.CART_ABANDONED,
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
                priority: NotificationPriority.NORMAL,
                channels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
                metadata: {
                    source: 'cart-service',
                    timestamp: event.timestamp,
                    eventId: event.eventId,
                },
            };

            await notificationService.sendNotification(notification);
        } catch (error) {
            logger.error('Failed to handle cart abandoned event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                userId: event.userId,
            });
        }
    }

    // Validation methods
    private validateWishlistEvent(event: WishlistUpdatedEvent): boolean {
        return !!(event.eventId && event.userId && event.productId && event.action && event.productInfo);
    }

    private validateInventoryEvent(event: InventoryUpdatedEvent): boolean {
        return !!(event.eventId && event.productId && event.productName);
    }

    private validateCartEvent(event: CartUpdatedEvent): boolean {
        return !!(event.eventId && event.userId && event.action && Array.isArray(event.items));
    }

    private validatePriceEvent(event: ProductPriceChangedEvent): boolean {
        return !!(event.eventId && event.productId && event.productName &&
            typeof event.oldPrice === 'number' && typeof event.newPrice === 'number');
    }

    // Health check
    async isHealthy(): Promise<boolean> {
        try {
            if (!this.isConnected) {
                return false;
            }

            // Test admin connection
            await Promise.race([
                this.admin.listTopics(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Health check timeout')), 5000)
                )
            ]);

            return true;
        } catch (error) {
            logger.warn('Kafka health check failed', { error: error instanceof Error ? error.message : error });
            return false;
        }
    }

    async disconnect(): Promise<void> {
        try {
            logger.info('Disconnecting from Kafka...');

            await Promise.all([
                this.consumer.disconnect().catch(error =>
                    logger.warn('Error disconnecting consumer', error)
                ),
                this.producer.disconnect().catch(error =>
                    logger.warn('Error disconnecting producer', error)
                ),
                this.admin.disconnect().catch(error =>
                    logger.warn('Error disconnecting admin', error)
                ),
            ]);

            this.isConnected = false;
            logger.info('Kafka disconnected successfully');
        } catch (error) {
            logger.error('Error during Kafka disconnect', error);
        }
    }

    // Send message method for testing
    async sendMessage(topic: string, message: any, key?: string): Promise<void> {
        try {
            await this.producer.send({
                topic,
                messages: [{
                    key,
                    value: JSON.stringify(message),
                    timestamp: Date.now().toString(),
                }],
            });

            logger.debug('Message sent successfully', { topic, key, messageId: message.id });
        } catch (error) {
            logger.error('Failed to send message', { error, topic, key });
            throw error;
        }
    }
}

export const kafkaService = new KafkaService();