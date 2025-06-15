import { Logger } from '@/utils/logger';
import { NextFunction, Request, Response } from 'express';

const logger = new Logger('RequestLogger');

export class RequestLogger {
    static log(req: Request, res: Response, next: NextFunction): void {
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