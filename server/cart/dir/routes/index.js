"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRoutes = void 0;
const response_1 = require("@/utils/response");
const express_1 = require("express");
const cartRoutes_1 = require("./cartRoutes");
const router = (0, express_1.Router)();
exports.apiRoutes = router;
router.use('/cart', cartRoutes_1.cartRoutes);
router.get('/ping', (req, res) => {
    res.status(200).send('pong');
});
router.use('*', (req, res) => {
    response_1.ResponseUtils.notFound(res, `Route ${req.originalUrl} not found`);
});
//# sourceMappingURL=index.js.map