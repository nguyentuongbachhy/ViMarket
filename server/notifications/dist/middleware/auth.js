"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
// src/middleware/auth.ts
const config_1 = require("@/config");
const logger_1 = require("@/utils/logger");
const response_1 = require("@/utils/response");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger = new logger_1.Logger('AuthMiddleware');
class AuthMiddleware {
    static authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                logger.warn('Authorization header missing', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    path: req.path,
                });
                response_1.ResponseUtils.unauthorized(res, 'Authorization header is required');
                return;
            }
            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            try {
                const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secretKey, {
                    algorithms: [config_1.config.jwt.algorithm],
                    issuer: config_1.config.jwt.issuer,
                    audience: config_1.config.jwt.audience,
                });
                const userId = decoded.sub || decoded.nameid;
                const username = decoded.unique_name || 'unknown';
                let roles = [];
                if (decoded.role) {
                    if (Array.isArray(decoded.role)) {
                        roles = decoded.role;
                    }
                    else {
                        roles = [decoded.role];
                    }
                }
                if (!userId) {
                    logger.warn('Invalid token: missing user ID', {
                        tokenSubject: decoded.sub,
                        tokenNameId: decoded.nameid,
                    });
                    response_1.ResponseUtils.unauthorized(res, 'Invalid token');
                    return;
                }
                req.user = {
                    userId,
                    username,
                    email: decoded.email,
                    roles,
                };
                logger.debug('User authenticated successfully', {
                    userId,
                    username,
                    roles,
                });
                next();
            }
            catch (jwtError) {
                if (jwtError instanceof jsonwebtoken_1.default.TokenExpiredError) {
                    logger.warn('Token expired', {
                        expiredAt: jwtError.expiredAt,
                        ip: req.ip,
                    });
                    response_1.ResponseUtils.unauthorized(res, 'Token expired');
                    return;
                }
                if (jwtError instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                    logger.warn('Invalid token', {
                        error: jwtError.message,
                        ip: req.ip,
                    });
                    response_1.ResponseUtils.unauthorized(res, 'Invalid token');
                    return;
                }
                logger.error('JWT verification failed', jwtError);
                response_1.ResponseUtils.unauthorized(res, 'Token verification failed');
                return;
            }
        }
        catch (error) {
            logger.error('Authentication middleware error', error);
            response_1.ResponseUtils.error(res, 'Authentication error', 500);
            return;
        }
    }
}
exports.AuthMiddleware = AuthMiddleware;
//# sourceMappingURL=auth.js.map