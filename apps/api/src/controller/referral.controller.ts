import type { Request, Response } from 'express';
import { User } from '../model/index.js';

export function generateReferralCode(username: string): string {
  const clean = username
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X');
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `JOJO-${clean}-${random4.toString()}`;
}

export class ReferralController {
  /**
   * Get current user's referral code.
   * GET /api/referral/code
   */
  async getCode(req: Request, res: Response): Promise<void> {
    try {
      const username = req.user?.username;
      if (!username) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const user = await User.findOne({ username });
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      if (!user.referralCode) {
        let code = generateReferralCode(user.username);
        while (await User.findOne({ referralCode: code })) {
          code = generateReferralCode(user.username);
        }
        user.referralCode = code;
        await user.save();
      }

      res.status(200).json({ data: { referralCode: user.referralCode } });
    } catch (error) {
      console.error('[referral] getCode error:', error);
      res.status(500).json({ error: 'Failed to fetch referral code.' });
    }
  }

  /**
   * Apply a referral code.
   * POST /api/referral/apply
   */
  async applyCode(req: Request, res: Response): Promise<void> {
    try {
      const username = req.user?.username;
      const { referralCode } = req.body as { referralCode?: string };

      if (!referralCode || typeof referralCode !== 'string' || !referralCode.trim()) {
        res.status(400).json({ error: 'Referral code is required.' });
        return;
      }

      const cleanCode = referralCode.trim().toUpperCase();
      const referrer = await User.findOne({ referralCode: cleanCode });

      if (!referrer) {
        res.status(404).json({ error: 'Invalid referral code.' });
        return;
      }

      if (username) {
        if (referrer.username === username) {
          res.status(400).json({ error: 'You cannot use your own referral code.' });
          return;
        }

        const user = await User.findOne({ username });
        if (user) {
          if (user.referredBy) {
            res.status(400).json({ error: 'You have already applied a referral code.' });
            return;
          }
          user.referredBy = referrer.username;
          await user.save();

          referrer.referralCount = (referrer.referralCount || 0) + 1;
          await referrer.save();
        }
      }

      res.status(200).json({
        data: {
          message: 'Referral code applied successfully.',
          referrerUsername: referrer.username,
        },
      });
    } catch (error) {
      console.error('[referral] applyCode error:', error);
      res.status(500).json({ error: 'Failed to apply referral code.' });
    }
  }

  /**
   * Get referral statistics and loyalty credits.
   * GET /api/referral/stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const username = req.user?.username;
      if (!username) {
        res.status(401).json({ error: 'Unauthorized.' });
        return;
      }

      const user = await User.findOne({ username });
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      if (!user.referralCode) {
        let code = generateReferralCode(user.username);
        while (await User.findOne({ referralCode: code })) {
          code = generateReferralCode(user.username);
        }
        user.referralCode = code;
        await user.save();
      }

      res.status(200).json({
        data: {
          referralCode: user.referralCode,
          referralCount: user.referralCount,
          loyaltyCredits: user.loyaltyCredits,
          referredBy: user.referredBy ?? null,
        },
      });
    } catch (error) {
      console.error('[referral] getStats error:', error);
      res.status(500).json({ error: 'Failed to fetch referral stats.' });
    }
  }
}

export const referralController = new ReferralController();
