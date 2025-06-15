import { cartClient } from '@/clients/cartClient';
import { inventoryClient } from '@/clients/inventoryClient';
import { productClient } from '@/clients/productClient';
import { config } from '@/config';
import { database } from '@/database/connection';
import { ErrorHandler } from '@/middleware/errorHandler';
import { RequestLogger } from '@/middleware/requestLogger';
import { apiRoutes } from '@/routes';
import { Logger } from '@/utils/logger';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

const logger = new Logger('OrderServer');

class OrderServer {
    private app: express.Application;
    private server: any;
    private isShuttingDown = false;
    private healthCheckInterval: NodeJS.Timeout | null = null;

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
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
        }));

        // CORS configuration
        this.app.use(cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (config.server.nodeEnv === 'development') {
                    return callback(null, true);
                }
                const allowedOrigins = config.cors.origins;
                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                logger.warn('CORS rejected origin', { origin, allowedOrigins });
                callback(new Error('Not allowed by CORS'));
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            allowedHeaders: [
                'Origin', 'Content-Type', 'Accept', 'Authorization',
                'X-Requested-With', 'X-User-ID', 'X-Username', 'X-User-Roles', 'X-Request-ID',
            ],
            exposedHeaders: [
                'X-Request-ID', 'X-Response-Time'
            ],
        }));

        // Compression
        this.app.use(compression({
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression.filter(req, res);
            },
            level: 6,
            threshold: 1024,
        }));

        // Body parsing
        this.app.use(express.json({
            limit: '10mb',
            strict: true,
            type: ['application/json', 'application/*+json']
        }));
        this.app.use(express.urlencoded({
            extended: true,
            limit: '10mb',
            parameterLimit: 1000
        }));

        // Request ID middleware
        this.app.use((req, res, next) => {
            const requestId = req.headers['x-request-id'] ||
                `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            req.headers['x-request-id'] = requestId;
            res.setHeader('X-Request-ID', requestId);
            next();
        });

        // Request timing
        this.app.use((req, res, next) => {
            const startTime = Date.now();

            // Lưu method gốc để wrap
            const originalSend = res.send;
            const originalJson = res.json;
            const originalEnd = res.end;

            // Wrap res.send
            res.send = function (this: any, body: any) {
                const responseTime = Date.now() - startTime;
                if (!res.headersSent) {
                    res.setHeader('X-Response-Time', `${responseTime}ms`);
                }
                return originalSend.call(this, body);
            };

            // Wrap res.json
            res.json = function (this: any, obj: any) {
                const responseTime = Date.now() - startTime;
                if (!res.headersSent) {
                    res.setHeader('X-Response-Time', `${responseTime}ms`);
                }
                return originalJson.call(this, obj);
            };

            // Wrap res.end
            res.end = function (this: any, chunk?: any, encoding?: any) {
                const responseTime = Date.now() - startTime;
                if (!res.headersSent) {
                    res.setHeader('X-Response-Time', `${responseTime}ms`);
                }
                return originalEnd.call(this, chunk, encoding);
            };

            next();
        });

        // Request logging
        if (config.logging.level === 'debug') {
            this.app.use(RequestLogger.log);
        }

        // Trust proxy if behind reverse proxy
        this.app.set('trust proxy', 1);
        this.app.disable('x-powered-by');
    }

    private setupRoutes(): void {
        // API routes
        this.app.use('/api/v1', apiRoutes);

        // Health check endpoint
        this.app.get('/health', async (req, res) => {
            try {
                const healthStatus = await this.getHealthStatus();
                const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
                res.status(statusCode).json(healthStatus);
            } catch (error) {
                logger.error('Health check endpoint failed', error);
                res.status(503).json({
                    status: 'unhealthy',
                    error: 'Health check failed',
                    timestamp: new Date().toISOString(),
                });
            }
        });

        // Readiness check endpoint
        this.app.get('/ready', async (req, res) => {
            try {
                const readinessStatus = await this.getReadinessStatus();
                const statusCode = readinessStatus.ready ? 200 : 503;
                res.status(statusCode).json(readinessStatus);
            } catch (error) {
                logger.error('Readiness check endpoint failed', error);
                res.status(503).json({
                    ready: false,
                    error: 'Readiness check failed',
                    timestamp: new Date().toISOString(),
                });
            }
        });

        // Liveness probe
        this.app.get('/live', (req, res) => {
            res.status(200).json({
                status: 'alive',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                pid: process.pid,
            });
        });

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                service: 'order-service',
                status: 'running',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                environment: config.server.nodeEnv,
                uptime: process.uptime(),
                endpoints: {
                    health: '/health',
                    ready: '/ready',
                    live: '/live',
                    api: '/api/v1',
                },
                features: {
                    order_management: true,
                    cart_integration: true,
                    inventory_management: true,
                    payment_processing: true,
                },
            });
        });

        this.app.use(ErrorHandler.notFound);
    }

    private setupErrorHandling(): void {
        this.app.use(ErrorHandler.handle);
    }

    async start(): Promise<void> {
        try {
            logger.info('🚀 Starting Order Service...');

            // Wait for dependencies
            await this.waitForDependencies();

            // Start HTTP server
            await this.startHttpServer();

            // Setup graceful shutdown
            this.setupGracefulShutdown();

            // Start health monitoring
            this.startHealthMonitoring();

            logger.info('✅ Order service started successfully');

        } catch (error) {
            logger.error('❌ Failed to start order service', error);
            await this.cleanup();
            process.exit(1);
        }
    }

    private async waitForDependencies(): Promise<void> {
        logger.info('⏳ Waiting for dependencies to be ready...');

        const maxRetries = 30;
        const retryInterval = 2000;
        let attempt = 0;

        const dependencies = [
            {
                name: 'Database',
                check: () => this.checkDatabaseHealth(),
                required: true,
                timeout: 5000,
            },
            {
                name: 'Cart gRPC Service',
                check: () => this.checkCartGrpcHealth(),
                required: true,
                timeout: 10000,
            },
            {
                name: 'Inventory gRPC Service',
                check: () => this.checkInventoryGrpcHealth(),
                required: true,
                timeout: 10000,
            },
            {
                name: 'Product gRPC Service',
                check: () => this.checkProductGrpcHealth(),
                required: true,
                timeout: 10000,
            },
        ];

        while (attempt < maxRetries) {
            attempt++;
            logger.info(`🔍 Dependency check attempt ${attempt}/${maxRetries}`);

            const results = await Promise.allSettled(
                dependencies.map(async (dep) => {
                    try {
                        const startTime = Date.now();
                        const isHealthy = await Promise.race([
                            dep.check(),
                            new Promise<boolean>((_, reject) =>
                                setTimeout(() => reject(new Error('Health check timeout')), dep.timeout)
                            )
                        ]);
                        const responseTime = Date.now() - startTime;

                        return {
                            name: dep.name,
                            healthy: isHealthy,
                            required: dep.required,
                            responseTime,
                            error: null,
                        };
                    } catch (error) {
                        return {
                            name: dep.name,
                            healthy: false,
                            required: dep.required,
                            responseTime: dep.timeout,
                            error: error instanceof Error ? error.message : String(error),
                        };
                    }
                })
            );

            const healthStatus = results.map((result, index) => {
                if (result.status === 'fulfilled') {
                    return result.value;
                } else {
                    return {
                        name: dependencies[index].name,
                        healthy: false,
                        required: dependencies[index].required,
                        responseTime: 0,
                        error: result.reason?.message || String(result.reason),
                    };
                }
            });

            const requiredDepsHealthy = healthStatus
                .filter(dep => dep.required)
                .every(dep => dep.healthy);

            healthStatus.forEach(dep => {
                if (dep.healthy) {
                    logger.info(`✅ ${dep.name}: Connected (${dep.responseTime}ms)`);
                } else {
                    const logLevel = dep.required ? 'error' : 'warn';
                    const emoji = dep.required ? '❌' : '⚠️';
                    logger[logLevel](`${emoji} ${dep.name}: ${dep.error || 'Not available'}`);
                }
            });

            if (requiredDepsHealthy) {
                logger.info('✅ All required dependencies are ready');
                break;
            }

            if (attempt >= maxRetries) {
                const failedDeps = healthStatus
                    .filter(dep => dep.required && !dep.healthy)
                    .map(dep => `${dep.name}: ${dep.error}`)
                    .join(', ');

                throw new Error(`Failed to connect to required dependencies after ${maxRetries} attempts: ${failedDeps}`);
            }

            logger.info(`⏳ Waiting ${retryInterval}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
    }

    private async startHttpServer(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                this.server = this.app.listen(config.server.port, config.server.host, () => {
                    logger.info(`🚀 HTTP server started successfully`, {
                        port: config.server.port,
                        host: config.server.host,
                        nodeEnv: config.server.nodeEnv,
                        processId: process.pid,
                        dependencies: {
                            database: `${config.database.host}:${config.database.port}/${config.database.database}`,
                            cartGrpc: `${config.grpc.cartService.host}:${config.grpc.cartService.port}`,
                            inventoryGrpc: `${config.grpc.inventoryService.host}:${config.grpc.inventoryService.port}`,
                        },
                    });
                    resolve();
                });

                this.server.on('error', (error: any) => {
                    logger.error('HTTP server error', error);
                    reject(error);
                });

                // Configure server timeouts
                this.server.timeout = 30000;
                this.server.keepAliveTimeout = 5000;
                this.server.headersTimeout = 6000;

            } catch (error) {
                logger.error('Failed to start HTTP server', error);
                reject(error);
            }
        });
    }

    private async checkDatabaseHealth(): Promise<boolean> {
        try {
            return await database.testConnection();
        } catch (error) {
            logger.debug('Database health check failed', error);
            return false;
        }
    }

    private async checkCartGrpcHealth(): Promise<boolean> {
        try {
            return cartClient.isHealthy();
        } catch (error) {
            logger.debug('Cart gRPC health check failed', error);
            return false;
        }
    }

    private async checkInventoryGrpcHealth(): Promise<boolean> {
        try {
            // Test a simple call
            await inventoryClient.checkInventoryBatch([]);
            return true;
        } catch (error) {
            logger.debug('Inventory gRPC health check failed', error);
            return false;
        }
    }

    private async checkProductGrpcHealth(): Promise<boolean> {
        try {
            return productClient.isHealthy();
        } catch (error) {
            logger.debug('Product gRPC health check failed', error);
            return false;
        }
    }

    private startHealthMonitoring(): void {
        const interval = 60000; // Check every minute

        this.healthCheckInterval = setInterval(async () => {
            try {
                const healthStatus = await this.getHealthStatus();
                if (healthStatus.status !== 'healthy') {
                    logger.warn('🩺 Health check warning', {
                        status: healthStatus.status,
                        unhealthyDependencies: healthStatus.dependencies
                            .filter(dep => dep.status !== 'healthy')
                            .map(dep => dep.name),
                    });
                }
            } catch (error) {
                logger.error('❌ Health monitoring error', error);
            }
        }, interval);

        logger.info('🩺 Health monitoring started', { interval: `${interval}ms` });
    }

    private async getHealthStatus(): Promise<{
        status: 'healthy' | 'unhealthy';
        timestamp: string;
        service: string;
        version: string;
        uptime: number;
        dependencies: any[];
    }> {
        const timestamp = new Date().toISOString();
        const uptime = process.uptime();

        try {
            const dependencyChecks = await Promise.allSettled([
                this.checkDependencyWithTimeout('Database', this.checkDatabaseHealth()),
                this.checkDependencyWithTimeout('Cart gRPC', this.checkCartGrpcHealth()),
                this.checkDependencyWithTimeout('Inventory gRPC', this.checkInventoryGrpcHealth()),
                this.checkDependencyWithTimeout('Product gRPC', this.checkProductGrpcHealth()),
            ]);

            const dependencies = dependencyChecks.map((result, index) => {
                const names = ['Database', 'Cart gRPC', 'Inventory gRPC'];
                if (result.status === 'fulfilled') {
                    return result.value;
                } else {
                    return {
                        name: names[index],
                        status: 'unhealthy',
                        responseTime: 0,
                        error: result.reason?.message || 'Unknown error',
                    };
                }
            });

            const allHealthy = dependencies.every(dep => dep.status === 'healthy');

            return {
                status: allHealthy ? 'healthy' : 'unhealthy',
                timestamp,
                service: 'order-service',
                version: '1.0.0',
                uptime,
                dependencies,
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp,
                service: 'order-service',
                version: '1.0.0',
                uptime,
                dependencies: [],
            };
        }
    }

    private async checkDependencyWithTimeout(name: string, healthCheck: Promise<boolean>): Promise<{
        name: string;
        status: 'healthy' | 'unhealthy';
        responseTime: number;
        error?: string;
    }> {
        const startTime = Date.now();
        const timeout = 5000;

        try {
            const result = await Promise.race([
                healthCheck,
                new Promise<boolean>((_, reject) =>
                    setTimeout(() => reject(new Error('Health check timeout')), timeout)
                )
            ]);

            const responseTime = Date.now() - startTime;

            return {
                name,
                status: result ? 'healthy' : 'unhealthy',
                responseTime,
                error: result ? undefined : 'Health check failed',
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                name,
                status: 'unhealthy',
                responseTime,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    private async getReadinessStatus(): Promise<{
        ready: boolean;
        timestamp: string;
        checks: any[];
    }> {
        const timestamp = new Date().toISOString();

        const checks = await Promise.allSettled([
            { name: 'Database', check: this.checkDatabaseHealth() },
            { name: 'Cart gRPC', check: this.checkCartGrpcHealth() },
            { name: 'Inventory gRPC', check: this.checkInventoryGrpcHealth() },
        ].map(async ({ name, check }) => {
            try {
                const result = await Promise.race([
                    check,
                    new Promise<boolean>((_, reject) =>
                        setTimeout(() => reject(new Error('Readiness check timeout')), 5000)
                    )
                ]);
                return { name, ready: result, error: null };
            } catch (error) {
                return {
                    name,
                    ready: false,
                    error: error instanceof Error ? error.message : String(error)
                };
            }
        }));

        const checkResults = checks.map(check =>
            check.status === 'fulfilled' ? check.value : { name: 'unknown', ready: false, error: 'Promise rejected' }
        );

        const allReady = checkResults.every(check => check.ready);

        return {
            ready: allReady,
            timestamp,
            checks: checkResults,
        };
    }

    private setupGracefulShutdown(): void {
        let isShuttingDown = false;

        const shutdown = async (signal: string, exitCode: number = 0) => {
            if (isShuttingDown) {
                logger.warn(`${signal} received but shutdown already in progress`);
                return;
            }

            isShuttingDown = true;
            this.isShuttingDown = true;

            logger.info(`🛑 ${signal} received, starting graceful shutdown...`);

            const shutdownTimeout = setTimeout(() => {
                logger.error('⏰ Graceful shutdown timeout exceeded, forcing exit');
                process.exit(1);
            }, 30000);

            try {
                // Close HTTP server
                if (this.server) {
                    await new Promise<void>((resolve) => {
                        this.server.close((err: any) => {
                            if (err) {
                                logger.error('❌ Error closing HTTP server', err);
                            } else {
                                logger.info('✅ HTTP server closed');
                            }
                            resolve();
                        });
                    });
                }

                // Stop health monitoring
                if (this.healthCheckInterval) {
                    clearInterval(this.healthCheckInterval);
                    this.healthCheckInterval = null;
                    logger.info('✅ Health monitoring stopped');
                }

                // Close gRPC clients
                logger.info('🔌 Closing gRPC clients...');
                try {
                    await Promise.race([
                        Promise.all([
                            new Promise<void>((resolve) => {
                                cartClient.close();
                                resolve();
                            }),
                            new Promise<void>((resolve) => {
                                inventoryClient.close();
                                resolve();
                            }),
                        ]),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('gRPC close timeout')), 5000)
                        )
                    ]);
                    logger.info('✅ gRPC clients closed');
                } catch (error) {
                    logger.error('❌ Failed to close gRPC clients', error);
                }

                // Close database connections
                logger.info('🔌 Closing database connections...');
                try {
                    await Promise.race([
                        database.close(),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Database close timeout')), 5000)
                        )
                    ]);
                    logger.info('✅ Database connections closed');
                } catch (error) {
                    logger.error('❌ Failed to close database connections', error);
                }

                await this.cleanup();
                clearTimeout(shutdownTimeout);

                logger.info('✅ Graceful shutdown completed successfully');
                process.exit(exitCode);

            } catch (error) {
                logger.error('❌ Error during graceful shutdown', error);
                clearTimeout(shutdownTimeout);
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM', 0));
        process.on('SIGINT', () => shutdown('SIGINT', 0));
        process.on('SIGQUIT', () => shutdown('SIGQUIT', 0));

        process.on('uncaughtException', (error) => {
            logger.error('💥 Uncaught exception', {
                error: error.message,
                stack: error.stack,
                name: error.name,
            });
            shutdown('UNCAUGHT_EXCEPTION', 1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('💥 Unhandled promise rejection', {
                reason: reason instanceof Error ? reason.message : String(reason),
                stack: reason instanceof Error ? reason.stack : undefined,
                promise: promise.toString(),
            });
            shutdown('UNHANDLED_REJECTION', 1);
        });

        logger.info('🛡️ Graceful shutdown handlers registered');
    }

    private async cleanup(): Promise<void> {
        try {
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = null;
            }
            logger.info('🧹 Cleanup completed');
        } catch (error) {
            logger.error('❌ Error during cleanup', error);
        }
    }

    async stop(): Promise<void> {
        try {
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = null;
            }

            // Close gRPC clients
            cartClient.close();
            inventoryClient.close();
            productClient.close();

            // Close database
            await database.close();

            logger.info('Order service stopped gracefully');
        } catch (error) {
            logger.error('Error during server shutdown', { error });
        }
    }
}

// Start the server
const orderServer = new OrderServer();

// Signal handlers
process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    await orderServer.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await orderServer.stop();
    process.exit(0);
});

// Start server
orderServer.start().catch((error) => {
    logger.error('💥 Failed to start order service:', error);
    process.exit(1);
});