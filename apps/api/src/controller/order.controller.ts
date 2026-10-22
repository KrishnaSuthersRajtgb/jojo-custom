import type { Request, Response } from 'express';
import { Order, type OrderDetails, type OrderAddress, type OrderStatus } from '../model/index.js';

export class OrderController {
  /**
   * Create an order.
   * POST /api/orders
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const username = req.user?.username ?? (req.body as { username?: string }).username;
      if (!username) {
        res.status(401).json({ error: 'User is required to place an order.' });
        return;
      }

      const { id, orderDetails, address, paymentId } = req.body as {
        id?: string;
        orderDetails?: OrderDetails;
        address?: OrderAddress;
        paymentId?: string | null;
      };

      if (!orderDetails || !address) {
        res.status(400).json({ error: 'Order details and address are required.' });
        return;
      }

      const generatedId =
        id ??
        `ORD_${Date.now().toString()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const order = await Order.create({
        id: generatedId,
        username,
        orderDetails,
        address,
        paymentId: paymentId ?? null,
        paymentStatus: paymentId ? 'paid' : 'pending',
        status: 'placed',
        placedAt: new Date(),
      });

      res.status(201).json({ data: order });
    } catch (error) {
      console.error('[order] Create order error:', error);
      res.status(500).json({ error: 'Failed to create order.' });
    }
  }

  /**
   * Get orders for the logged-in user.
   * GET /api/orders
   */
  async getUserOrders(req: Request, res: Response): Promise<void> {
    try {
      const username =
        req.user?.username ??
        (req.query['username'] as string | undefined) ??
        (req.headers['x-username'] as string | undefined);

      if (!username) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const orders = await Order.find({ username }).sort({ placedAt: -1 });
      res.status(200).json({ data: orders });
    } catch (error) {
      console.error('[order] Get user orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders.' });
    }
  }

  /**
   * Get single order by order ID.
   * GET /api/orders/:id
   */
  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'Order ID is required.' });
        return;
      }

      const order = await Order.findOne({ $or: [{ id }, { paymentId: id }] });
      if (!order) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }

      res.status(200).json({ data: order });
    } catch (error) {
      console.error('[order] Get order by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch order.' });
    }
  }

  /**
   * Get all orders (for admin dashboard and admin order list).
   * GET /api/orders/all or GET /api/admin/orders
   */
  async getAllOrders(_req: Request, res: Response): Promise<void> {
    try {
      const orders = await Order.find().sort({ placedAt: -1 });
      res.status(200).json({ data: orders });
    } catch (error) {
      console.error('[order] Get all orders error:', error);
      res.status(500).json({ error: 'Failed to fetch all orders.' });
    }
  }

  /**
   * Update order status (for admin).
   * PATCH /api/orders/:id/status
   */
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as { status?: OrderStatus };

      const validStatuses: OrderStatus[] = [
        'placed',
        'packed',
        'dispatched',
        'delivered',
        'confirmed',
        'processing',
        'shipped',
        'cancelled',
      ];

      if (!id || !status || !validStatuses.includes(status)) {
        res.status(400).json({ error: 'Valid status is required.' });
        return;
      }

      const order = await Order.findOneAndUpdate(
        { $or: [{ id }, { paymentId: id }] },
        { status },
        { new: true },
      );

      if (!order) {
        // Return 200 with updated status even if order was stored only locally
        res.status(200).json({ data: { id, status } });
        return;
      }

      res.status(200).json({ data: order });
    } catch (error) {
      console.error('[order] Update order status error:', error);
      res.status(500).json({ error: 'Failed to update order status.' });
    }
  }
}

export const orderController = new OrderController();
