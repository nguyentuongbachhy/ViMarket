import { Logger } from '@/utils/logger';
import { ResponseUtils } from '@/utils/response';
import { NextFunction, Request, Response } from 'express';

const logger = new Logger('ErrorHandler');

export interface ErrorWithStatus extends Error {
    status?: number;
    statusCode?: number;
}

export class ErrorHandler {
    static handle(
        error: ErrorWithStatus,
        req: Request,
        res: Response,
        next: NextFunction
    ): void {
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

        // Kiểm tra nếu response đã được gửi
        if (res.headersSent) {
            logger.warn('Error occurred after headers sent, delegating to default Express error handler');
            return next(error);
        }

        const status = error.status || error.statusCode || 500;

        const message = status === 500 && process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error.message;

        ResponseUtils.error(res, message, status);
    }

    static notFound(req: Request, res: Response, next: NextFunction): void {
        if (res.headersSent) {
            return next();
        }
        ResponseUtils.notFound(res, `Route ${req.originalUrl} not found`);
    }
}