import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { addressRouter } from './address.routes.js';
import { measurementRouter } from './measurement.routes.js';
import { orderRouter } from './order.routes.js';
import { franchiseRouter } from './franchise.routes.js';
import { healthRouter } from './health.router.js';
import { reviewRouter } from './review.routes.js';
import { wishlistRouter } from './wishlist.routes.js';
import { referralRouter } from './referral.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/addresses', addressRouter);
apiRouter.use('/measurements', measurementRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/franchise', franchiseRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/wishlist', wishlistRouter);
apiRouter.use('/referral', referralRouter);

export * from './auth.routes.js';
export * from './address.routes.js';
export * from './measurement.routes.js';
export * from './order.routes.js';
export * from './franchise.routes.js';
export * from './health.router.js';
export * from './review.routes.js';
export * from './wishlist.routes.js';
export * from './referral.routes.js';
