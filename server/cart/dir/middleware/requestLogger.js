"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLogger = void 0;
const logger_1 = require("@/utils/logger");
const logger = new logger_1.Logger('RequestLogger');
class RequestLogger {
    static log(req, res, next) {
        const startTime = Date.now();
        logger.info('Incoming request', {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            contentType: req.get('Content-Type'),
            contentLength: req.get('Content-Length'),
        });
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            logger.info('Request completed', {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                contentLength: res.get('Content-Length'),
            });
        });
        next();
    }
}
exports.RequestLogger = RequestLogger;
//# sourceMappingURL=requestLogger.js.map