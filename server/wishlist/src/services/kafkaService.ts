import { config } from '@/config';
import type { PriceCalculationRequest } from '@/types';
import { Logger } from '@/utils/logger';
import { Consumer, Kafka, Partitioners, Producer } from 'kafkajs';

const logger = new Logger('KafkaService')

export class KafkaService {
    private kafka: Kafka;
    private producer: Producer | null = null;
    private consumer: Consumer | null = null;
    private isConnected = false;

    constructor() {
        this.kafka = new Kafka({
            clientId: config.kafka.clientId,
            brokers: config.kafka.brokers,
            retry: {
                initialRetryTime: 100,
                retries: 8,
                maxRetryTime: 30000,
                factor: 2,
                multiplier: 2,
                restartOnFailure: async (e) => {
                    logger.error('Kafka restart on failure', e);
                    return true;
                },
            },
            connectionTimeout: 3000,
            requestTimeout: 25000,
        });
    }

    async connect(): Promise<void> {
        try {
            // Wait for Kafka to be ready
            await this.waitForKafka();

            // Create producer with proper configuration
            this.producer = this.kafka.producer({
                createPartitioner: Partitioners.LegacyPartitioner,
                maxInFlightRequests: 1,
                idempotent: true,
                transactionTimeout: 30000,
                retry: {
                    initialRetryTime: 100,
                    retries: 5,
                },
            });

            await this.producer.connect();
            logger.info('Kafka producer connected successfully');

            // Setup consumer
            this.consumer = this.kafka.consumer({
                groupId: config.kafka.groupId,
                sessionTimeout: 30000,
                heartbeatInterval: 3000,
                maxWaitTimeInMs: 5000,
                retry: {
                    initialRetryTime: 100,
                    retries: 8,
                },
            });

            await this.consumer.connect();
            logger.info('Kafka consumer connected successfully');

            // Create topics if they don't exist
            await this.createTopics();

            // Subscribe to topics
            await this.consumer.subscribe({
                topics: [config.kafka.topics.priceCalculationResponse],
                fromBeginning: false,
            });

            this.isConnected = true;
            logger.info('Kafka service initialized successfully');

        } catch (error) {
            logger.error('Failed to connect to Kafka', error);
            this.isConnected = false;
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            this.isConnected = false;

            if (this.producer) {
                await this.producer.disconnect();
                this.producer = null;
                logger.info('Kafka producer disconnected');
            }

            if (this.consumer) {
                await this.consumer.disconnect();
                this.consumer = null;
                logger.info('Kafka consumer disconnected');
            }

            logger.info('Kafka disconnected successfully');
        } catch (error) {
            logger.error('Error disconnecting from Kafka', error);
        }
    }

    private async waitForKafka(): Promise<void> {
        const maxAttempts = 30;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const admin = this.kafka.admin();
                await admin.connect();
                await admin.listTopics();
                await admin.disconnect();
                logger.info('Kafka is ready');
                return;
            } catch (error) {
                attempts++;
                logger.warn(`Waiting for Kafka to be ready... attempt ${attempts}/${maxAttempts}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        throw new Error('Kafka is not ready after maximum attempts');
    }

    private async createTopics(): Promise<void> {
        try {
            const admin = this.kafka.admin();
            await admin.connect();

            const existingTopics = await admin.listTopics();
            const topicsToCreate = [];

            if (!existingTopics.includes(config.kafka.topics.priceCalculationRequest)) {
                topicsToCreate.push({
                    topic: config.kafka.topics.priceCalculationRequest,
                    numPartitions: 3,
                    replicationFactor: 1,
                });
            }

            if (!existingTopics.includes(config.kafka.topics.priceCalculationResponse)) {
                topicsToCreate.push({
                    topic: config.kafka.topics.priceCalculationResponse,
                    numPartitions: 3,
                    replicationFactor: 1,
                });
            }

            if (topicsToCreate.length > 0) {
                await admin.createTopics({
                    topics: topicsToCreate,
                    waitForLeaders: true,
                    timeout: 30000,
                });
                logger.info(`Created topics: ${topicsToCreate.map(t => t.topic).join(', ')}`);
            }

            await admin.disconnect();
        } catch (error) {
            logger.error('Error creating topics', error);
        }
    }

    async sendPriceCalculationRequest(request: PriceCalculationRequest): Promise<void> {
        if (!this.producer || !this.isConnected) {
            logger.warn('Kafka producer not available, skipping price request');
            return;
        }

        try {
            await this.producer.send({
                topic: config.kafka.topics.priceCalculationRequest,
                messages: [
                    {
                        key: request.requestId,
                        value: JSON.stringify(request),
                        timestamp: Date.now().toString(),
                        headers: {
                            source: 'wishlist-service',
                            version: '1.0',
                        },
                    },
                ],
            });

            logger.info(`Sent price calculation request: ${request.requestId}`, {
                requestId: request.requestId,
                userId: request.userId,
                itemCount: request.items.length
            });
        } catch (error) {
            logger.error('Failed to send price calculation request', error);
        }
    }

    async startConsumer(): Promise<void> {
        if (!this.consumer || !this.isConnected) {
            logger.warn('Kafka consumer not available');
            return;
        }

        try {
            await this.consumer.run({
                partitionsConsumedConcurrently: 3,
                eachMessage: async ({ topic, partition, message, heartbeat }) => {
                    try {
                        const value = message.value?.toString();
                        if (!value) return;

                        const data = JSON.parse(value);

                        logger.info(`Received message from topic ${topic}`, {
                            partition,
                            offset: message.offset,
                            key: message.key?.toString(),
                            requestId: data.requestId,
                        });

                        // Handle price response from Product Service
                        if (topic === config.kafka.topics.priceCalculationResponse) {
                            await this.handlePriceResponse(data);
                        }

                        await heartbeat();

                    } catch (error) {
                        logger.error('Error processing Kafka message', error);
                    }
                },
            });
        } catch (error) {
            logger.error('Error starting Kafka consumer', error);
        }
    }

    private async handlePriceResponse(data: any): Promise<void> {
        try {
            logger.info('Processing price calculation response', {
                requestId: data.requestId,
                success: data.success,
                itemCount: data.items?.length || 0,
                totalAmount: data.totalAmount,
            });

            if (data.success && data.items) {
                const { redisService } = await import('./redisService');

                for (const item of data.items) {
                    if (item.available && item.unitPrice) {
                        await redisService.cachePriceInfo(item.productId, {
                            id: item.productId,
                            name: item.productName,
                            price: item.unitPrice,
                            inventoryStatus: item.inventoryStatus,
                            lastUpdated: new Date().toISOString(),
                        }, 600); // Cache 10 minutes
                    }
                }

                logger.info(`Updated price cache for ${data.items.length} products`);
            }

        } catch (error) {
            logger.error('Error handling price response', error);
        }
    }

    // Health check method
    async isHealthy(): Promise<boolean> {
        return this.isConnected && this.producer !== null;
    }
}

export const kafkaService = new KafkaService();