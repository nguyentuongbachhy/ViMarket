import { config } from '@/config';
import winston from 'winston';

export class Logger {
    private logger: winston.Logger;
    private context: string;

    constructor(context: string) {
        this.context = context;
        this.logger = winston.createLogger({
            level: config.logging.level,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                config.logging.format === 'json'
                    ? winston.format.json()
                    : winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                        return `${timestamp} [${level.toUpperCase()}] ${context}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                    })
            ),
            transports: [
                new winston.transports.Console({
                    handleExceptions: true,
                    handleRejections: true,
                }),
            ],
        });
    }

    info(message: string, meta?: any): void {
        this.logger.info(message, { context: this.context, ...meta });
    }

    error(message: string, meta?: any): void {
        this.logger.error(message, { context: this.context, ...meta });
    }

    warn(message: string, meta?: any): void {
        this.logger.warn(message, { context: this.context, ...meta });
    }

    debug(message: string, meta?: any): void {
        this.logger.debug(message, { context: this.context, ...meta });
    }
}