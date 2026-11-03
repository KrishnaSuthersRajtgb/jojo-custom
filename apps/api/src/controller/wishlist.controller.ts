import type { Request, Response } from 'express';
import { Wishlist, type IWishlistItem } from '../model/index.js';

export class WishlistController {
  /**
   * Get user's wishlist
   * GET /api/wishlist
   */
  async getWishlist(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.username;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      let wishlist = await Wishlist.findOne({ userId });
      if (!wishlist) {
        wishlist = await Wishlist.create({ userId, items: [] });
      }

      res.status(200).json({ data: wishlist });
    } catch (error) {
      console.error('[wishlist] Get wishlist error:', error);
      res.status(500).json({ error: 'Failed to fetch wishlist.' });
    }
  }

  /**
   * Add item to wishlist (upsert)
   * POST /api/wishlist/add
   */
  async addItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.username;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const { fabricId, fabricName, tone, hex, pricePerMeter } = req.body as {
        fabricId?: string;
        fabricName?: string;
        tone?: string;
        hex?: string;
        pricePerMeter?: number;
      };

      if (!fabricId || !fabricName) {
        res.status(400).json({ error: 'fabricId and fabricName are required.' });
        return;
      }

      let wishlist = await Wishlist.findOne({ userId });
      if (!wishlist) {
        wishlist = new Wishlist({ userId, items: [] });
      }

      const existingIndex = wishlist.items.findIndex((item) => item.fabricId === fabricId);
      const newItem: IWishlistItem = {
        fabricId,
        fabricName,
        tone: tone ?? 'warm',
        hex: hex ?? '#5C1A32',
        pricePerMeter: pricePerMeter ?? 0,
        addedAt: new Date(),
      };

      if (existingIndex > -1) {
        wishlist.items[existingIndex] = newItem;
      } else {
        wishlist.items.push(newItem);
      }

      await wishlist.save();
      res.status(200).json({ data: wishlist });
    } catch (error) {
      console.error('[wishlist] Add item error:', error);
      res.status(500).json({ error: 'Failed to add item to wishlist.' });
    }
  }

  /**
   * Remove item from wishlist
   * DELETE /api/wishlist/:fabricId
   */
  async removeItem(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.user?.username;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const { fabricId } = req.params;
      if (!fabricId) {
        res.status(400).json({ error: 'fabricId is required.' });
        return;
      }

      let wishlist = await Wishlist.findOne({ userId });
      if (!wishlist) {
        wishlist = await Wishlist.create({ userId, items: [] });
      } else {
        wishlist.items = wishlist.items.filter((item) => item.fabricId !== fabricId);
        await wishlist.save();
      }

      res.status(200).json({ data: wishlist });
    } catch (error) {
      console.error('[wishlist] Remove item error:', error);
      res.status(500).json({ error: 'Failed to remove item from wishlist.' });
    }
  }
}

export const wishlistController = new WishlistController();
