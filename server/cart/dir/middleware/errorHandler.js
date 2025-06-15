"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
const logger_1 = require("@/utils/logger");
const response_1 = require("@/utils/response");
const logger = new logger_1.Logger('ErrorHandler');
class ErrorHandler {
    static handle(error, req, res, next) {
        logger.error('Unhandled error', {
            error: error.message,
            stack: error.stack,
            path: req.path,
            method: req.method,
            body: req.body,
            query: req.query,
            params: req.params,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        const status = error.status || error.statusCode || 500;
        const message = status === 500 && process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message;
        response_1.ResponseUtils.error(res, message, status);
    }
    static notFound(req, res, next) {
        response_1.ResponseUtils.notFound(res, `Route ${req.originalUrl} not found`);
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=errorHandler.js.map