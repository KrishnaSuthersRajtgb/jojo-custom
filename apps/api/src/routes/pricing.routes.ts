import { Router } from 'express';
import { pricingController } from '../controller/pricing.controller.js';

export const pricingRouter = Router();

// Get active pricing (fabrics & accessories)
pricingRouter.get('/', (req, res) => {
  void pricingController.getPricing(req, res);
});

// Update fabric prices
pricingRouter.put('/fabrics', (req, res) => {
  void pricingController.updateFabricPrices(req, res);
});

// Add new fabric SKU
pricingRouter.post('/fabrics/new', (req, res) => {
  void pricingController.addCustomFabric(req, res);
});

// Update accessories
pricingRouter.put('/accessories', (req, res) => {
  void pricingController.updateAccessories(req, res);
});

// Update garments, sub-divisions and tailoring pricing
pricingRouter.put('/garments', (req, res) => {
  void pricingController.updateGarments(req, res);
});

// Reset pricing to defaults
pricingRouter.post('/reset', (req, res) => {
  void pricingController.resetPricing(req, res);
});
