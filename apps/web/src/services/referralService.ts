import { referralApi, type ReferralStats } from './api';

export type { ReferralStats };

export const referralService = {
  getCode: async (): Promise<string> => {
    const res = await referralApi.getCode();
    return res.data.referralCode;
  },

  applyCode: async (code: string): Promise<{ message: string; referrerUsername?: string }> => {
    const res = await referralApi.applyCode(code);
    return res.data;
  },

  getStats: async (): Promise<ReferralStats> => {
    const res = await referralApi.getStats();
    return res.data;
  },
};
