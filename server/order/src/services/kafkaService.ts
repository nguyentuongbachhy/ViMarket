import { config } from '@/config';
import { Logger } from '@/utils/logger';
import { Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

const logger = new Logger('OrderKafkaService');

export interface OrderCreatedEvent {
    eventId: string;
    orderId: string;
    userId: string;
    userEmail: string;
    orderStatus: string;
    totalAmount: number;
    currency: string;
    paymentMethod: string;
    items: Array<{
        productId: string;
        productName: string;
        imageUrl?: string;
        quantity: number;
        price: number;
        totalPrice: number;
    }>;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    timestamp: string;
}

export interface OrderStatusUpdatedEvent {
    eventId: string;
    orderId: string;
    userId: string;
    userEmail: string;
    oldStatus: string;
    newStatus: string;
    totalAmount: number;
    items: Array<{
        productId: string;
        productName: string;
        imageUrl?: string;
        quantity: number;
        price: number;
    }>;
    updatedBy?: string;
    timestamp: string;
}

export interface OrderCancelledEvent {
    eventId: string;
    orderId: string;
    userId: string;
    userEmail: string;
    reason: string;
    totalAmount: number;
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }>;
    cancelledBy?: string;
    timestamp: string;
}

export class OrderKafkaService {
    private kafka: Kafka;
    private producer: Producer;
    private isConnected = false;

    // Kafka topics
    private readonly topics = {
        ORDER_CREATED: 'order.created',
        ORDER_STATUS_UPDATED: 'order.status.updated',  
        ORDER_CANCELLED: 'order.cancelled',
    };

    constructor() {
        this.kafka = new Kafka({
            clientId: 'order-service',
            brokers: ['localhost:9092'], // Use your Kafka broker address
            connectionTimeout: 10000,
            requestTimeout: 30000,
            retry: {
                initialRetryTime: 300,
                retries: 10,
                maxRetryTime: 30000,
            },
        });

        this.producer = this.kafka.producer({
            retry: {
                initialRetryTime: 300,
                retries: 5,
                maxRetryTime: 30000,
            },
            allowAutoTopicCreation: true,
        });
    }

    async connect(): Promise<void> {
        const maxRetries = 10;
        const retryDelay = 2000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.info(`Attempting to connect to Kafka (${attempt}/${maxRetries})...`);

                await this.producer.connect();
                this.isConnected = true;
                
                logger.info('✅ Kafka producer connected successfully');
                return;

            } catch (error) {
                logger.warn(`Kafka connection attempt ${attempt} failed`, {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });

                if (attempt === maxRetries) {
                    logger.error('Failed to connect to Kafka after maximum attempts');
                    throw error;
                }

                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    async publishOrderCreated(event: OrderCreatedEvent): Promise<void> {
        try {
            if (!this.isConnected) {
                logger.warn('Kafka producer not connected, skipping event');
                return;
            }

            await this.producer.send({
                topic: this.topics.ORDER_CREATED,
                messages: [{
                    key: event.orderId,
                    value: JSON.stringify(event),
                    timestamp: Date.now().toString(),
                }],
            });

            logger.info('✅ Order created event published', {
                eventId: event.eventId,
                orderId: event.orderId,
                userId: event.userId,
                topic: this.topics.ORDER_CREATED,
            });

        } catch (error) {
            logger.error('❌ Failed to publish order created event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                orderId: event.orderId,
            });
            // Don't throw - we don't want to break order creation if Kafka fails
        }
    }

    async publishOrderStatusUpdated(event: OrderStatusUpdatedEvent): Promise<void> {
        try {
            if (!this.isConnected) {
                logger.warn('Kafka producer not connected, skipping event');
                return;
            }

            await this.producer.send({
                topic: this.topics.ORDER_STATUS_UPDATED,
                messages: [{
                    key: event.orderId,
                    value: JSON.stringify(event),
                    timestamp: Date.now().toString(),
                }],
            });

            logger.info('✅ Order status updated event published', {
                eventId: event.eventId,
                orderId: event.orderId,
                userId: event.userId,
                oldStatus: event.oldStatus,
                newStatus: event.newStatus,
                topic: this.topics.ORDER_STATUS_UPDATED,
            });

        } catch (error) {
            logger.error('❌ Failed to publish order status updated event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                orderId: event.orderId,
            });
        }
    }

    async publishOrderCancelled(event: OrderCancelledEvent): Promise<void> {
        try {
            if (!this.isConnected) {
                logger.warn('Kafka producer not connected, skipping event');
                return;
            }

            await this.producer.send({
                topic: this.topics.ORDER_CANCELLED,
                messages: [{
                    key: event.orderId,
                    value: JSON.stringify(event),
                    timestamp: Date.now().toString(),
                }],
            });

            logger.info('✅ Order cancelled event published', {
                eventId: event.eventId,
                orderId: event.orderId,
                userId: event.userId,
                reason: event.reason,
                topic: this.topics.ORDER_CANCELLED,
            });

        } catch (error) {
            logger.error('❌ Failed to publish order cancelled event', {
                error: error instanceof Error ? error.message : error,
                eventId: event.eventId,
                orderId: event.orderId,
            });
        }
    }

    async isHealthy(): Promise<boolean> {
        try {
            if (!this.isConnected) {
                return false;
            }

            // Send a test message to check connectivity
            await this.producer.send({
                topic: 'health-check',
                messages: [{
                    key: 'health',
                    value: JSON.stringify({ timestamp: Date.now() }),
                }],
            });

            return true;
        } catch (error) {
            logger.warn('Kafka health check failed', { 
                error: error instanceof Error ? error.message : error 
            });
            return false;
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.isConnected) {
                await this.producer.disconnect();
                this.isConnected = false;
                logger.info('✅ Kafka producer disconnected');
            }
        } catch (error) {
            logger.error('❌ Error disconnecting Kafka producer', error);
        }
    }

    close(): void {
        this.disconnect().catch(error => {
            logger.error('Error during Kafka close', error);
        });
    }
}

export const orderKafkaService = new OrderKafkaService();