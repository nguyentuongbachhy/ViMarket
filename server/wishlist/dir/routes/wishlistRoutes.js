"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wishlistController_1 = require("../controllers/wishlistController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.post('/', wishlistController_1.wishlistController.addToWishlist);
router.get('/', wishlistController_1.wishlistController.getUserWishlist);
router.delete('/:productId', wishlistController_1.wishlistController.removeFromWishlist);
router.delete('/', wishlistController_1.wishlistController.clearWishlist);
router.get('/count', wishlistController_1.wishlistController.getWishlistCount);
router.get('/check/:productId', wishlistController_1.wishlistController.checkWishlistStatus);
router.get('/with-prices', wishlistController_1.wishlistController.getWishlistWithPrices);
router.get('/analytics/most-wishlisted', wishlistController_1.wishlistController.getMostWishlistedProducts);
router.get('/analytics/stats', wishlistController_1.wishlistController.getWishlistStats);
exports.default = router;
//# sourceMappingURL=wishlistRoutes.js.map