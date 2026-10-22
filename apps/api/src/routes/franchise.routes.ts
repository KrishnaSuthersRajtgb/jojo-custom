import { Router } from 'express';
import { franchiseController } from '../controller/index.js';

export const franchiseRouter = Router();

franchiseRouter.post('/', (req, res) => {
  void franchiseController.submitInquiry(req, res);
});

franchiseRouter.get('/', (_req, res) => {
  void franchiseController.getInquiries(_req, res);
});
