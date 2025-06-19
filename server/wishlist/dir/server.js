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
const errorHandler_1 = require("@/middleware/errorHandler");
const requestLogger_1 = require("@/middleware/requestLogger");
const routes_1 = __importDefault(require("@/routes"));
const kafkaService_1 = require("@/services/kafkaService");
const prismaService_1 = require("@/services/prismaService");
const redisService_1 = require("@/services/redisService");
const logger_1 = require("@/utils/logger");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(requestLogger_1.requestLogger);
app.use('/api/v1', routes_1.default);
app.use(errorHandler_1.errorHandler);
const gracefulShutdown = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.logger.info('Starting graceful shutdown...');
    try {
        yield redisService_1.redisService.disconnect();
        yield prismaService_1.prismaService.disconnect();
        yield kafkaService_1.kafkaService.disconnect();
        logger_1.logger.info('All services disconnected successfully');
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
});
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield redisService_1.redisService.connect();
            yield prismaService_1.prismaService.connect();
            yield kafkaService_1.kafkaService.connect();
            yield kafkaService_1.kafkaService.startConsumer();
            app.listen(config_1.CONFIG.PORT, () => {
                logger_1.logger.info(`Wishlist service running on port ${config_1.CONFIG.PORT}`);
                logger_1.logger.info(`Environment: ${config_1.CONFIG.NODE_ENV}`);
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to start server:', error);
            process.exit(1);
        }
    });
}
startServer();
//# sourceMappingURL=server.js.map