import { Router } from 'express';
import { corporateInquiryController } from '../controller/corporateInquiry.controller.js';

export const corporateInquiryRouter = Router();

// Public: Submit corporate inquiry
corporateInquiryRouter.post('/', (req, res) => {
  void corporateInquiryController.createInquiry(req, res);
});

// Admin: Get all inquiries
corporateInquiryRouter.get('/', (req, res) => {
  void corporateInquiryController.getAllInquiries(req, res);
});

// Admin: Update status
corporateInquiryRouter.patch('/:id/status', (req, res) => {
  void corporateInquiryController.updateStatus(req, res);
});
