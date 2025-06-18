import { config } from '@/config';
import { Logger } from '@/utils/logger';
import { Kafka, Producer } from 'kafkajs';

const logger = new Logger('CartKafkaService');

export interface CartExpirationEvent {
    eventId: string;
    userId: string;
    cartId: string;
    expiresAt: string;
    daysUntilExpiration: number;
    itemCount: number;
    totalValue: number;
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }>;
    timestamp: string;
}

export class CartKafkaService {
    private kafka: Kafka;
    private producer: Producer;
    private isConnected = false;

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
            },
        });

        this.producer = this.kafka.producer({
            retry: {
                initialRetryTime: 300,
                retries: 5,
                maxRetryTime: 30000,
            },
        });
    }

    async connect(): Promise<void> {
        try {
            await this.producer.connect();
            this.isConnected = true;
            logger.info('Cart Kafka producer connected successfully');
        } catch (error) {
            logger.error('Failed to connect Cart Kafka producer', error);
            throw error;
        }
    }

    async sendCartExpirationEvent(event: CartExpirationEvent): Promise<void> {
        if (!this.isConnected) {
            logger.warn('Kafka producer not connected, skipping message');
            return;
        }

        try {
            await this.producer.send({
                topic: config.kafka.topics.cartExpiration,
                messages: [
                    {
                        key: `${event.userId}:${event.cartId}`,
                        value: JSON.stringify(event),
                        timestamp: Date.now().toString(),
                        headers: {
                            'event-type': 'cart.expiration.reminder',
                            'user-id': event.userId,
                            'days-until-expiration': event.daysUntilExpiration.toString(),
                        },
                    },
                ],
            });

            logger.info('Cart expiration event sent successfully', {
                userId: event.userId,
                daysUntilExpiration: event.daysUntilExpiration,
                eventId: event.eventId,
            });
        } catch (error) {
            logger.error('Failed to send cart expiration event', {
                error,
                userId: event.userId,
                eventId: event.eventId,
            });
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.isConnected) {
                await this.producer.disconnect();
                this.isConnected = false;
                logger.info('Cart Kafka producer disconnected');
            }
        } catch (error) {
            logger.error('Error disconnecting Cart Kafka producer', error);
        }
    }

    isHealthy(): boolean {
        return this.isConnected;
    }
}

export const cartKafkaService = new CartKafkaService();