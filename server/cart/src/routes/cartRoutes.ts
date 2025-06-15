import { CartController } from '@/controllers/cartController';
import { AuthMiddleware } from '@/middleware/auth';
import { Router } from 'express';

const router: Router = Router();

router.use(AuthMiddleware.authenticate);

// Basic cart operations
router.get('/', CartController.getCart);
router.post('/items', CartController.addToCart);
router.put('/items/:productId', CartController.updateCartItem);
router.delete('/items/:productId', CartController.removeFromCart);
router.delete('/', CartController.clearCart);

// Additional cart features
router.get('/count', CartController.getCartItemCount);
router.get('/validate', CartController.validateCart);
router.post('/merge', CartController.mergeGuestCart);

// Checkout preparation
router.post('/checkout/prepare', CartController.prepareCheckout);

export { router as cartRoutes };
