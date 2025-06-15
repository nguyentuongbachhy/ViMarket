export class Logger {
    private context: string

    constructor(context: string) {
        this.context = context
    }

    private formatMessage(level: string, message: string, meta?: any): string {
        const timestamp = new Date().toISOString()
        const logObject = {
            timestamp,
            level,
            context: this.context,
            message,
            ...(meta && { meta })
        }
        return JSON.stringify(logObject)
    }

    info(message: string, meta?: any): void {
        console.log(this.formatMessage('INFO', message, meta));
    }

    error(message: string, meta?: any): void {
        console.error(this.formatMessage('ERROR', message, meta))
    }

    warn(message: string, meta?: any): void {
        console.warn(this.formatMessage('WARN', message, meta))
    }

    debug(message: string, meta?: any): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug(this.formatMessage('DEBUG', message, meta));
        }
    }
}