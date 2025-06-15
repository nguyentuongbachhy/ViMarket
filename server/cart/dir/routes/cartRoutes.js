"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRoutes = void 0;
const cartController_1 = require("@/controllers/cartController");
const auth_1 = require("@/middleware/auth");
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.cartRoutes = router;
router.use(auth_1.AuthMiddleware.authenticate);
router.get('/', cartController_1.CartController.getCart);
router.post('/items', cartController_1.CartController.addToCart);
router.put('/items/:productId', cartController_1.CartController.updateCartItem);
router.delete('/items/:productId', cartController_1.CartController.removeFromCart);
router.delete('/', cartController_1.CartController.clearCart);
router.get('/count', cartController_1.CartController.getCartItemCount);
router.get('/validate', cartController_1.CartController.validateCart);
router.post('/merge', cartController_1.CartController.mergeGuestCart);
router.post('/checkout/prepare', cartController_1.CartController.prepareCheckout);
//# sourceMappingURL=cartRoutes.js.map