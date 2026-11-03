import { Router } from 'express';
import { analyticsController } from '../controller/analytics.controller.js';
import { requireAdmin } from '../middleware/index.js';

export const analyticsRouter = Router();

// GET /api/analytics/sales (admin auth required)
analyticsRouter.get('/sales', requireAdmin, (req, res) => {
  void analyticsController.getSalesStats(req, res);
});
