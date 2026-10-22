import type { Request, Response } from 'express';
import mongoose from 'mongoose';

export class HealthController {
  /**
   * Health check endpoint.
   * GET /health or GET /api/health
   */
  async check(_req: Request, res: Response): Promise<void> {
    const dbStateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const dbState = dbStateMap[mongoose.connection.readyState] ?? 'unknown';

    res.status(200).json({
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbState,
      },
    });
    await Promise.resolve();
  }
}

export const healthController = new HealthController();
