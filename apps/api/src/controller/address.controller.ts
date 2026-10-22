import type { Request, Response } from 'express';
import { Address } from '../model/index.js';

export class AddressController {
  /**
   * Get all addresses for user.
   * GET /api/addresses
   */
  async getAddresses(req: Request, res: Response): Promise<void> {
    try {
      const username = req.user?.username;
      if (!username) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const addresses = await Address.find({ username }).sort({ createdAt: -1 });
      res.status(200).json({ data: addresses });
    } catch (error) {
      console.error('[address] Get addresses error:', error);
      res.status(500).json({ error: 'Failed to fetch addresses.' });
    }
  }

  /**
   * Create an address.
   * POST /api/addresses
   */
  async createAddress(req: Request, res: Response): Promise<void> {
    try {
      const username = req.user?.username;
      if (!username) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const { fullName, phone, line1, line2, landmark, city, state, pincode, type, isDefault } =
        req.body as {
          fullName?: string;
          phone?: string;
          line1?: string;
          line2?: string;
          landmark?: string;
          city?: string;
          state?: string;
          pincode?: string;
          type?: 'home' | 'work' | 'other';
          isDefault?: boolean;
        };

      if (!fullName || !phone || !line1 || !city || !state || !pincode) {
        res.status(400).json({ error: 'Required address fields are missing.' });
        return;
      }

      const existingCount = await Address.countDocuments({ username });
      const shouldBeDefault = isDefault === true || existingCount === 0;

      if (shouldBeDefault) {
        await Address.updateMany({ username }, { isDefault: false });
      }

      const address = await Address.create({
        username,
        fullName,
        phone,
        line1,
        line2: line2 ?? '',
        landmark: landmark ?? '',
        city,
        state,
        pincode,
        type: type ?? 'home',
        isDefault: shouldBeDefault,
      });

      res.status(201).json({ data: address });
    } catch (error) {
      console.error('[address] Create address error:', error);
      res.status(500).json({ error: 'Failed to create address.' });
    }
  }

  /**
   * Update address by ID.
   * PUT /api/addresses/:id
   */
  async updateAddress(req: Request, res: Response): Promise<void> {
    try {
      const username = req.user?.username;
      const { id } = req.params;

      if (!username || !id) {
        res.status(400).json({ error: 'Invalid parameters.' });
        return;
      }

      const address = await Address.findOne({ _id: id, username });
      if (!address) {
        res.status(404).json({ error: 'Address not found.' });
        return;
      }

      const updates = req.body as Partial<{
        fullName: string;
        phone: string;
        line1: string;
        line2: string;
        landmark: string;
        city: string;
        state: string;
        pincode: string;
        type: 'home' | 'work' | 'other';
      }>;

      Object.assign(address, updates);
      await address.save();

      res.status(200).json({ data: address });
    } catch (error) {
      console.error('[address] Update address error:', error);
      res.status(500).json({ error: 'Failed to update address.' });
    }
  }

  /**
   * Delete address by ID.
   * DELETE /api/addresses/:id
   */
  async deleteAddress(req: Request, res: Response): Promise<void> {
    try {
      const username = req.user?.username;
      const { id } = req.params;

      if (!username || !id) {
        res.status(400).json({ error: 'Invalid parameters.' });
        return;
      }

      const deleted = await Address.findOneAndDelete({ _id: id, username });
      if (!deleted) {
        res.status(404).json({ error: 'Address not found.' });
        return;
      }

      // If deleted address was default, make another one default if available
      if (deleted.isDefault) {
        const nextDefault = await Address.findOne({ username });
        if (nextDefault) {
          nextDefault.isDefault = true;
          await nextDefault.save();
        }
      }

      res.status(200).json({ data: { message: 'Address deleted successfully' } });
    } catch (error) {
      console.error('[address] Delete address error:', error);
      res.status(500).json({ error: 'Failed to delete address.' });
    }
  }

  /**
   * Set address as default.
   * PUT /api/addresses/:id/default
   */
  async setDefaultAddress(req: Request, res: Response): Promise<void> {
    try {
      const username = req.user?.username;
      const { id } = req.params;

      if (!username || !id) {
        res.status(400).json({ error: 'Invalid parameters.' });
        return;
      }

      const target = await Address.findOne({ _id: id, username });
      if (!target) {
        res.status(404).json({ error: 'Address not found.' });
        return;
      }

      await Address.updateMany({ username }, { isDefault: false });
      target.isDefault = true;
      await target.save();

      res.status(200).json({ data: target });
    } catch (error) {
      console.error('[address] Set default error:', error);
      res.status(500).json({ error: 'Failed to set default address.' });
    }
  }
}

export const addressController = new AddressController();
