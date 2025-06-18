"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const config_1 = require("@/config");
const winston_1 = __importDefault(require("winston"));
class Logger {
    constructor(context) {
        this.context = context;
        this.logger = winston_1.default.createLogger({
            level: config_1.config.logging.level,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), config_1.config.logging.format === 'json'
                ? winston_1.default.format.json()
                : winston_1.default.format.printf((_a) => {
                    var { timestamp, level, message, context } = _a, meta = __rest(_a, ["timestamp", "level", "message", "context"]);
                    return `${timestamp} [${level.toUpperCase()}] ${context}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                })),
            transports: [
                new winston_1.default.transports.Console({
                    handleExceptions: true,
                    handleRejections: true,
                }),
            ],
        });
    }
    info(message, meta) {
        this.logger.info(message, Object.assign({ context: this.context }, meta));
    }
    error(message, meta) {
        this.logger.error(message, Object.assign({ context: this.context }, meta));
    }
    warn(message, meta) {
        this.logger.warn(message, Object.assign({ context: this.context }, meta));
    }
    debug(message, meta) {
        this.logger.debug(message, Object.assign({ context: this.context }, meta));
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map