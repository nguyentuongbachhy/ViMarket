import { ResponseUtils } from '@/utils/response';
import { Router } from 'express';
import { cartRoutes } from './cartRoutes';

const router: Router = Router();

router.use('/cart', cartRoutes);

router.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

router.use('*', (req, res) => {
    ResponseUtils.notFound(res, `Route ${req.originalUrl} not found`);
});

export { router as apiRoutes };
