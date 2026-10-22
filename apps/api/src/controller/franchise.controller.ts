import type { Request, Response } from 'express';
import { Franchise } from '../model/index.js';

export class FranchiseController {
  /**
   * Submit franchise inquiry lead.
   * POST /api/franchise
   */
  async submitInquiry(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, phone, email, city, investment, message } = req.body as {
        fullName?: string;
        phone?: string;
        email?: string;
        city?: string;
        investment?: string;
        message?: string;
      };

      if (!fullName || !phone || !email || !city || !investment) {
        res.status(400).json({ error: 'All required franchise fields must be filled.' });
        return;
      }

      const inquiry = await Franchise.create({
        fullName,
        phone,
        email: email.toLowerCase(),
        city,
        investment,
        message: message ?? '',
        status: 'new',
      });

      res.status(201).json({
        data: {
          id: inquiry.id,
          message: 'Franchise inquiry submitted successfully.',
        },
      });
    } catch (error) {
      console.error('[franchise] Submit error:', error);
      res.status(500).json({ error: 'Failed to submit franchise inquiry.' });
    }
  }

  /**
   * Get all franchise leads (for admin).
   * GET /api/franchise
   */
  async getInquiries(_req: Request, res: Response): Promise<void> {
    try {
      const leads = await Franchise.find().sort({ createdAt: -1 });
      res.status(200).json({ data: leads });
    } catch (error) {
      console.error('[franchise] Get leads error:', error);
      res.status(500).json({ error: 'Failed to fetch franchise leads.' });
    }
  }
}

export const franchiseController = new FranchiseController();
