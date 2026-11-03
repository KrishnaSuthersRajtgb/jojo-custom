import type { Request, Response } from 'express';
import { MoodBoard } from '../model/MoodBoard.js';

export class MoodboardController {
  async getMoodBoardItems(req: Request, res: Response): Promise<void> {
    try {
      const all = req.query.all === 'true';
      const filter = all ? {} : { active: true };
      const items = await MoodBoard.find(filter).sort({ createdAt: -1 });
      res.json({ data: items });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch mood board items';
      res.status(500).json({ error: message });
    }
  }

  async createMoodBoardItem(req: Request, res: Response): Promise<void> {
    try {
      const {
        imageUrl,
        caption,
        fabricName,
        garmentType,
        priceRange,
        fabricId,
        garmentId,
        active,
      } = req.body as {
        imageUrl?: string;
        caption?: string;
        fabricName?: string;
        garmentType?: string;
        priceRange?: string;
        fabricId?: string;
        garmentId?: string;
        active?: boolean;
      };

      if (!imageUrl || !caption) {
        res.status(400).json({ error: 'Image URL and caption are required.' });
        return;
      }

      const payload: Record<string, unknown> = {
        imageUrl: imageUrl.trim(),
        caption: caption.trim(),
        fabricName: (fabricName || '').trim(),
        garmentType: (garmentType || '').trim(),
        priceRange: (priceRange || '').trim(),
        active: active !== undefined ? active : true,
      };
      if (fabricId?.trim()) payload.fabricId = fabricId.trim();
      if (garmentId?.trim()) payload.garmentId = garmentId.trim();

      const item = await MoodBoard.create(payload);

      res.status(201).json({ data: item, message: 'Mood board item created successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create mood board item';
      res.status(500).json({ error: message });
    }
  }

  async updateMoodBoardItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body as Record<string, unknown>;

      const item = await MoodBoard.findByIdAndUpdate(id, updates, { new: true });
      if (!item) {
        res.status(404).json({ error: 'Mood board item not found.' });
        return;
      }

      res.json({ data: item, message: 'Mood board item updated successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update mood board item';
      res.status(500).json({ error: message });
    }
  }

  async deleteMoodBoardItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await MoodBoard.findByIdAndDelete(id);
      if (!item) {
        res.status(404).json({ error: 'Mood board item not found.' });
        return;
      }

      res.json({ message: 'Mood board item deleted successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete mood board item';
      res.status(500).json({ error: message });
    }
  }
}

export const moodboardController = new MoodboardController();
