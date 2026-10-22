import type { Request, Response } from 'express';
import { Measurement } from '../model/index.js';

export class MeasurementController {
  /**
   * Get user measurements.
   * GET /api/measurements
   */
  async getMeasurements(req: Request, res: Response): Promise<void> {
    try {
      const username = req.user?.username;
      if (!username) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const measurements = await Measurement.findOne({ username });
      if (!measurements) {
        res.status(200).json({
          data: {
            blouse: {},
            chudi: {},
            pant: {},
          },
        });
        return;
      }

      res.status(200).json({
        data: {
          blouse: measurements.blouse,
          chudi: measurements.chudi,
          pant: measurements.pant,
        },
      });
    } catch (error) {
      console.error('[measurements] Get error:', error);
      res.status(500).json({ error: 'Failed to fetch measurements.' });
    }
  }

  /**
   * Save or update user measurements.
   * PUT /api/measurements or POST /api/measurements
   */
  async saveMeasurements(req: Request, res: Response): Promise<void> {
    try {
      const username = req.user?.username;
      if (!username) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const { blouse, chudi, pant } = req.body as {
        blouse?: Record<string, string>;
        chudi?: Record<string, string>;
        pant?: Record<string, string>;
      };

      const updated = await Measurement.findOneAndUpdate(
        { username },
        {
          username,
          blouse: blouse ?? {},
          chudi: chudi ?? {},
          pant: pant ?? {},
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      res.status(200).json({
        data: {
          blouse: updated.blouse,
          chudi: updated.chudi,
          pant: updated.pant,
        },
      });
    } catch (error) {
      console.error('[measurements] Save error:', error);
      res.status(500).json({ error: 'Failed to save measurements.' });
    }
  }
}

export const measurementController = new MeasurementController();
