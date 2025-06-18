// src/server.ts
import { config } from '@/config';
import { apiRoutes } from '@/routes';
import { firebaseService } from '@/services/firebaseService';
import { kafkaService } from '@/services/kafkaService';
import { redisService } from '@/services/redisService';
import { Logger } from '@/utils/logger';
import { ResponseUtils } from '@/utils/response';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

const logger = new Logger('NotificationServer');

class NotificationServer {
    private app: express.Application;
    private server: any;
    private isShuttingDown = false;

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private setupMiddleware(): void {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
        }));

        // CORS
        this.app.use(cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);

                if (config.server.nodeEnv === 'development') {
                    return callback(null, true);
                }

                const allowedOrigins = [
                    'http://localhost:3000',
                    'http://localhost:5173',
                    'http://localhost:8080',
                ];

                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }

                callback(new Error('Not allowed by CORS'));
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            allowedHeaders: [
                'Origin',
                'Content-Type',
                'Accept',
                'Authorization',
                'X-Requested-With',
            ],
        }));

        this.app.use(compression());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging middleware
        this.app.use((req, res, next) => {
            if (req.url !== '/health' && req.url !== '/api/v1/ping') { // Avoid spamming health checks
                logger.debug('Incoming request', {
                    method: req.method,
                    url: req.url,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                });
            }
            next();
        });

        this.app.set('trust proxy', 1);
    }

    private setupRoutes(): void {
        this.app.use('/api/v1', apiRoutes);

        this.app.get('/', (req, res) => {
            res.json({
                service: 'notification-service',
                status: 'running',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                environment: config.server.nodeEnv,
            });
        });

        this.app.get('/health', async (req, res) => {
            try {
                if (this.isShuttingDown) {
                    return res.status(503).json({
                        status: 'SHUTTING_DOWN',
                        timestamp: new Date().toISOString(),
                    });
                }

                const healthChecks = await Promise.allSettled([
                    this.checkRedisHealth(),
                    this.checkKafkaHealth(),
                    this.checkFirebaseHealth(),
                ]);

                const health = {
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    service: 'notification-service',
                    version: '1.0.0',
                    environment: config.server.nodeEnv,
                    dependencies: {
                        redis: healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : 'error',
                        kafka: healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : 'error',
                        firebase: healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : 'error',
                    },
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                };

                const hasFailures = Object.values(health.dependencies).some(
                    status => status === 'disconnected' || status === 'error'
                );

                res.status(hasFailures ? 503 : 200).json(health);
            } catch (error) {
                logger.error('Health check failed', error);
                res.status(503).json({
                    status: 'ERROR',
                    timestamp: new Date().toISOString(),
                    service: 'notification-service',
                    error: 'Health check failed',
                });
            }
        });

        // Ready check for Kubernetes
        this.app.get('/ready', async (req, res) => {
            try {
                const isReady = await this.checkReadiness();
                res.status(isReady ? 200 : 503).json({
                    status: isReady ? 'READY' : 'NOT_READY',
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                res.status(503).json({
                    status: 'NOT_READY',
                    timestamp: new Date().toISOString(),
                    error: 'Readiness check failed',
                });
            }
        });

        this.app.use('*', (req, res) => {
            ResponseUtils.notFound(res, `Route ${req.originalUrl} not found`);
        });
    }

    private async checkReadiness(): Promise<boolean> {
        try {
            // Check if all critical services are connected
            const [redisHealthy, kafkaHealthy] = await Promise.all([
                redisService.isHealthy(),
                kafkaService.isHealthy(),
            ]);

            return redisHealthy && kafkaHealthy;
        } catch {
            return false;
        }
    }

    private async checkRedisHealth(): Promise<string> {
        try {
            const start = Date.now();
            const isHealthy = await redisService.isHealthy();
            const duration = Date.now() - start;

            logger.debug('Redis health check completed', { isHealthy, duration });
            return isHealthy ? 'connected' : 'disconnected';
        } catch (error) {
            logger.warn('Redis health check error', error);
            return 'error';
        }
    }

    private async checkKafkaHealth(): Promise<string> {
        try {
            const start = Date.now();
            const isHealthy = await kafkaService.isHealthy();
            const duration = Date.now() - start;

            logger.debug('Kafka health check completed', { isHealthy, duration });
            return isHealthy ? 'connected' : 'disconnected';
        } catch (error) {
            logger.warn('Kafka health check error', error);
            return 'error';
        }
    }

    private async checkFirebaseHealth(): Promise<string> {
        try {
            const start = Date.now();
            const isHealthy = await firebaseService.isHealthy();
            const duration = Date.now() - start;

            logger.debug('Firebase health check completed', { isHealthy, duration });
            return isHealthy ? 'connected' : 'disconnected';
        } catch (error) {
            logger.warn('Firebase health check error', error);
            return 'error';
        }
    }

    private setupErrorHandling(): void {
        this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            logger.error('Unhandled error', {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                },
                request: {
                    path: req.path,
                    method: req.method,
                    headers: req.headers,
                    query: req.query,
                    body: req.body,
                },
            });

            const status = error.status || error.statusCode || 500;
            const message = status === 500 && config.server.nodeEnv === 'production'
                ? 'Internal server error'
                : error.message;

            ResponseUtils.error(res, message, status);
        });
    }

    async start(): Promise<void> {
        try {
            logger.info('🚀 Starting Notification Service...', {
                version: '1.0.0',
                nodeEnv: config.server.nodeEnv,
                port: config.server.port,
            });

            // Wait for dependencies with detailed progress
            await this.waitForDependencies();

            // Start HTTP server
            this.server = this.app.listen(config.server.port, config.server.host, () => {
                logger.info('✅ HTTP server started successfully', {
                    port: config.server.port,
                    host: config.server.host,
                });
            });

            // Start Kafka consumer after HTTP server is ready
            logger.info('🔄 Starting Kafka consumer...');
            await kafkaService.startConsumer();
            logger.info('✅ Kafka consumer started successfully');

            this.setupGracefulShutdown();

            logger.info('🎉 Notification service fully started and ready', {
                port: config.server.port,
                nodeEnv: config.server.nodeEnv,
                kafkaBrokers: config.kafka.brokers,
                redisHost: config.redis.host,
                processes: {
                    pid: process.pid,
                    platform: process.platform,
                    nodeVersion: process.version,
                },
            });

        } catch (error) {
            logger.error('❌ Failed to start notification service', {
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack,
                } : error,
            });
            process.exit(1);
        }
    }

    private async waitForDependencies(): Promise<void> {
        logger.info('⏳ Waiting for dependencies...');

        // Connect to Redis first (usually faster)
        await this.connectWithRetry(
            'Redis',
            () => redisService.connect(),
            15, // Max retries
            2000 // Retry delay
        );

        // Connect to Kafka (may take longer)
        await this.connectWithRetry(
            'Kafka',
            () => kafkaService.connect(),
            30, // Max retries
            3000 // Retry delay
        );

        logger.info('✅ All dependencies ready');
    }

    private async connectWithRetry(
        serviceName: string,
        connectFn: () => Promise<void>,
        maxRetries: number = 30,
        retryDelay: number = 2000
    ): Promise<void> {
        let retries = 0;
        let lastError: Error | undefined;

        while (retries < maxRetries) {
            try {
                logger.info(`🔄 Connecting to ${serviceName}...`, {
                    attempt: retries + 1,
                    maxRetries,
                });

                await connectFn();
                logger.info(`✅ ${serviceName} connected successfully`);
                return;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                retries++;

                logger.warn(`⏳ ${serviceName} connection failed, retrying...`, {
                    attempt: retries,
                    maxRetries,
                    error: lastError.message,
                    nextRetryIn: retryDelay,
                });

                if (retries >= maxRetries) {
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }

        throw new Error(
            `${serviceName} connection timeout after ${maxRetries} attempts. Last error: ${lastError?.message}`
        );
    }

    private setupGracefulShutdown(): void {
        const shutdown = async (signal: string) => {
            if (this.isShuttingDown) {
                logger.warn('🛑 Shutdown already in progress, forcing exit...');
                process.exit(1);
            }

            this.isShuttingDown = true;
            logger.info(`🛑 ${signal} received, starting graceful shutdown...`);

            // Stop accepting new connections
            if (this.server) {
                this.server.close(async () => {
                    logger.info('✅ HTTP server closed');

                    try {
                        // Disconnect from services
                        logger.info('🔄 Disconnecting from services...');

                        await Promise.allSettled([
                            redisService.disconnect(),
                            kafkaService.disconnect(),
                        ]);

                        logger.info('✅ All services disconnected');
                        logger.info('✅ Graceful shutdown completed');
                        process.exit(0);

                    } catch (error) {
                        logger.error('❌ Error during graceful shutdown', error);
                        process.exit(1);
                    }
                });
            } else {
                process.exit(0);
            }
        };

        // Handle termination signals
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('💥 Uncaught exception', {
                error: {
                    message: error.message,
                    stack: error.stack,
                },
            });
            shutdown('UNCAUGHT_EXCEPTION');
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('💥 Unhandled promise rejection', {
                reason,
                promise,
            });
            shutdown('UNHANDLED_REJECTION');
        });

        // Force exit after timeout
        const shutdownTimeout = setTimeout(() => {
            logger.error('⏰ Force exit after 30 seconds timeout');
            process.exit(1);
        }, 30000);

        // Clear timeout if shutdown completes normally
        process.on('exit', () => {
            clearTimeout(shutdownTimeout);
        });
    }
}

// Start the server
const notificationServer = new NotificationServer();
notificationServer.start().catch((error) => {
    console.error('💥 Failed to start notification service:', error);
    process.exit(1);
});