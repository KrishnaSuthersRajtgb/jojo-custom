import { Router } from 'express';
import { reviewController } from '../controller/index.js';
import { authenticate, optionalAuth } from '../middleware/index.js';

export const reviewRouter = Router();

reviewRouter.get('/', (req, res) => {
  void reviewController.getReviews(req, res);
});

reviewRouter.get('/admin', (req, res) => {
  void reviewController.getAllAdminReviews(req, res);
});

reviewRouter.get('/user', authenticate, (req, res) => {
  void reviewController.getUserReviews(req, res);
});

reviewRouter.get('/:fabricId', (req, res) => {
  void reviewController.getFabricReviews(req, res);
});

reviewRouter.post('/', optionalAuth, (req, res) => {
  void reviewController.createReview(req, res);
});

reviewRouter.patch('/:id/status', (req, res) => {
  void reviewController.updateStatus(req, res);
});

reviewRouter.delete('/:id', (req, res) => {
  void reviewController.deleteReview(req, res);
});
