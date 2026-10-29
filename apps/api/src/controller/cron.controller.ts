import type { Request, Response } from 'express';
import { failedPaymentCron } from '../services/cron.service.js';
import { Order } from '../model/Order.js';

export class CronController {
  /**
   * Get cron status and execution metrics
   * GET /api/cron/failed-payments/status
   */
  async getStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = failedPaymentCron.getStatus();
      const failedOrdersCount = await Order.countDocuments({ paymentStatus: 'failed' });
      const pendingOrdersCount = await Order.countDocuments({ paymentStatus: 'pending' });

      res.status(200).json({
        data: {
          ...status,
          counts: {
            failed: failedOrdersCount,
            pending: pendingOrdersCount,
          },
        },
      });
    } catch (error) {
      console.error('[cron] Error fetching cron status:', error);
      res.status(500).json({ error: 'Failed to fetch cron status.' });
    }
  }

  /**
   * Manually trigger the failed payments cron job
   * POST /api/cron/failed-payments/run
   */
  async runJob(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await failedPaymentCron.runJob();
      res.status(200).json({
        message: 'Failed payment cron job executed successfully.',
        data: stats,
      });
    } catch (error) {
      console.error('[cron] Error triggering cron job:', error);
      res.status(500).json({ error: 'Failed to execute cron job.' });
    }
  }

  /**
   * Get all orders with failed payments
   * GET /api/orders/failed
   */
  async getFailedOrders(_req: Request, res: Response): Promise<void> {
    try {
      const orders = await Order.find({ paymentStatus: 'failed' })
        .sort({ placedAt: -1 })
        .limit(100);
      res.status(200).json({ data: orders });
    } catch (error) {
      console.error('[cron] Error fetching failed orders:', error);
      res.status(500).json({ error: 'Failed to fetch failed orders.' });
    }
  }

  /**
   * Record a payment failure directly (called from checkout frontend when gateway fails)
   * POST /api/orders/payment-failed
   */
  async recordPaymentFailure(req: Request, res: Response): Promise<void> {
    try {
      const { id, orderDetails, address, reason, errorCode } = req.body as {
        id?: string;
        orderDetails?: unknown;
        address?: unknown;
        reason?: string;
        errorCode?: string;
      };

      const username =
        req.user?.username ?? (req.body as { username?: string }).username ?? 'guest';
      const orderId = id ?? `FAIL_${Date.now().toString()}`;

      // Check if order already exists
      let order = await Order.findOne({ id: orderId });
      if (order) {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        await order.save();
      } else if (orderDetails && address) {
        order = await Order.create({
          id: orderId,
          username,
          orderDetails,
          address,
          paymentId: null,
          paymentStatus: 'failed',
          status: 'cancelled',
          placedAt: new Date(),
        });
      }

      console.log(
        `[payment] Recorded payment failure for order ${orderId}: ${reason ?? errorCode ?? 'unknown'}`,
      );
      res.status(200).json({
        message: 'Payment failure recorded successfully for automated recovery.',
        data: { id: orderId, reason, errorCode },
      });
    } catch (error) {
      console.error('[payment] Error recording payment failure:', error);
      res.status(500).json({ error: 'Failed to record payment failure.' });
    }
  }
}

export const cronController = new CronController();
