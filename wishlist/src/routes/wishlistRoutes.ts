import { WishlistController } from '@/controllers/wishlistController';
import { AuthMiddleware } from '@/middleware/auth';
import { Router } from 'express';

const router: Router = Router();

router.use(AuthMiddleware.authenticate);

// Core CRUD operations
router.post('/', WishlistController.addToWishlist);
router.get('/', WishlistController.getUserWishlist);
router.delete('/:productId', WishlistController.removeFromWishlist);
router.delete('/', WishlistController.clearWishlist);

// Utility endpoints
router.get('/count', WishlistController.getWishlistCount);
router.get('/check/:productId', WishlistController.checkWishlistStatus);

// Analytics endpoints (optional - có thể giữ hoặc xóa)
router.get('/analytics/most-wishlisted', WishlistController.getMostWishlistedProducts);
router.get('/analytics/stats', WishlistController.getWishlistStats);

export { router as wishlistRoutes };
