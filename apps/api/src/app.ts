import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes.js';
import { addressRouter } from './routes/address.routes.js';
import { measurementRouter } from './routes/measurement.routes.js';
import { orderRouter } from './routes/order.routes.js';
import { franchiseRouter } from './routes/franchise.routes.js';
import { pricingRouter } from './routes/pricing.routes.js';
import { cronRouter } from './routes/cron.routes.js';
import { healthRouter } from './routes/health.router.js';
import { reviewRouter } from './routes/review.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authLimiter, apiLimiter, corsOptions } from './middleware/security.middleware.js';

export const app = express();

// 1. Security HTTP Headers (Clickjacking, MIME-sniffing, XSS protection)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// 2. Strict CORS Whitelist
app.use(cors(corsOptions));

// 3. General API rate limiter
app.use('/api', apiLimiter);

// 4. Request Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check routes
app.use('/health', healthRouter);
app.use('/api/health', healthRouter);

// Main API routes (with dedicated auth brute-force limiter)
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/addresses', addressRouter);
app.use('/api/measurements', measurementRouter);
app.use('/api/orders', orderRouter);
app.use('/api/franchise', franchiseRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/cron', cronRouter);
app.use('/api/reviews', reviewRouter);

// Direct route aliases (without /api prefix)
app.use('/auth', authLimiter, authRouter);
app.use('/addresses', addressRouter);
app.use('/measurements', measurementRouter);
app.use('/orders', orderRouter);
app.use('/franchise', franchiseRouter);
app.use('/pricing', pricingRouter);
app.use('/cron', cronRouter);
app.use('/reviews', reviewRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler (must be last)
app.use(errorHandler);
