"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    constructor(context) {
        this.context = context;
    }
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const formattedMeta = meta ? this.serializeMeta(meta) : undefined;
        const logObject = Object.assign({ timestamp,
            level, context: this.context, message }, (formattedMeta && { meta: formattedMeta }));
        return JSON.stringify(logObject);
    }
    serializeMeta(meta) {
        if (!meta)
            return meta;
        const serialized = {};
        for (const [key, value] of Object.entries(meta)) {
            if (value instanceof Error) {
                serialized[key] = Object.assign({ name: value.name, message: value.message, stack: value.stack }, ('cause' in value ? { cause: value.cause } : {}));
            }
            else if (value && typeof value === 'object') {
                try {
                    serialized[key] = JSON.parse(JSON.stringify(value));
                }
                catch (_a) {
                    serialized[key] = String(value);
                }
            }
            else {
                serialized[key] = value;
            }
        }
        return serialized;
    }
    info(message, meta) {
        console.log(this.formatMessage('INFO', message, meta));
    }
    error(message, meta) {
        console.error(this.formatMessage('ERROR', message, meta));
    }
    warn(message, meta) {
        console.warn(this.formatMessage('WARN', message, meta));
    }
    debug(message, meta) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(this.formatMessage('DEBUG', message, meta));
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map