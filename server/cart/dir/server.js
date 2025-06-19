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
const config_1 = require("@/config");
const cartGrpcServer_1 = require("@/grpc/cartGrpcServer");
const inventoryClient_1 = require("@/grpc/inventoryClient");
const productClient_1 = require("@/grpc/productClient");
const errorHandler_1 = require("@/middleware/errorHandler");
const rateLimiter_1 = require("@/middleware/rateLimiter");
const requestLogger_1 = require("@/middleware/requestLogger");
const routes_1 = require("@/routes");
const redisService_1 = require("@/services/redisService");
const logger_1 = require("@/utils/logger");
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const logger = new logger_1.Logger('CartServer');
class CartServer {
    constructor() {
        this.isShuttingDown = false;
        this.healthCheckInterval = null;
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: config_1.config.security.helmet.contentSecurityPolicy ? {
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
            } : false,
            hsts: config_1.config.security.helmet.hsts ? {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            } : false,
            crossOriginEmbedderPolicy: false,
        }));
        this.app.use((0, cors_1.default)({
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (config_1.config.server.nodeEnv === 'development') {
                    return callback(null, true);
                }
                const allowedOrigins = config_1.config.security.corsOrigins;
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
                'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-Request-ID',
            ],
        }));
        this.app.use((0, compression_1.default)({
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression_1.default.filter(req, res);
            },
            level: 6,
            threshold: 1024,
        }));
        this.app.use(express_1.default.json({ limit: '10mb', strict: true }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb', parameterLimit: 1000 }));
        this.app.use((req, res, next) => {
            const requestId = req.headers['x-request-id'] ||
                `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            req.headers['x-request-id'] = requestId;
            res.setHeader('X-Request-ID', requestId);
            next();
        });
        if (config_1.config.logging.enableRequestLogging) {
            this.app.use(requestLogger_1.RequestLogger.log);
        }
        this.app.use('/api', rateLimiter_1.RateLimiter.createGeneralRateLimiter().middleware());
        this.app.use('/api/v1/cart', rateLimiter_1.RateLimiter.createCartRateLimiter().middleware());
        if (config_1.config.security.trustProxy) {
            this.app.set('trust proxy', 1);
        }
        this.app.disable('x-powered-by');
    }
    setupRoutes() {
        this.app.use('/api/v1', routes_1.apiRoutes);
        this.app.get('/health', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const healthStatus = yield this.getHealthStatus();
                const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
                res.status(statusCode).json(healthStatus);
            }
            catch (error) {
                logger.error('Health check endpoint failed', error);
                res.status(503).json({
                    status: 'unhealthy',
                    error: 'Health check failed',
                    timestamp: new Date().toISOString(),
                });
            }
        }));
        this.app.get('/ready', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const readinessStatus = yield this.getReadinessStatus();
                const statusCode = readinessStatus.ready ? 200 : 503;
                res.status(statusCode).json(readinessStatus);
            }
            catch (error) {
                logger.error('Readiness check endpoint failed', error);
                res.status(503).json({
                    ready: false,
                    error: 'Readiness check failed',
                    timestamp: new Date().toISOString(),
                });
            }
        }));
        this.app.get('/live', (req, res) => {
            res.status(200).json({
                status: 'alive',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                pid: process.pid,
            });
        });
        this.app.get('/', (req, res) => {
            res.json({
                service: 'cart-service',
                status: 'running',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                environment: config_1.config.server.nodeEnv,
                uptime: process.uptime(),
                endpoints: {
                    health: '/health',
                    ready: '/ready',
                    live: '/live',
                    api: '/api/v1',
                },
                features: {
                    cart_management: true,
                    pricing_calculation: true,
                    inventory_validation: true,
                    guest_cart_merge: true,
                },
            });
        });
        this.app.use(errorHandler_1.ErrorHandler.notFound);
    }
    setupErrorHandling() {
        this.app.use(errorHandler_1.ErrorHandler.handle);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger.info('🚀 Starting Cart Service...');
                yield this.waitForDependencies();
                yield this.startHttpServer();
                this.setupGracefulShutdown();
                if (config_1.config.healthCheck.enabled) {
                    this.startHealthMonitoring();
                }
                logger.info('✅ Cart service started successfully');
            }
            catch (error) {
                logger.error('❌ Failed to start cart service', error);
                yield this.cleanup();
                process.exit(1);
            }
        });
    }
    waitForDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info('⏳ Waiting for dependencies to be ready...');
            const maxRetries = 30;
            const retryInterval = 2000;
            let attempt = 0;
            const dependencies = [
                {
                    name: 'Redis',
                    check: () => this.checkRedisHealth(),
                    required: true,
                    timeout: 5000,
                },
                {
                    name: 'Product gRPC Service',
                    check: () => this.checkProductGrpcHealth(),
                    required: true,
                    timeout: 10000,
                },
                {
                    name: 'Inventory gRPC Service',
                    check: () => this.checkInventoryGrpcHealth(),
                    required: true,
                    timeout: 10000,
                },
            ];
            while (attempt < maxRetries) {
                attempt++;
                logger.info(`🔍 Dependency check attempt ${attempt}/${maxRetries}`);
                const results = yield Promise.allSettled(dependencies.map((dep) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const startTime = Date.now();
                        const isHealthy = yield Promise.race([
                            dep.check(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), dep.timeout))
                        ]);
                        const responseTime = Date.now() - startTime;
                        return {
                            name: dep.name,
                            healthy: isHealthy,
                            required: dep.required,
                            responseTime,
                            error: null,
                        };
                    }
                    catch (error) {
                        return {
                            name: dep.name,
                            healthy: false,
                            required: dep.required,
                            responseTime: dep.timeout,
                            error: error instanceof Error ? error.message : String(error),
                        };
                    }
                })));
                const healthStatus = results.map((result, index) => {
                    var _a;
                    if (result.status === 'fulfilled') {
                        return result.value;
                    }
                    else {
                        return {
                            name: dependencies[index].name,
                            healthy: false,
                            required: dependencies[index].required,
                            responseTime: 0,
                            error: ((_a = result.reason) === null || _a === void 0 ? void 0 : _a.message) || String(result.reason),
                        };
                    }
                });
                const requiredDepsHealthy = healthStatus
                    .filter(dep => dep.required)
                    .every(dep => dep.healthy);
                healthStatus.forEach(dep => {
                    if (dep.healthy) {
                        logger.info(`✅ ${dep.name}: Connected (${dep.responseTime}ms)`);
                    }
                    else {
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
                yield new Promise(resolve => setTimeout(resolve, retryInterval));
            }
        });
    }
    startHttpServer() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    this.server = this.app.listen(config_1.config.server.port, config_1.config.server.host, () => {
                        logger.info(`🚀 HTTP server started successfully`, {
                            port: config_1.config.server.port,
                            host: config_1.config.server.host,
                            nodeEnv: config_1.config.server.nodeEnv,
                            processId: process.pid,
                            dependencies: {
                                redis: `${config_1.config.redis.host}:${config_1.config.redis.port}`,
                                productGrpc: `${config_1.config.grpc.productService.host}:${config_1.config.grpc.productService.port}`,
                                inventoryGrpc: `${config_1.config.grpc.inventoryService.host}:${config_1.config.grpc.inventoryService.port}`,
                            },
                        });
                        resolve();
                    });
                    this.server.on('error', (error) => {
                        logger.error('HTTP server error', error);
                        reject(error);
                    });
                    this.server.timeout = 30000;
                    this.server.keepAliveTimeout = 5000;
                    this.server.headersTimeout = 6000;
                }
                catch (error) {
                    logger.error('Failed to start HTTP server', error);
                    reject(error);
                }
            });
        });
    }
    checkRedisHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield redisService_1.redisService.isHealthy();
            }
            catch (error) {
                return false;
            }
        });
    }
    checkProductGrpcHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield productClient_1.productGrpcClient.getProductsBatch([]);
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
    checkInventoryGrpcHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield inventoryClient_1.inventoryGrpcClient.checkInventoryBatch([]);
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const healthStatus = yield this.getHealthStatus();
                if (healthStatus.status !== 'healthy') {
                    logger.warn('🩺 Health check warning', {
                        status: healthStatus.status,
                        unhealthyDependencies: healthStatus.dependencies
                            .filter(dep => dep.status !== 'healthy')
                            .map(dep => dep.name),
                    });
                }
            }
            catch (error) {
                logger.error('❌ Health monitoring error', error);
            }
        }), config_1.config.healthCheck.interval);
        logger.info('🩺 Health monitoring started', {
            interval: `${config_1.config.healthCheck.interval}ms`,
        });
    }
    getHealthStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = new Date().toISOString();
            const uptime = process.uptime();
            try {
                const dependencyChecks = yield Promise.allSettled([
                    this.checkDependencyWithTimeout('Redis', this.checkRedisHealth()),
                    this.checkDependencyWithTimeout('Product gRPC', this.checkProductGrpcHealth()),
                    this.checkDependencyWithTimeout('Inventory gRPC', this.checkInventoryGrpcHealth()),
                ]);
                const dependencies = dependencyChecks.map((result, index) => {
                    var _a;
                    const names = ['Redis', 'Product gRPC', 'Inventory gRPC'];
                    if (result.status === 'fulfilled') {
                        return result.value;
                    }
                    else {
                        return {
                            name: names[index],
                            status: 'unhealthy',
                            responseTime: 0,
                            error: ((_a = result.reason) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error',
                        };
                    }
                });
                const allHealthy = dependencies.every(dep => dep.status === 'healthy');
                return {
                    status: allHealthy ? 'healthy' : 'unhealthy',
                    timestamp,
                    service: 'cart-service',
                    version: '1.0.0',
                    uptime,
                    dependencies,
                };
            }
            catch (error) {
                return {
                    status: 'unhealthy',
                    timestamp,
                    service: 'cart-service',
                    version: '1.0.0',
                    uptime,
                    dependencies: [],
                };
            }
        });
    }
    checkDependencyWithTimeout(name, healthCheck) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const result = yield Promise.race([
                    healthCheck,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), config_1.config.healthCheck.timeout))
                ]);
                const responseTime = Date.now() - startTime;
                return {
                    name,
                    status: result ? 'healthy' : 'unhealthy',
                    responseTime,
                    error: result ? undefined : 'Health check failed',
                };
            }
            catch (error) {
                const responseTime = Date.now() - startTime;
                return {
                    name,
                    status: 'unhealthy',
                    responseTime,
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        });
    }
    getReadinessStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = new Date().toISOString();
            const checks = yield Promise.allSettled([
                { name: 'Redis', check: this.checkRedisHealth() },
                { name: 'Product gRPC', check: this.checkProductGrpcHealth() },
                { name: 'Inventory gRPC', check: this.checkInventoryGrpcHealth() },
            ].map(({ name, check }) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const result = yield Promise.race([
                        check,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Readiness check timeout')), config_1.config.healthCheck.timeout))
                    ]);
                    return { name, ready: result, error: null };
                }
                catch (error) {
                    return {
                        name,
                        ready: false,
                        error: error instanceof Error ? error.message : String(error)
                    };
                }
            })));
            const checkResults = checks.map(check => check.status === 'fulfilled' ? check.value : { name: 'unknown', ready: false, error: 'Promise rejected' });
            const allReady = checkResults.every(check => check.ready);
            return {
                ready: allReady,
                timestamp,
                checks: checkResults,
            };
        });
    }
    setupGracefulShutdown() {
        let isShuttingDown = false;
        const shutdown = (signal, exitCode = 0) => __awaiter(this, void 0, void 0, function* () {
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
                if (this.server) {
                    yield new Promise((resolve) => {
                        this.server.close((err) => {
                            if (err) {
                                logger.error('❌ Error closing HTTP server', err);
                            }
                            else {
                                logger.info('✅ HTTP server closed');
                            }
                            resolve();
                        });
                    });
                }
                if (this.healthCheckInterval) {
                    clearInterval(this.healthCheckInterval);
                    this.healthCheckInterval = null;
                    logger.info('✅ Health monitoring stopped');
                }
                logger.info('🔌 Closing gRPC clients...');
                try {
                    yield Promise.race([
                        Promise.all([
                            new Promise((resolve) => {
                                productClient_1.productGrpcClient.close();
                                resolve();
                            }),
                            new Promise((resolve) => {
                                inventoryClient_1.inventoryGrpcClient.close();
                                resolve();
                            }),
                        ]),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('gRPC close timeout')), 5000))
                    ]);
                    logger.info('✅ gRPC clients closed');
                }
                catch (error) {
                    logger.error('❌ Failed to close gRPC clients', error);
                }
                yield cartGrpcServer_1.cartGrpcServer.stop();
                logger.info('🔌 Disconnecting from Redis...');
                try {
                    yield Promise.race([
                        redisService_1.redisService.disconnect(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis disconnect timeout')), 5000))
                    ]);
                    logger.info('✅ Redis disconnected');
                }
                catch (error) {
                    logger.error('❌ Failed to disconnect from Redis', error);
                }
                yield this.cleanup();
                clearTimeout(shutdownTimeout);
                logger.info('✅ Graceful shutdown completed successfully');
                process.exit(exitCode);
            }
            catch (error) {
                logger.error('❌ Error during graceful shutdown', error);
                clearTimeout(shutdownTimeout);
                process.exit(1);
            }
        });
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
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.healthCheckInterval) {
                    clearInterval(this.healthCheckInterval);
                    this.healthCheckInterval = null;
                }
                logger.info('🧹 Cleanup completed');
            }
            catch (error) {
                logger.error('❌ Error during cleanup', error);
            }
        });
    }
}
const cartServer = new CartServer();
cartServer.start().catch((error) => {
    console.error('💥 Failed to start cart service:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map