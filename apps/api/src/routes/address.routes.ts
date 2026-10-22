import { Router } from 'express';
import { addressController } from '../controller/index.js';
import { authenticate } from '../middleware/index.js';

export const addressRouter = Router();

addressRouter.use(authenticate);

addressRouter.get('/', (req, res) => {
  void addressController.getAddresses(req, res);
});

addressRouter.post('/', (req, res) => {
  void addressController.createAddress(req, res);
});

addressRouter.put('/:id', (req, res) => {
  void addressController.updateAddress(req, res);
});

addressRouter.delete('/:id', (req, res) => {
  void addressController.deleteAddress(req, res);
});

addressRouter.put('/:id/default', (req, res) => {
  void addressController.setDefaultAddress(req, res);
});
