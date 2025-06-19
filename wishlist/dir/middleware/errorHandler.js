"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
const response_1 = require("@/utils/response");
const errorHandler = (error, req, res, next) => {
    logger_1.logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
    });
    const status = error.status || error.statusCode || 500;
    const message = config_1.CONFIG.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message;
    res.status(status).json((0, response_1.createResponse)(false, message));
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map