"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashUtils = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
class HashUtils {
    static hashUserId(userId) {
        let hash = userId;
        for (let i = 0; i < this.HASH_ROUNDS; i++) {
            hash = crypto_js_1.default.SHA256(hash).toString(crypto_js_1.default.enc.Hex);
        }
        return `cart:${hash.substring(0, 16)}`;
    }
    static generateSessionKey(userId, timestamp) {
        const combined = `${userId}:${timestamp}`;
        return crypto_js_1.default.HmacSHA256(combined, 'cart-session-secret').toString(crypto_js_1.default.enc.Hex);
    }
    static createDistributedKey(userId) {
        const hash = this.hashUserId(userId);
        const bucket = parseInt(hash.slice(-2), 16) % 10;
        return `${hash}:bucket${bucket}`;
    }
}
exports.HashUtils = HashUtils;
HashUtils.HASH_ROUNDS = 5;
//# sourceMappingURL=hash.js.map