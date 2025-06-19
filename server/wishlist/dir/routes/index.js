"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wishlistRoutes_1 = __importDefault(require("./wishlistRoutes"));
const router = (0, express_1.Router)();
router.use('/wishlist', wishlistRoutes_1.default);
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'wishlist-service',
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map