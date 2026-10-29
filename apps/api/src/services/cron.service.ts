import { Order } from '../model/Order.js';

export interface CronRunStats {
  timestamp: string;
  scannedCount: number;
  expiredPendingCount: number;
  totalFailedOrders: number;
  durationMs: number;
  message: string;
}

class FailedPaymentCronService {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastRunStats: CronRunStats | null = null;
  private runHistory: CronRunStats[] = [];
  private intervalMinutes = 5;

  /**
   * Run the failed payment reconciliation job.
   */
  async runJob(): Promise<CronRunStats> {
    if (this.isRunning) {
      return {
        timestamp: new Date().toISOString(),
        scannedCount: 0,
        expiredPendingCount: 0,
        totalFailedOrders: 0,
        durationMs: 0,
        message: 'Job is currently in progress.',
      };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Find pending orders older than 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const pendingOrders = await Order.find({
        paymentStatus: 'pending',
        placedAt: { $lt: fifteenMinutesAgo },
      });

      let expiredCount = 0;
      for (const order of pendingOrders) {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        await order.save();
        expiredCount++;
      }

      // Count total failed orders in system
      const totalFailedOrders = await Order.countDocuments({
        paymentStatus: 'failed',
      });

      const durationMs = Date.now() - startTime;
      const stats: CronRunStats = {
        timestamp: new Date().toISOString(),
        scannedCount: pendingOrders.length,
        expiredPendingCount: expiredCount,
        totalFailedOrders,
        durationMs,
        message: `Successfully processed: ${expiredCount.toString()} expired checkouts flagged as failed. ${totalFailedOrders.toString()} total failed payments tracked.`,
      };

      this.lastRunStats = stats;
      this.runHistory.unshift(stats);
      if (this.runHistory.length > 20) {
        this.runHistory.pop();
      }

      console.log(
        `[cron] Failed payment job completed in ${durationMs.toString()}ms:`,
        stats.message,
      );
      return stats;
    } catch (error) {
      console.error('[cron] Error in failed payment cron job:', error);
      const errorStats: CronRunStats = {
        timestamp: new Date().toISOString(),
        scannedCount: 0,
        expiredPendingCount: 0,
        totalFailedOrders: 0,
        durationMs: Date.now() - startTime,
        message: `Cron job error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      this.lastRunStats = errorStats;
      return errorStats;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start recurring cron timer.
   */
  startCron(intervalMinutes = 5): void {
    this.intervalMinutes = intervalMinutes;
    if (this.timer) {
      clearInterval(this.timer);
    }

    console.log(
      `[cron] Initialized failed payment cron job (runs every ${this.intervalMinutes.toString()} min)`,
    );
    // Run initial scan 10 seconds after boot
    setTimeout(() => {
      void this.runJob();
    }, 10000);

    // Recurring interval
    this.timer = setInterval(
      () => {
        void this.runJob();
      },
      this.intervalMinutes * 60 * 1000,
    );
  }

  /**
   * Stop cron timer.
   */
  stopCron(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[cron] Failed payment cron job stopped.');
    }
  }

  /**
   * Get current cron status and execution history.
   */
  getStatus() {
    return {
      active: this.timer !== null,
      intervalMinutes: this.intervalMinutes,
      isRunning: this.isRunning,
      lastRun: this.lastRunStats,
      history: this.runHistory,
    };
  }
}

export const failedPaymentCron = new FailedPaymentCronService();
