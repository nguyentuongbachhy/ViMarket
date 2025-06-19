import { ResponseUtils } from '@/utils/response';
import { Router } from 'express';
import { wishlistRoutes } from './wishlistRoutes';

const router: Router = Router();

router.use('/wishlist', wishlistRoutes);

router.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

router.use('*', (req, res) => {
    ResponseUtils.notFound(res, `Route ${req.originalUrl} not found`);
});

export { router as apiRoutes };