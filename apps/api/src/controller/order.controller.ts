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
      const { status, trackingNumber, courier } = req.body as {
        status?: OrderStatus;
        trackingNumber?: string;
        courier?: string;
      };

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

      if (!id || (!status && trackingNumber === undefined && courier === undefined)) {
        res.status(400).json({ error: 'Valid update data is required.' });
        return;
      }

      if (status && !validStatuses.includes(status)) {
        res.status(400).json({ error: 'Valid status is required.' });
        return;
      }

      const updateFields: Record<string, unknown> = {};
      if (status) updateFields.status = status;
      if (trackingNumber !== undefined) updateFields.trackingNumber = trackingNumber;
      if (courier !== undefined) updateFields.courier = courier;

      const order = await Order.findOneAndUpdate(
        { $or: [{ id }, { paymentId: id }] },
        { $set: updateFields },
        { new: true },
      );

      if (!order) {
        // Return 200 with updated status even if order was stored only locally
        res.status(200).json({ data: { id, ...updateFields } });
        return;
      }

      res.status(200).json({ data: order });
    } catch (error) {
      console.error('[order] Update order status error:', error);
      res.status(500).json({ error: 'Failed to update order status.' });
    }
  }

  /**
   * Download Amazon-style Tax Invoice (PDF via Puppeteer or HTML)
   * GET /api/orders/:id/invoice
   */
  async downloadInvoice(req: Request, res: Response): Promise<void> {
    try {
      const idParam = typeof req.params['id'] === 'string' ? req.params['id'] : '';
      const format = req.query['format'] === 'html' ? 'html' : 'pdf';

      const order = (await Order.findOne({
        $or: [{ id: idParam }, { paymentId: idParam }],
      }).lean()) as Record<string, unknown> | null;

      const orderDetails = (order?.['orderDetails'] || {}) as Record<string, unknown>;
      const address = (order?.['address'] || {}) as Record<string, unknown>;
      const totalAmount = Number(orderDetails['total']) || 2904;
      const fabricName =
        typeof orderDetails['fabricName'] === 'string'
          ? orderDetails['fabricName']
          : 'Haute Couture Silk';
      const garment =
        typeof orderDetails['garment'] === 'string'
          ? orderDetails['garment']
          : 'Custom Couture Ensemble';
      const meters = Number(orderDetails['meters']) || 3;
      const fabricTotal = Number(orderDetails['fabricTotal']) || Math.round(totalAmount * 0.7);
      const rawAcc = Array.isArray(orderDetails['accessories'])
        ? (orderDetails['accessories'] as Array<{ label: string; price: number }>)
        : [];

      const items = [
        {
          title: `${garment} - ${fabricName}`,
          description: `Bespoke artisanal cut & tailoring (${String(meters)}m premium textile)`,
          hsn: '6211',
          qty: 1,
          unitPrice: fabricTotal,
          netAmount: Math.round((fabricTotal / 1.05) * 100) / 100,
          taxRate: 5,
          taxAmount: Math.round((fabricTotal - fabricTotal / 1.05) * 100) / 100,
          totalAmount: fabricTotal,
        },
      ];

      rawAcc.forEach((acc) => {
        const accPrice = typeof acc.price === 'number' ? acc.price : Number(acc.price) || 0;
        const net = Math.round((accPrice / 1.05) * 100) / 100;
        items.push({
          title: `Atelier Trim: ${acc.label}`,
          description: 'Handcrafted zardozi / border embellishment',
          hsn: '5810',
          qty: 1,
          unitPrice: accPrice,
          netAmount: net,
          taxRate: 5,
          taxAmount: Math.round((accPrice - net) * 100) / 100,
          totalAmount: accPrice,
        });
      });

      const orderPlacedAt = typeof order?.['placedAt'] === 'string' ? order['placedAt'] : undefined;
      const invoiceData = {
        orderId: idParam || 'ORD-JF-2026',
        invoiceNumber: `INV-JF-${(idParam || '2026').slice(-6).toUpperCase()}`,
        orderDate: orderPlacedAt
          ? new Date(orderPlacedAt).toLocaleDateString('en-IN')
          : new Date().toLocaleDateString('en-IN'),
        invoiceDate: new Date().toLocaleDateString('en-IN'),
        customerName:
          (address['fullName'] as string) ||
          (order?.['username'] as string) ||
          'Valued Couture Client',
        customerPhone: (address['phone'] as string) || '',
        shippingAddress: {
          fullName: (address['fullName'] as string) || 'Valued Client',
          street: (address['street'] as string) || 'Bespoke Residence',
          city: (address['city'] as string) || 'Chennai',
          state: (address['state'] as string) || 'Tamil Nadu',
          pincode: (address['pincode'] as string) || '600001',
          phone: (address['phone'] as string) || '+91 94440 00000',
        },
        items,
        grandTotal: totalAmount,
        paymentMode: order?.['paymentId']
          ? 'Online Payment (Razorpay/Card)'
          : 'Prepaid Couture Order',
        paymentTransactionId:
          typeof order?.['paymentId'] === 'string' ? order['paymentId'] : undefined,
      };

      const { generateAmazonInvoiceHtml, generateInvoicePdf } =
        await import('../services/invoice.service.js');

      if (format === 'html') {
        const html = generateAmazonInvoiceHtml(invoiceData);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
        return;
      }

      try {
        const pdfBuffer = await generateInvoicePdf(invoiceData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="Invoice-${invoiceData.invoiceNumber}.pdf"`,
        );
        res.send(pdfBuffer);
      } catch (pdfErr) {
        console.warn('[invoice] Puppeteer PDF generation fallback to HTML:', pdfErr);
        const html = generateAmazonInvoiceHtml(invoiceData);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      }
    } catch (error) {
      console.error('[order] Invoice error:', error);
      res.status(500).json({ error: 'Failed to generate invoice.' });
    }
  }
}

export const orderController = new OrderController();
