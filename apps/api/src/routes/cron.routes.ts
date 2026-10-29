import { Router } from 'express';
import { cronController } from '../controller/cron.controller.js';

export const cronRouter = Router();

// Cron job status and metrics
cronRouter.get('/failed-payments/status', (req, res) => {
  void cronController.getStatus(req, res);
});

// Run failed payment cron job manually
cronRouter.post('/failed-payments/run', (req, res) => {
  void cronController.runJob(req, res);
});

// Get failed orders
cronRouter.get('/failed-orders', (req, res) => {
  void cronController.getFailedOrders(req, res);
});

// Record payment failure from checkout
cronRouter.post('/record-failure', (req, res) => {
  void cronController.recordPaymentFailure(req, res);
});
