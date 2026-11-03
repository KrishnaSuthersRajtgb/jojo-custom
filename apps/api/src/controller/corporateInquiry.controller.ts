import type { Request, Response } from 'express';
import { CorporateInquiry, type CorporateInquiryStatus } from '../model/CorporateInquiry.js';

export class CorporateInquiryController {
  /**
   * Submit a new corporate / bulk order inquiry.
   * POST /api/corporate-inquiry
   */
  async createInquiry(req: Request, res: Response): Promise<void> {
    try {
      const {
        organizationName,
        contactPerson,
        email,
        phone,
        garmentType,
        estimatedQuantity,
        deliveryCity,
        targetDate,
        specialRequirements,
      } = req.body as {
        organizationName?: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
        garmentType?: string;
        estimatedQuantity?: number | string;
        deliveryCity?: string;
        targetDate?: string;
        specialRequirements?: string;
      };

      if (
        !organizationName ||
        !contactPerson ||
        !email ||
        !phone ||
        !garmentType ||
        !estimatedQuantity ||
        !deliveryCity ||
        !targetDate
      ) {
        res.status(400).json({ error: 'All required inquiry fields must be filled.' });
        return;
      }

      const inquiry = await CorporateInquiry.create({
        organizationName: organizationName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        garmentType: garmentType.trim(),
        estimatedQuantity: Number(estimatedQuantity),
        deliveryCity: deliveryCity.trim(),
        targetDate: targetDate.trim(),
        specialRequirements: specialRequirements ? specialRequirements.trim() : '',
        status: 'New',
      });

      res.status(201).json({
        success: true,
        data: inquiry,
        message:
          'Your bulk order inquiry has been received. Our atelier team will contact you within 24 hours.',
      });
    } catch (error) {
      console.error('[corporateInquiry] createInquiry error:', error);
      res.status(500).json({ error: 'Failed to submit corporate inquiry.' });
    }
  }

  /**
   * Get all corporate inquiries (Admin).
   * GET /api/corporate-inquiry
   */
  async getAllInquiries(_req: Request, res: Response): Promise<void> {
    try {
      const inquiries = await CorporateInquiry.find({}).sort({ createdAt: -1 });
      res.status(200).json({ data: inquiries });
    } catch (error) {
      console.error('[corporateInquiry] getAllInquiries error:', error);
      res.status(500).json({ error: 'Failed to fetch corporate inquiries.' });
    }
  }

  /**
   * Update status of corporate inquiry.
   * PATCH /api/corporate-inquiry/:id/status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as { status?: CorporateInquiryStatus };

      const validStatuses: CorporateInquiryStatus[] = ['New', 'In Progress', 'Quoted', 'Closed'];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({ error: `Valid status (${validStatuses.join(', ')}) is required.` });
        return;
      }

      const inquiry = await CorporateInquiry.findByIdAndUpdate(id, { status }, { new: true });

      if (!inquiry) {
        res.status(404).json({ error: 'Corporate inquiry not found.' });
        return;
      }

      res.status(200).json({
        data: inquiry,
        message: `Inquiry status updated to "${status}".`,
      });
    } catch (error) {
      console.error('[corporateInquiry] updateStatus error:', error);
      res.status(500).json({ error: 'Failed to update inquiry status.' });
    }
  }
}

export const corporateInquiryController = new CorporateInquiryController();
