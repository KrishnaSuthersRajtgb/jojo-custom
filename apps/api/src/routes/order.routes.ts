import { Router } from 'express';
import { orderController } from '../controller/index.js';
import { optionalAuth } from '../middleware/index.js';

export const orderRouter = Router();

// Order creation - supports authenticated or guest with username in body/header
orderRouter.post('/', optionalAuth, (req, res) => {
  void orderController.createOrder(req, res);
});

// Admin endpoint to view all orders
orderRouter.get('/all', (_req, res) => {
  void orderController.getAllOrders(_req, res);
});

// User orders
orderRouter.get('/', optionalAuth, (req, res) => {
  void orderController.getUserOrders(req, res);
});

// Single order tracking
orderRouter.get('/:id', (req, res) => {
  void orderController.getOrderById(req, res);
});

// Status updates
orderRouter.patch('/:id/status', (req, res) => {
  void orderController.updateOrderStatus(req, res);
});
