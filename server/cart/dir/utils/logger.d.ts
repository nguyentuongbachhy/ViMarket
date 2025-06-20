export declare class Logger {
    private context;
    constructor(context: string);
    private formatMessage;
    private serializeMeta;
    info(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
}
//# sourceMappingURL=logger.d.ts.map