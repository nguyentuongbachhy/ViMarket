// src/middleware/auth.ts
import { config } from '@/config';
import { JwtPayload } from '@/types';
import { Logger } from '@/utils/logger';
import { ResponseUtils } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const logger = new Logger('AuthMiddleware');

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        username: string;
        email?: string;
        roles: string[];
    };
}

export class AuthMiddleware {
    static authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                logger.warn('Authorization header missing', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    path: req.path,
                });
                ResponseUtils.unauthorized(res, 'Authorization header is required');
                return;
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix

            try {
                const decoded = jwt.verify(token, config.jwt.secretKey, {
                    algorithms: [config.jwt.algorithm as jwt.Algorithm],
                    issuer: config.jwt.issuer,
                    audience: config.jwt.audience,
                }) as JwtPayload;

                const userId = decoded.sub || decoded.nameid;
                const username = decoded.unique_name || 'unknown';

                let roles: string[] = [];
                if (decoded.role) {
                    if (Array.isArray(decoded.role)) {
                        roles = decoded.role;
                    } else {
                        roles = [decoded.role];
                    }
                }

                if (!userId) {
                    logger.warn('Invalid token: missing user ID', {
                        tokenSubject: decoded.sub,
                        tokenNameId: decoded.nameid,
                    });
                    ResponseUtils.unauthorized(res, 'Invalid token');
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
            } catch (jwtError) {
                if (jwtError instanceof jwt.TokenExpiredError) {
                    logger.warn('Token expired', {
                        expiredAt: jwtError.expiredAt,
                        ip: req.ip,
                    });
                    ResponseUtils.unauthorized(res, 'Token expired');
                    return;
                }

                if (jwtError instanceof jwt.JsonWebTokenError) {
                    logger.warn('Invalid token', {
                        error: jwtError.message,
                        ip: req.ip,
                    });
                    ResponseUtils.unauthorized(res, 'Invalid token');
                    return;
                }

                logger.error('JWT verification failed', jwtError);
                ResponseUtils.unauthorized(res, 'Token verification failed');
                return;
            }
        } catch (error) {
            logger.error('Authentication middleware error', error);
            ResponseUtils.error(res, 'Authentication error', 500);
            return;
        }
    }
}