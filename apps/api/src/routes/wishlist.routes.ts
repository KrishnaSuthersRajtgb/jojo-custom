import { Router } from 'express';
import { wishlistController } from '../controller/index.js';
import { authenticate } from '../middleware/index.js';

export const wishlistRouter = Router();

wishlistRouter.use(authenticate);

wishlistRouter.get('/', (req, res) => {
  void wishlistController.getWishlist(req, res);
});

wishlistRouter.post('/add', (req, res) => {
  void wishlistController.addItem(req, res);
});

wishlistRouter.delete('/:fabricId', (req, res) => {
  void wishlistController.removeItem(req, res);
});
