import { config } from '@/config';
import { JwtPayload } from '@/types';
import { Logger } from '@/utils/logger';
import { ResponseUtils } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const logger = new Logger('AuthMiddleware')

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string,
        username: string;
        email?: string;
        roles: string[]
    }
}

export class AuthMiddleware {
    static authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
        try {
            const userIdHeader = req.headers['x-user-id'] as string;
            const usernameHeader = req.headers['x-username'] as string;
            const emailHeader = req.headers['x-user-email'] as string;

            if (userIdHeader) {
                req.user = {
                    userId: userIdHeader,
                    username: usernameHeader || 'unknown',
                    email: emailHeader,
                    roles: []
                };

                logger.debug('User authenticated via headers', {
                    userId: userIdHeader,
                    username: usernameHeader,
                    path: req.path
                });

                next();
                return;
            }

            const authHeader = req.headers.authorization

            if (!authHeader) {
                logger.warn('Authorization header missing', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    path: req.path
                })
                ResponseUtils.unauthorized(res, 'Authorization header is required')
                return
            }

            const token = authHeader.substring(7)

            try {
                const decoded = jwt.verify(token, config.jwt.secretKey, {
                    algorithms: [config.jwt.algorithm as jwt.Algorithm],
                    issuer: config.jwt.issuer,
                    audience: config.jwt.audience
                }) as JwtPayload

                const userId = decoded.sub || decoded.nameid
                const username = decoded.unique_name || 'unknown'

                let roles: string[] = []
                if (decoded.role) {
                    if (Array.isArray(decoded.role)) {
                        roles = decoded.role
                    } else {
                        roles = [decoded.role]
                    }
                }

                if (!userId) {
                    logger.warn('Invalid token: missing user ID', {
                        tokenSubject: decoded.sub,
                        tokenNameId: decoded.nameid
                    })
                    ResponseUtils.unauthorized(res, 'Invalid token')
                    return;
                }

                req.user = {
                    userId,
                    username,
                    email: decoded.email,
                    roles
                }

                req.headers['x-user-id'] = userId
                req.headers['x-username'] = username
                if (roles.length > 0) {
                    req.headers['x-user-roles'] = roles.join(',');
                }

                logger.debug('User authenticated successfully', {
                    userId,
                    username,
                    roles,
                    tokenIssuer: decoded.iss,
                    tokenAudience: decoded.aud
                })

                next()
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