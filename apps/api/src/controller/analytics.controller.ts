import type { Request, Response } from 'express';
import { Order } from '../model/Order.js';

export class AnalyticsController {
  /**
   * Get sales statistics for admin analytics dashboard.
   * GET /api/analytics/sales
   */
  async getSalesStats(_req: Request, res: Response): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      // 1. Orders per day for last 30 days
      const dailyAgg = await Order.aggregate<{ _id: string; count: number; revenue: number }>([
        {
          $match: {
            placedAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$placedAt' },
            },
            count: { $sum: 1 },
            revenue: { $sum: '$orderDetails.total' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const dailyMap = new Map<string, { count: number; revenue: number }>();
      for (const item of dailyAgg) {
        dailyMap.set(item._id, { count: item.count, revenue: item.revenue });
      }

      const ordersPerDay: { date: string; displayDate: string; count: number; revenue: number }[] =
        [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear().toString();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;
        const displayDate = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const existing = dailyMap.get(key);
        ordersPerDay.push({
          date: key,
          displayDate,
          count: existing ? existing.count : 0,
          revenue: existing ? existing.revenue : 0,
        });
      }

      // 2. Revenue grouped by fabricName
      const fabricAgg = await Order.aggregate<{
        _id: string;
        revenue: number;
        ordersCount: number;
      }>([
        {
          $group: {
            _id: '$orderDetails.fabricName',
            revenue: { $sum: '$orderDetails.total' },
            ordersCount: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]);
      const revenueByFabric = fabricAgg.map((f) => ({
        fabricName: f._id || 'Standard Fabric',
        revenue: f.revenue || 0,
        ordersCount: f.ordersCount || 0,
      }));

      // 3. Top garments
      const garmentAgg = await Order.aggregate<{ _id: string; count: number; revenue: number }>([
        {
          $group: {
            _id: {
              $cond: [
                {
                  $and: ['$orderDetails.garmentLabel', { $ne: ['$orderDetails.garmentLabel', ''] }],
                },
                '$orderDetails.garmentLabel',
                {
                  $cond: [
                    { $and: ['$orderDetails.garment', { $ne: ['$orderDetails.garment', ''] }] },
                    '$orderDetails.garment',
                    'Bespoke Couture',
                  ],
                },
              ],
            },
            count: { $sum: 1 },
            revenue: { $sum: '$orderDetails.total' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);
      const topGarments = garmentAgg.map((g) => ({
        garment: g._id || 'Bespoke Garment',
        count: g.count || 0,
        revenue: g.revenue || 0,
      }));

      // 4. Orders grouped by deliveryCity from address
      const cityAgg = await Order.aggregate<{ _id: string; count: number; revenue: number }>([
        {
          $group: {
            _id: '$address.city',
            count: { $sum: 1 },
            revenue: { $sum: '$orderDetails.total' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);
      const ordersByCity = cityAgg.map((c) => ({
        city: c._id || 'Unknown City',
        count: c.count || 0,
        revenue: c.revenue || 0,
      }));

      // 5. Overall Totals
      const revAgg = await Order.aggregate<{ _id: null; total: number }>([
        {
          $group: {
            _id: null,
            total: { $sum: '$orderDetails.total' },
          },
        },
      ]);
      const totalRevenue = revAgg[0]?.total ?? 0;
      const totalOrders = await Order.countDocuments({});
      const pendingOrders = await Order.countDocuments({
        status: { $in: ['placed', 'processing', 'packed', 'confirmed'] },
      });
      const deliveredOrders = await Order.countDocuments({
        status: 'delivered',
      });

      res.status(200).json({
        data: {
          ordersPerDay,
          revenueByFabric,
          topGarments,
          ordersByCity,
          totalRevenue,
          totalOrders,
          pendingOrders,
          deliveredOrders,
        },
      });
    } catch (error) {
      console.error('[analytics] getSalesStats error:', error);
      res.status(500).json({ error: 'Failed to fetch sales analytics.' });
    }
  }
}

export const analyticsController = new AnalyticsController();
