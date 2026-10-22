import { Router } from 'express';
import { healthController } from '../controller/index.js';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  void healthController.check(req, res);
});
