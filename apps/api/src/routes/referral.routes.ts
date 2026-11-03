import { Router } from 'express';
import { referralController } from '../controller/index.js';
import { authenticate, optionalAuth } from '../middleware/index.js';

export const referralRouter = Router();

// GET /api/referral/code - get my referral code
referralRouter.get('/code', authenticate, (req, res) => {
  void referralController.getCode(req, res);
});

// POST /api/referral/apply - apply a referral code
referralRouter.post('/apply', optionalAuth, (req, res) => {
  void referralController.applyCode(req, res);
});

// GET /api/referral/stats - get my referral count and credits
referralRouter.get('/stats', authenticate, (req, res) => {
  void referralController.getStats(req, res);
});
