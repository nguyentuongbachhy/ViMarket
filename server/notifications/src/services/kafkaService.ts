import { config } from '@/config';
import {
    CartExpirationEvent,
    CartItemAddedEvent,
    CartUpdatedEvent,
    InventoryUpdatedEvent,
    NotificationChannel,
    NotificationEvent,
    NotificationEventType,
    NotificationPriority,
    ProductPriceChangedEvent,
    WishlistUpdatedEvent,
    OrderCreatedEvent,
    OrderStatusUpdatedEvent,
    OrderCancelledEvent
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

                const connectPromise = Promise.all([
                    this.admin.connect(),
                    this.producer.connect(),
                    this.consumer.connect(),
                ]);

                await Promise.race([
                    connectPromise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Connection timeout')), 15000)
                    )
                ]);

                logger.info('All Kafka clients connected successfully');

                await this.ensureTopicsExist();

                const topics = [
                    ...Object.values(config.kafka.topics),
                    'cart.item.added',
                    'order.created',
                    'order.status.updated',
                    'order.cancelled',
                ];

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
            const processTimeout = setTimeout(() => {
                logger.warn('Message processing timeout', {
                    topic,
                    partition,
                    offset: messageOffset,
                    key: messageKey
                });
            }, 25000);

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
                clearTimeout(processTimeout);
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
                });
                clearTimeout(processTimeout);
                return;
            }

            logger.debug('Processing Kafka message', {
                topic,
                partition,
                offset: messageOffset,
                key: messageKey,
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

                case config.kafka.topics.cartExpiration:
                    await this.handleCartExpiration(data as CartExpirationEvent);
                    break;

                case 'cart.item.added':
                    await this.handleCartItemAdded(data as CartItemAddedEvent);
                    break;

                case config.kafka.topics.orderCreated:
                    await this.handleOrderCreated(data as OrderCreatedEvent);
                    break;

                case config.kafka.topics.orderStatusUpdated:
                    await this.handleOrderStatusUpdated(data as OrderStatusUpdatedEvent);
                    break;

                case config.kafka.topics.orderCancelled:
                    await this.handleOrderCancelled(data as OrderCancelledEvent);
                    break;

                default:
                    logger.warn('Unknown topic received', {
                        topic,
                        availableTopics: Object.values(config.kafka.topics)
                    });
            }

            // Final heartbeat
            await heartbeat();
            clearTimeout(processTimeout);

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
                        channels: [
                        NotificationChannel.PUSH,
                        NotificationChannel.IN_APP
                    ],
                    isRead: false,
                    createdAt: new Date(),
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

            }
        } catch (error) {
            logger.error('Failed to handle inventory updated event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                productId: event.productId,
            });
        }
    }

    private async handleCartItemAdded(event: CartItemAddedEvent): Promise<void> {
        try {
            if (!this.validateCartItemAddedEvent(event)) {
                logger.warn('Invalid cart item added event received', { event });
                return;
            }

            logger.debug('Processing cart item added event', {
                eventId: event.eventId,
                userId: event.userId,
                productId: event.productId,
                productName: event.productName,
                quantity: event.quantity,
            });

            const notification: NotificationEvent = {
                id: uuidv4(),
                type: NotificationEventType.CART_ITEM_ADDED,
                userId: event.userId,
                title: '🛒 Added to Cart!',
                message: `${event.productName} has been added to your cart`,
                data: {
                    cartId: event.cartId,
                    productId: event.productId,
                    productName: event.productName,
                    productPrice: event.productPrice,
                    productImage: event.productImage,
                    quantity: event.quantity,
                    totalCartItems: event.totalCartItems,
                    totalCartValue: event.totalCartValue,
                    eventId: event.eventId,
                },
                priority: NotificationPriority.LOW,
                channels: [
                    NotificationChannel.PUSH,
                    NotificationChannel.IN_APP
                ],
                isRead: false,
                createdAt: new Date(),
                metadata: {
                    source: 'cart-service',
                    productId: event.productId,
                    cartId: event.cartId,
                    timestamp: event.timestamp,
                    eventId: event.eventId,
                },
            };

            await notificationService.sendNotification(notification);
        } catch (error) {
            logger.error('Failed to handle cart item added event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                userId: event.userId,
            });
        }
    }

    private async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
        try {
            if (!this.validateOrderCreatedEvent(event)) {
                logger.warn('Invalid order created event received', { event });
                return;
            }

            logger.debug('Processing order created event', {
                eventId: event.eventId,
                orderId: event.orderId,
                userId: event.userId,
                totalAmount: event.totalAmount,
            });

            const notification: NotificationEvent = {
                id: uuidv4(),
                type: NotificationEventType.ORDER_CREATED,
                userId: event.userId,
                title: '🎉 Order Placed Successfully!',
                message: `Your order #${event.orderId.slice(-8)} has been placed successfully`,
                data: {
                    orderId: event.orderId,
                    orderStatus: event.orderStatus,
                    totalAmount: event.totalAmount,
                    currency: event.currency,
                    paymentMethod: event.paymentMethod,
                    itemCount: event.items.length,
                    totalItems: event.items.reduce((sum, item) => sum + item.quantity, 0),
                    shippingCity: event.shippingAddress.city,
                    estimatedDelivery: this.calculateEstimatedDelivery(),
                    eventId: event.eventId,
                },
                priority: NotificationPriority.HIGH,
                channels: [
                    NotificationChannel.PUSH,
                    NotificationChannel.IN_APP,
                    NotificationChannel.EMAIL
                ],
                isRead: false,
                createdAt: new Date(),
                metadata: {
                    source: 'order-service',
                    orderId: event.orderId,
                    timestamp: event.timestamp,
                    eventId: event.eventId,
                },
            };

            await notificationService.sendNotification(notification);
        } catch (error) {
            logger.error('Failed to handle order created event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                orderId: event.orderId,
            });
        }
    }

    private async handleOrderStatusUpdated(event: OrderStatusUpdatedEvent): Promise<void> {
        try {
            if (!this.validateOrderStatusUpdatedEvent(event)) {
                logger.warn('Invalid order status updated event received', { event });
                return;
            }

            logger.debug('Processing order status updated event', {
                eventId: event.eventId,
                orderId: event.orderId,
                userId: event.userId,
                oldStatus: event.oldStatus,
                newStatus: event.newStatus,
            });

            const statusInfo = this.getOrderStatusInfo(event.newStatus);
            
            const notification: NotificationEvent = {
                id: uuidv4(),
                type: this.mapOrderStatusToNotificationType(event.newStatus),
                userId: event.userId,
                title: statusInfo.title,
                message: statusInfo.message.replace('{orderId}', event.orderId.slice(-8)),
                data: {
                    orderId: event.orderId,
                    oldStatus: event.oldStatus,
                    newStatus: event.newStatus,
                    totalAmount: event.totalAmount,
                    itemCount: event.items.length,
                    estimatedDelivery: this.getEstimatedDeliveryByStatus(event.newStatus),
                    trackingInfo: this.getTrackingInfo(event.newStatus),
                    eventId: event.eventId,
                },
                priority: statusInfo.priority,
                channels: statusInfo.channels,
                isRead: false,
                createdAt: new Date(),
                metadata: {
                    source: 'order-service',
                    orderId: event.orderId,
                    oldStatus: event.oldStatus,
                    newStatus: event.newStatus,
                    timestamp: event.timestamp,
                    eventId: event.eventId,
                },
            };

            await notificationService.sendNotification(notification);
        } catch (error) {
            logger.error('Failed to handle order status updated event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                orderId: event.orderId,
            });
        }
    }

    private async handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
        try {
            if (!this.validateOrderCancelledEvent(event)) {
                logger.warn('Invalid order cancelled event received', { event });
                return;
            }

            logger.debug('Processing order cancelled event', {
                eventId: event.eventId,
                orderId: event.orderId,
                userId: event.userId,
                reason: event.reason,
            });

            const notification: NotificationEvent = {
                id: uuidv4(),
                type: NotificationEventType.ORDER_CANCELLED,
                userId: event.userId,
                title: '❌ Order Cancelled',
                message: `Your order #${event.orderId.slice(-8)} has been cancelled`,
                data: {
                    orderId: event.orderId,
                    reason: event.reason,
                    totalAmount: event.totalAmount,
                    itemCount: event.items.length,
                    cancelledBy: event.cancelledBy,
                    refundInfo: this.getRefundInfo(event.totalAmount),
                    eventId: event.eventId,
                },
                priority: NotificationPriority.HIGH,
                channels: [
                    NotificationChannel.PUSH,
                    NotificationChannel.IN_APP,
                    NotificationChannel.EMAIL
                ],
                isRead: false,
                createdAt: new Date(),
                metadata: {
                    source: 'order-service',
                    orderId: event.orderId,
                    timestamp: event.timestamp,
                    eventId: event.eventId,
                },
            };

            await notificationService.sendNotification(notification);
        } catch (error) {
            logger.error('Failed to handle order cancelled event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                orderId: event.orderId,
            });
        }
    }

    // Helper methods
    private validateOrderCreatedEvent(event: OrderCreatedEvent): boolean {
        return !!(
            event.eventId &&
            event.orderId &&
            event.userId &&
            event.userEmail &&
            event.totalAmount > 0 &&
            Array.isArray(event.items) &&
            event.items.length > 0
        );
    }

    private validateOrderStatusUpdatedEvent(event: OrderStatusUpdatedEvent): boolean {
        return !!(
            event.eventId &&
            event.orderId &&
            event.userId &&
            event.oldStatus &&
            event.newStatus &&
            event.oldStatus !== event.newStatus
        );
    }

    private validateOrderCancelledEvent(event: OrderCancelledEvent): boolean {
        return !!(
            event.eventId &&
            event.orderId &&
            event.userId &&
            event.reason
        );
    }

    private validateCartItemAddedEvent(event: CartItemAddedEvent): boolean {
        return !!(
            event.eventId &&
            event.userId &&
            event.productId &&
            event.productName &&
            event.quantity > 0
        );
    }

    private mapOrderStatusToNotificationType(status: string): NotificationEventType {
        switch (status) {
            case 'confirmed':
                return NotificationEventType.ORDER_CONFIRMED;
            case 'shipped':
                return NotificationEventType.ORDER_SHIPPED;
            case 'delivered':
                return NotificationEventType.ORDER_DELIVERED;
            case 'cancelled':
                return NotificationEventType.ORDER_CANCELLED;
            default:
                return NotificationEventType.ORDER_CREATED;
        }
    }

    private getOrderStatusInfo(status: string): {
        title: string;
        message: string;
        priority: NotificationPriority;
        channels: NotificationChannel[];
    } {
        switch (status) {
            case 'confirmed':
                return {
                    title: '✅ Order Confirmed',
                    message: 'Great news! Your order #{orderId} has been confirmed and is being prepared',
                    priority: NotificationPriority.HIGH,
                    channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                };
            case 'shipped':
                return {
                    title: '🚚 Order Shipped',
                    message: 'Your order #{orderId} is on its way! Track your package for updates',
                    priority: NotificationPriority.HIGH,
                    channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                };
            case 'delivered':
                return {
                    title: '🎉 Order Delivered',
                    message: 'Your order #{orderId} has been delivered successfully! Enjoy your purchase',
                    priority: NotificationPriority.HIGH,
                    channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP, NotificationChannel.EMAIL],
                };
            default:
                return {
                    title: '📦 Order Updated',
                    message: 'Your order #{orderId} status has been updated',
                    priority: NotificationPriority.NORMAL,
                    channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
                };
        }
    }

    private calculateEstimatedDelivery(): string {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 3); // Default 3 days
        return deliveryDate.toISOString().split('T')[0];
    }

    private getEstimatedDeliveryByStatus(status: string): string | null {
        switch (status) {
            case 'confirmed':
                const confirmDate = new Date();
                confirmDate.setDate(confirmDate.getDate() + 2);
                return confirmDate.toISOString().split('T')[0];
            case 'shipped':
                const shipDate = new Date();
                shipDate.setDate(shipDate.getDate() + 1);
                return shipDate.toISOString().split('T')[0];
            case 'delivered':
                return null; // Already delivered
            default:
                return null;
        }
    }

    private getTrackingInfo(status: string): string | null {
        if (status === 'shipped') {
            // In real implementation, this would come from shipping provider
            return `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        }
        return null;
    }

    private getRefundInfo(amount: number): string {
        return `Refund of ${new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)} will be processed within 3-5 business days`;
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
                    isRead: false,
                    createdAt: new Date(),
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
                isRead: false,
                createdAt: new Date(),
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

    private async handleCartExpiration(event: CartExpirationEvent): Promise<void> {
        try {
            if (!this.validateCartExpirationEvent(event)) {
                logger.warn('Invalid cart expiration event received', { event });
                return;
            }

            logger.debug('Processing cart expiration event', {
                eventId: event.eventId,
                userId: event.userId,
                daysUntilExpiration: event.daysUntilExpiration,
                itemCount: event.itemCount,
            });

            const notification: NotificationEvent = {
                id: uuidv4(),
                type: NotificationEventType.CART_EXPIRATION_REMINDER,
                userId: event.userId,
                title: this.getExpirationTitle(event.daysUntilExpiration),
                message: this.getExpirationMessage(event),
                data: {
                    cartId: event.cartId,
                    expiresAt: event.expiresAt,
                    daysUntilExpiration: event.daysUntilExpiration,
                    itemCount: event.itemCount,
                    totalValue: event.totalValue,
                    items: event.items.slice(0, 3), // Show only first 3 items
                    eventId: event.eventId,
                },
                priority: this.getExpirationPriority(event.daysUntilExpiration),
                channels: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
                isRead: false,
                createdAt: new Date(),
                metadata: {
                    source: 'cart-service',
                    cartId: event.cartId,
                    timestamp: event.timestamp,
                    eventId: event.eventId,
                },
            };

            await notificationService.sendNotification(notification);
        } catch (error) {
            logger.error('Failed to handle cart expiration event', {
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

    private validateCartExpirationEvent(event: CartExpirationEvent): boolean {
        return !!(
            event.eventId &&
            event.userId &&
            event.cartId &&
            event.daysUntilExpiration >= 0 &&
            event.itemCount > 0 &&
            Array.isArray(event.items)
        );
    }

    private getExpirationTitle(daysUntilExpiration: number): string {
        if (daysUntilExpiration === 1) {
            return 'Your cart expires tomorrow! ⏰';
        } else if (daysUntilExpiration <= 3) {
            return `Your cart expires in ${daysUntilExpiration} days ⚠️`;
        } else {
            return `Your cart expires in ${daysUntilExpiration} days 🛒`;
        }
    }

    private getExpirationMessage(event: CartExpirationEvent): string {
        const itemText = event.itemCount === 1 ? 'item' : 'items';

        if (event.daysUntilExpiration === 1) {
            return `Don't lose your ${event.itemCount} ${itemText}! Complete your purchase before they expire.`;
        } else {
            return `You have ${event.itemCount} ${itemText} waiting in your cart. Complete your purchase to save them!`;
        }
    }

    private getExpirationPriority(daysUntilExpiration: number): NotificationPriority {
        if (daysUntilExpiration === 1) {
            return NotificationPriority.HIGH;
        } else if (daysUntilExpiration <= 3) {
            return NotificationPriority.NORMAL;
        } else {
            return NotificationPriority.LOW;
        }
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
        if (!this.isConnected) {
            logger.info('Kafka already disconnected');
            return;
        }

        try {
            logger.info('Disconnecting from Kafka...');

            // Set flag to prevent new operations
            this.isConnected = false;

            // 🔧 FIX: Add timeouts to prevent hanging
            const disconnectPromises = [
                this.disconnectWithTimeout(
                    'consumer',
                    () => this.consumer.disconnect(),
                    10000
                ),
                this.disconnectWithTimeout(
                    'producer',
                    () => this.producer.disconnect(),
                    5000
                ),
                this.disconnectWithTimeout(
                    'admin',
                    () => this.admin.disconnect(),
                    5000
                ),
            ];

            await Promise.allSettled(disconnectPromises);
            logger.info('Kafka disconnected successfully');
        } catch (error) {
            logger.error('Error during Kafka disconnect', error);
        }
    }

    private async disconnectWithTimeout(
        name: string,
        disconnectFn: () => Promise<void>,
        timeout: number
    ): Promise<void> {
        try {
            await Promise.race([
                disconnectFn(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`${name} disconnect timeout`)), timeout)
                )
            ]);
            logger.debug(`${name} disconnected successfully`);
        } catch (error) {
            logger.warn(`Error disconnecting ${name}`, error);
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