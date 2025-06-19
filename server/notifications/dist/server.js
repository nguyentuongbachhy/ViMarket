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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const config_1 = require("@/config");
const routes_1 = require("@/routes");
const firebaseService_1 = require("@/services/firebaseService");
const kafkaService_1 = require("@/services/kafkaService");
const redisService_1 = require("@/services/redisService");
const logger_1 = require("@/utils/logger");
const response_1 = require("@/utils/response");
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const logger = new logger_1.Logger('NotificationServer');
class NotificationServer {
    constructor() {
        this.isShuttingDown = false;
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
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
        this.app.use((0, cors_1.default)({
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (config_1.config.server.nodeEnv === 'development') {
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
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
    setupRoutes() {
        this.app.use('/api/v1', routes_1.apiRoutes);
        this.app.get('/', (req, res) => {
            res.json({
                service: 'notification-service',
                status: 'running',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                environment: config_1.config.server.nodeEnv,
            });
        });
        this.app.get('/health', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.isShuttingDown) {
                    return res.status(503).json({
                        status: 'SHUTTING_DOWN',
                        timestamp: new Date().toISOString(),
                    });
                }
                const healthChecks = yield Promise.allSettled([
                    this.checkRedisHealth(),
                    this.checkKafkaHealth(),
                    this.checkFirebaseHealth(),
                ]);
                const health = {
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    service: 'notification-service',
                    version: '1.0.0',
                    environment: config_1.config.server.nodeEnv,
                    dependencies: {
                        redis: healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : 'error',
                        kafka: healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : 'error',
                        firebase: healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : 'error',
                    },
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                };
                const hasFailures = Object.values(health.dependencies).some(status => status === 'disconnected' || status === 'error');
                res.status(hasFailures ? 503 : 200).json(health);
            }
            catch (error) {
                logger.error('Health check failed', error);
                res.status(503).json({
                    status: 'ERROR',
                    timestamp: new Date().toISOString(),
                    service: 'notification-service',
                    error: 'Health check failed',
                });
            }
        }));
        // Ready check for Kubernetes
        this.app.get('/ready', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const isReady = yield this.checkReadiness();
                res.status(isReady ? 200 : 503).json({
                    status: isReady ? 'READY' : 'NOT_READY',
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                res.status(503).json({
                    status: 'NOT_READY',
                    timestamp: new Date().toISOString(),
                    error: 'Readiness check failed',
                });
            }
        }));
        this.app.use('*', (req, res) => {
            response_1.ResponseUtils.notFound(res, `Route ${req.originalUrl} not found`);
        });
    }
    checkReadiness() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if all critical services are connected
                const [redisHealthy, kafkaHealthy] = yield Promise.all([
                    redisService_1.redisService.isHealthy(),
                    kafkaService_1.kafkaService.isHealthy(),
                ]);
                return redisHealthy && kafkaHealthy;
            }
            catch (_a) {
                return false;
            }
        });
    }
    checkRedisHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const start = Date.now();
                const isHealthy = yield redisService_1.redisService.isHealthy();
                const duration = Date.now() - start;
                logger.debug('Redis health check completed', { isHealthy, duration });
                return isHealthy ? 'connected' : 'disconnected';
            }
            catch (error) {
                logger.warn('Redis health check error', error);
                return 'error';
            }
        });
    }
    checkKafkaHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const start = Date.now();
                const isHealthy = yield kafkaService_1.kafkaService.isHealthy();
                const duration = Date.now() - start;
                logger.debug('Kafka health check completed', { isHealthy, duration });
                return isHealthy ? 'connected' : 'disconnected';
            }
            catch (error) {
                logger.warn('Kafka health check error', error);
                return 'error';
            }
        });
    }
    checkFirebaseHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const start = Date.now();
                const isHealthy = yield firebaseService_1.firebaseService.isHealthy();
                const duration = Date.now() - start;
                logger.debug('Firebase health check completed', { isHealthy, duration });
                return isHealthy ? 'connected' : 'disconnected';
            }
            catch (error) {
                logger.warn('Firebase health check error', error);
                return 'error';
            }
        });
    }
    setupErrorHandling() {
        this.app.use((error, req, res, next) => {
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
            const message = status === 500 && config_1.config.server.nodeEnv === 'production'
                ? 'Internal server error'
                : error.message;
            response_1.ResponseUtils.error(res, message, status);
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger.info('🚀 Starting Notification Service...', {
                    version: '1.0.0',
                    nodeEnv: config_1.config.server.nodeEnv,
                    port: config_1.config.server.port,
                });
                // Wait for dependencies with detailed progress
                yield this.waitForDependencies();
                // Start HTTP server
                this.server = this.app.listen(config_1.config.server.port, config_1.config.server.host, () => {
                    logger.info('✅ HTTP server started successfully', {
                        port: config_1.config.server.port,
                        host: config_1.config.server.host,
                    });
                });
                // Start Kafka consumer after HTTP server is ready
                logger.info('🔄 Starting Kafka consumer...');
                yield kafkaService_1.kafkaService.startConsumer();
                logger.info('✅ Kafka consumer started successfully');
                this.setupGracefulShutdown();
                logger.info('🎉 Notification service fully started and ready', {
                    port: config_1.config.server.port,
                    nodeEnv: config_1.config.server.nodeEnv,
                    kafkaBrokers: config_1.config.kafka.brokers,
                    redisHost: config_1.config.redis.host,
                    processes: {
                        pid: process.pid,
                        platform: process.platform,
                        nodeVersion: process.version,
                    },
                });
            }
            catch (error) {
                logger.error('❌ Failed to start notification service', {
                    error: error instanceof Error ? {
                        message: error.message,
                        stack: error.stack,
                    } : error,
                });
                process.exit(1);
            }
        });
    }
    waitForDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('⏳ Waiting for dependencies...');
            // Connect to Redis first (usually faster)
            yield this.connectWithRetry('Redis', () => redisService_1.redisService.connect(), 15, // Max retries
            2000 // Retry delay
            );
            // Connect to Kafka (may take longer)
            yield this.connectWithRetry('Kafka', () => kafkaService_1.kafkaService.connect(), 30, // Max retries
            3000 // Retry delay
            );
            logger.info('✅ All dependencies ready');
        });
    }
    connectWithRetry(serviceName_1, connectFn_1) {
        return __awaiter(this, arguments, void 0, function* (serviceName, connectFn, maxRetries = 30, retryDelay = 2000) {
            let retries = 0;
            let lastError;
            while (retries < maxRetries) {
                try {
                    logger.info(`🔄 Connecting to ${serviceName}...`, {
                        attempt: retries + 1,
                        maxRetries,
                    });
                    yield connectFn();
                    logger.info(`✅ ${serviceName} connected successfully`);
                    return;
                }
                catch (error) {
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
                    yield new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
            throw new Error(`${serviceName} connection timeout after ${maxRetries} attempts. Last error: ${lastError === null || lastError === void 0 ? void 0 : lastError.message}`);
        });
    }
    setupGracefulShutdown() {
        const shutdown = (signal) => __awaiter(this, void 0, void 0, function* () {
            if (this.isShuttingDown) {
                logger.warn('🛑 Shutdown already in progress, forcing exit...');
                process.exit(1);
            }
            this.isShuttingDown = true;
            logger.info(`🛑 ${signal} received, starting graceful shutdown...`);
            // Stop accepting new connections
            if (this.server) {
                this.server.close(() => __awaiter(this, void 0, void 0, function* () {
                    logger.info('✅ HTTP server closed');
                    try {
                        // Disconnect from services
                        logger.info('🔄 Disconnecting from services...');
                        yield Promise.allSettled([
                            redisService_1.redisService.disconnect(),
                            kafkaService_1.kafkaService.disconnect(),
                        ]);
                        logger.info('✅ All services disconnected');
                        logger.info('✅ Graceful shutdown completed');
                        process.exit(0);
                    }
                    catch (error) {
                        logger.error('❌ Error during graceful shutdown', error);
                        process.exit(1);
                    }
                }));
            }
            else {
                process.exit(0);
            }
        });
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
//# sourceMappingURL=server.js.map