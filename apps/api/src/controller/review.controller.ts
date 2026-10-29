import type { Request, Response } from 'express';
import { Review } from '../model/index.js';

export class ReviewController {
  /**
   * Get reviews, optionally filtered by fabricId or orderId.
   * GET /api/reviews?fabricId=...&limit=20
   */
  async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const {
        fabricId,
        orderId,
        limit = '20',
      } = req.query as {
        fabricId?: string;
        orderId?: string;
        limit?: string;
      };

      const query: Record<string, unknown> = { status: 'approved' };
      if (fabricId) {
        query['fabricId'] = fabricId;
      }
      if (orderId) {
        query['orderId'] = orderId;
      }

      const reviews = await Review.find(query)
        .sort({ createdAt: -1 })
        .limit(Math.min(parseInt(limit, 10) || 20, 100));

      // Calculate rating stats if fabricId is requested
      let stats = null;
      if (fabricId) {
        const allReviews = await Review.find({ fabricId, status: 'approved' });
        const count = allReviews.length;
        const avg = count > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
        stats = {
          count,
          average: Math.round(avg * 10) / 10,
        };
      }

      res.status(200).json({ data: reviews, stats });
    } catch (error) {
      console.error('[reviews] Get reviews error:', error);
      res.status(500).json({ error: 'Failed to fetch reviews.' });
    }
  }

  /**
   * Admin: Get all reviews (including pending/flagged)
   * GET /api/reviews/admin
   */
  async getAllAdminReviews(_req: Request, res: Response): Promise<void> {
    try {
      const reviews = await Review.find({}).sort({ createdAt: -1 });
      res.status(200).json({ data: reviews });
    } catch (error) {
      console.error('[reviews] Admin reviews error:', error);
      res.status(500).json({ error: 'Failed to fetch admin reviews.' });
    }
  }

  /**
   * Post a new review
   * POST /api/reviews
   */
  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const { username, userId, orderId, fabricId, fabricName, garment, rating, title, comment } =
        req.body as {
          username?: string;
          userId?: string;
          orderId?: string;
          fabricId?: string;
          fabricName?: string;
          garment?: string;
          rating?: number;
          title?: string;
          comment?: string;
        };

      if (!username || !rating || !title || !comment) {
        res.status(400).json({ error: 'Username, rating, title, and comment are required.' });
        return;
      }

      if (orderId) {
        const existing = await Review.findOne({ orderId });
        if (existing) {
          res.status(400).json({ error: 'A review has already been submitted for this delivery.' });
          return;
        }
      }

      const payload: Record<string, unknown> = {
        username,
        rating: Math.max(1, Math.min(5, rating)),
        title,
        comment,
        verifiedPurchase: true,
        status: 'approved',
      };
      if (userId || req.user?.username) payload['userId'] = userId || req.user?.username;
      if (orderId) payload['orderId'] = orderId;
      if (fabricId) payload['fabricId'] = fabricId;
      if (fabricName) payload['fabricName'] = fabricName;
      if (garment) payload['garment'] = garment;

      const review = await Review.create(payload);

      res.status(201).json({ data: review });
    } catch (error) {
      console.error('[reviews] Create review error:', error);
      res.status(500).json({ error: 'Failed to post review.' });
    }
  }

  /**
   * Admin: Update review status
   * PATCH /api/reviews/:id/status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as { status?: 'approved' | 'pending' | 'flagged' };

      if (!status) {
        res.status(400).json({ error: 'Status is required.' });
        return;
      }

      const updated = await Review.findByIdAndUpdate(id, { status }, { new: true });
      if (!updated) {
        res.status(404).json({ error: 'Review not found.' });
        return;
      }

      res.status(200).json({ data: updated });
    } catch (error) {
      console.error('[reviews] Update status error:', error);
      res.status(500).json({ error: 'Failed to update review status.' });
    }
  }

  /**
   * Delete a review
   * DELETE /api/reviews/:id
   */
  async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await Review.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Review not found.' });
        return;
      }

      res.status(200).json({ message: 'Review deleted successfully.' });
    } catch (error) {
      console.error('[reviews] Delete review error:', error);
      res.status(500).json({ error: 'Failed to delete review.' });
    }
  }
}

export const reviewController = new ReviewController();
