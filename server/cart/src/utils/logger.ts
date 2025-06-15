export class Logger {
    private context: string

    constructor(context: string) {
        this.context = context
    }

    private formatMessage(level: string, message: string, meta?: any): string {
        const timestamp = new Date().toISOString()

        // Handle error serialization properly
        const formattedMeta = meta ? this.serializeMeta(meta) : undefined

        const logObject = {
            timestamp,
            level,
            context: this.context,
            message,
            ...(formattedMeta && { meta: formattedMeta })
        }
        return JSON.stringify(logObject)
    }

    private serializeMeta(meta: any): any {
        if (!meta) return meta

        const serialized: any = {}

        for (const [key, value] of Object.entries(meta)) {
            if (value instanceof Error) {
                serialized[key] = {
                    name: value.name,
                    message: value.message,
                    stack: value.stack,
                    ...('cause' in value ? { cause: (value as any).cause } : {})
                }
            } else if (value && typeof value === 'object') {
                try {
                    serialized[key] = JSON.parse(JSON.stringify(value))
                } catch {
                    serialized[key] = String(value)
                }
            } else {
                serialized[key] = value
            }
        }

        return serialized
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