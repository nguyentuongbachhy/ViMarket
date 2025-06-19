"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateToken = void 0;
const config_1 = require("@/config");
const response_1 = require("@/utils/response");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json((0, response_1.createResponse)(false, 'Access token is required'));
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.CONFIG.JWT_SECRET, {
            algorithms: [config_1.CONFIG.JWT_ALGORITHM],
            issuer: config_1.CONFIG.JWT_ISSUER,
            audience: config_1.CONFIG.JWT_AUDIENCE,
        });
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json((0, response_1.createResponse)(false, 'Token has expired'));
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json((0, response_1.createResponse)(false, 'Invalid token'));
            return;
        }
        res.status(500).json((0, response_1.createResponse)(false, 'Authentication error'));
    }
});
exports.authenticateToken = authenticateToken;
const optionalAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.CONFIG.JWT_SECRET, {
                algorithms: [config_1.CONFIG.JWT_ALGORITHM],
                issuer: config_1.CONFIG.JWT_ISSUER,
                audience: config_1.CONFIG.JWT_AUDIENCE,
            });
            req.user = {
                id: decoded.sub,
                email: decoded.email,
                name: decoded.name,
            };
        }
        next();
    }
    catch (error) {
        next();
    }
});
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map