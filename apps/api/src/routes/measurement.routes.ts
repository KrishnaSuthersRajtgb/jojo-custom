import { Router } from 'express';
import { measurementController } from '../controller/index.js';
import { authenticate } from '../middleware/index.js';

export const measurementRouter = Router();

measurementRouter.use(authenticate);

measurementRouter.get('/', (req, res) => {
  void measurementController.getMeasurements(req, res);
});

measurementRouter.put('/', (req, res) => {
  void measurementController.saveMeasurements(req, res);
});

measurementRouter.post('/', (req, res) => {
  void measurementController.saveMeasurements(req, res);
});
