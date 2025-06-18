import { ResponseUtils } from '@/utils/response';
import { Router } from 'express';
import { adminRoutes } from './adminRoutes';
import { orderRoutes } from './orderRoutes';

const router: Router = Router();

router.use('/orders', orderRoutes);
router.use('/orders-admin', adminRoutes);

router.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

router.use('*', (req, res) => {
    ResponseUtils.notFound(res, `Route ${req.originalUrl} not found`);
});

export { router as apiRoutes };
