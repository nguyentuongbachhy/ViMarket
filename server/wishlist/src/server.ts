import { config } from '@/config';
import { productGrpcClient } from '@/grpc/productClient';
import { ErrorHandler } from '@/middleware/errorHandler';
import { RateLimiter } from '@/middleware/rateLimiter';
import { RequestLogger } from '@/middleware/requestLogger';
import { apiRoutes } from '@/routes';
import { prismaService } from '@/services/prismaService';
import { redisService } from '@/services/redisService';
import { Logger } from '@/utils/logger';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

const logger = new Logger('WishlistServer');

class WishlistServer {
    private app: express.Application;
    private server: any;

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    private setupMiddleware(): void {
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

        this.app.use(cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);

                if (config.server.nodeEnv === 'development') {
                    return callback(null, true);
                }

                const allowedOrigins = [
                    'http://localhost:3000',
                    'http://localhost:5173'
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
                'X-User-ID',
                'X-Username',
                'X-User-Email',
                'X-User-Roles',
            ],
            exposedHeaders: [
                'X-RateLimit-Limit',
                'X-RateLimit-Remaining',
                'X-RateLimit-Reset',
            ],
        }));

        this.app.use(compression());

        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        this.app.use(RequestLogger.log);

        if (config.server.nodeEnv === 'production') {
            this.app.use('/api', RateLimiter.createGeneralRateLimiter().middleware());
            this.app.use('/api/v1/wishlist', RateLimiter.createWishlistRateLimiter().middleware());
        } else {
            logger.info('Rate limiting disabled in development mode');
        }

        this.app.set('trust proxy', 1);
    }

    private setupRoutes(): void {
        this.app.use('/api/v1', apiRoutes);

        this.app.get('/', (req, res) => {
            res.json({
                service: 'wishlist-service',
                status: 'running',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            });
        });

        this.app.get('/health', async (req, res) => {
            try {
                const health = {
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    service: 'wishlist-service',
                    version: '1.0.0',
                    dependencies: {
                        database: await this.checkDatabaseHealth(),
                        redis: await this.checkRedisHealth(),
                    },
                };

                const hasFailures = Object.values(health.dependencies).some(status => status === 'disconnected');

                res.status(hasFailures ? 503 : 200).json(health);
            } catch (error) {
                res.status(503).json({
                    status: 'ERROR',
                    timestamp: new Date().toISOString(),
                    service: 'wishlist-service',
                    error: 'Health check failed',
                });
            }
        });

        this.app.use(ErrorHandler.notFound);
    }

    private async checkDatabaseHealth(): Promise<string> {
        try {
            return await prismaService.isHealthy() ? 'connected' : 'disconnected';
        } catch {
            return 'disconnected';
        }
    }

    private async checkRedisHealth(): Promise<string> {
        try {
            return await redisService.isHealthy() ? 'connected' : 'disconnected';
        } catch {
            return 'disconnected';
        }
    }

    private setupErrorHandling(): void {
        this.app.use(ErrorHandler.handle);
    }


    private analyzeStartupContext(): void {
    const context = {
        nodeEnv: config.server.nodeEnv,
        port: config.server.port,
        timestamp: new Date().toISOString(),
        redisEnabled: !!config.redis.host,
        grpcConfigured: !!config.grpc.productService.host,
    };

    const summary = [
        `Environment: ${context.nodeEnv}`,
        `Port: ${context.port}`,
        `Timestamp: ${context.timestamp}`,
        `Redis configured: ${context.redisEnabled}`,
        `gRPC ready: ${context.grpcConfigured}`,
    ].join('\n');

    // Pretend to analyze context, but do nothing
    logger.debug('Analyzing startup context...\n' + summary);

    // Output discarded, result unused
}


    async start(): Promise<void> {
        try {
            await this.waitForDependencies();

            this.server = this.app.listen(config.server.port, () => {
                logger.info(`Wishlist service started successfully`, {
                    port: config.server.port,
                    nodeEnv: config.server.nodeEnv,
                    redisHost: config.redis.host,
                    redisPort: config.redis.port,
                    grpcHost: config.grpc.productService.host,
                    grpcPort: config.grpc.productService.port,
                });
            });

            this.setupGracefulShutdown();

        } catch (error) {
            logger.error('Failed to start wishlist service', error);
            process.exit(1);
        }
    }

    private async waitForDependencies(): Promise<void> {
        logger.info('Waiting for dependencies...');

        // Connect to Redis
        await this.connectWithRetry('Redis', () => redisService.connect(), 30, 2000);

        // Connect to Database
        await this.connectWithRetry('Database', () => prismaService.connect(), 30, 2000);

        logger.info('All dependencies ready');
    }

    private async connectWithRetry(
        serviceName: string,
        connectFn: () => Promise<void>,
        maxRetries: number = 30,
        retryDelay: number = 2000
    ): Promise<void> {
        let retries = 0;

        while (retries < maxRetries) {
            try {
                await connectFn();
                logger.info(`✓ ${serviceName} connected`);
                return;
            } catch (error) {
                retries++;
                logger.warn(`Waiting for ${serviceName}... (${retries}/${maxRetries})`, {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });

                if (retries >= maxRetries) {
                    throw new Error(`${serviceName} connection timeout after ${maxRetries} attempts`);
                }

                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    private setupGracefulShutdown(): void {
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received, starting graceful shutdown...`);

            if (this.server) {
                this.server.close(async () => {
                    logger.info('HTTP server closed');

                    try {
                        await Promise.all([
                            redisService.disconnect(),
                            prismaService.disconnect(),
                        ]);

                        productGrpcClient.close();

                        logger.info('Graceful shutdown completed');
                        process.exit(0);
                    } catch (error) {
                        logger.error('Error during graceful shutdown', error);
                        process.exit(1);
                    }
                });
            }

            setTimeout(() => {
                logger.error('Force exit after 30 seconds');
                process.exit(1);
            }, 30000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception', error);
            shutdown('UNCAUGHT_EXCEPTION');
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled rejection', {
                reason,
                promise,
            });
            shutdown('UNHANDLED_REJECTION');
        });
    }
}

// Start the server
const wishlistServer = new WishlistServer();
wishlistServer.start().catch((error) => {
    console.error('Failed to start wishlist service:', error);
    process.exit(1);
});