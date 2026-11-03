export interface AtelierCoupon {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number; // percentage (e.g. 15 for 15%) or flat rupees (e.g. 500)
  minOrderValue: number;
  description: string;
  active: boolean;
  usesCount?: number | undefined;
  usageCount?: number | undefined;
  maxUsage?: number | undefined;
  expiresAt?: string | undefined;
  usedBy?: string[] | undefined;
}

const COUPONS_STORAGE_KEY = 'jojo_coupons_v1';

const DEFAULT_COUPONS: AtelierCoupon[] = [
  {
    code: 'BRIDAL15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 2000,
    description: '15% off bespoke bridal lehenga and wedding couture',
    active: true,
    usesCount: 14,
    usageCount: 14,
    maxUsage: 50,
    expiresAt: '2027-12-31',
    usedBy: [],
  },
  {
    code: 'ATELIER500',
    discountType: 'flat',
    discountValue: 500,
    minOrderValue: 2500,
    description: 'Flat ₹500 privileged discount on custom atelier stitching',
    active: true,
    usesCount: 38,
    usageCount: 38,
    maxUsage: 100,
    expiresAt: '2027-12-31',
    usedBy: [],
  },
  {
    code: 'SILK10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 1000,
    description: '10% privilege discount on pure silk & Banarasi textiles',
    active: true,
    usesCount: 52,
    usageCount: 52,
    maxUsage: 200,
    expiresAt: '2027-12-31',
    usedBy: [],
  },
  {
    code: 'ROYAL20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 5000,
    description: '20% off master artisan heavy embroidery commissions',
    active: true,
    usesCount: 8,
    usageCount: 8,
    maxUsage: 25,
    expiresAt: '2027-12-31',
    usedBy: [],
  },
];

export const couponService = {
  getCoupons(): AtelierCoupon[] {
    try {
      const raw = localStorage.getItem(COUPONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize coupons to ensure usageCount, maxUsage, and usedBy exist
          return parsed.map((item: Partial<AtelierCoupon>) => {
            const usage = item.usageCount ?? item.usesCount ?? 0;
            return {
              code: item.code ?? '',
              discountType: item.discountType ?? 'percentage',
              discountValue: item.discountValue ?? 0,
              minOrderValue: item.minOrderValue ?? 0,
              description: item.description ?? '',
              active: item.active ?? true,
              usesCount: usage,
              usageCount: usage,
              maxUsage: item.maxUsage ?? 100,
              expiresAt: item.expiresAt,
              usedBy: Array.isArray(item.usedBy) ? item.usedBy : [],
            } as AtelierCoupon;
          });
        }
      }
    } catch {
      // fallback
    }
    // Seed default coupons
    try {
      localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(DEFAULT_COUPONS));
    } catch {
      // ignore storage error
    }
    return DEFAULT_COUPONS;
  },

  saveCoupons(coupons: AtelierCoupon[]): void {
    try {
      localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
    } catch {
      // ignore storage error
    }
  },

  addCoupon(coupon: AtelierCoupon): void {
    const list = this.getCoupons();
    const existingIdx = list.findIndex(
      (c) => c.code.toUpperCase() === coupon.code.toUpperCase().trim(),
    );
    const normalized: AtelierCoupon = {
      ...coupon,
      code: coupon.code.toUpperCase().trim(),
      usageCount: coupon.usageCount ?? coupon.usesCount ?? 0,
      usesCount: coupon.usageCount ?? coupon.usesCount ?? 0,
      maxUsage: coupon.maxUsage ?? 100,
      usedBy: coupon.usedBy ?? [],
    };

    if (existingIdx >= 0) {
      list[existingIdx] = normalized;
    } else {
      list.unshift(normalized);
    }
    this.saveCoupons(list);
  },

  updateCoupon(code: string, updates: Partial<AtelierCoupon>): AtelierCoupon[] {
    const list = this.getCoupons().map((c) => {
      if (c.code.toUpperCase() === code.toUpperCase()) {
        const updated = { ...c, ...updates };
        if (updates.usageCount !== undefined) {
          updated.usesCount = updates.usageCount;
        }
        return updated;
      }
      return c;
    });
    this.saveCoupons(list);
    return list;
  },

  toggleCoupon(code: string): AtelierCoupon[] {
    const list = this.getCoupons().map((c) =>
      c.code.toUpperCase() === code.toUpperCase() ? { ...c, active: !c.active } : c,
    );
    this.saveCoupons(list);
    return list;
  },

  deleteCoupon(code: string): AtelierCoupon[] {
    const list = this.getCoupons().filter((c) => c.code.toUpperCase() !== code.toUpperCase());
    this.saveCoupons(list);
    return list;
  },

  recordUsage(code: string, userId?: string): void {
    const list = this.getCoupons();
    const coupon = list.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    if (coupon) {
      const newUsage = (coupon.usageCount ?? coupon.usesCount ?? 0) + 1;
      coupon.usageCount = newUsage;
      coupon.usesCount = newUsage;
      if (!Array.isArray(coupon.usedBy)) {
        coupon.usedBy = [];
      }
      if (userId && !coupon.usedBy.includes(userId)) {
        coupon.usedBy.push(userId);
      }
      this.saveCoupons(list);
    }
  },

  validateCoupon(
    code: string,
    orderTotal: number,
  ): {
    valid: boolean;
    error?: string;
    discountAmount: number;
    coupon?: AtelierCoupon;
  } {
    const cleanCode = code.trim().toUpperCase();
    const all = this.getCoupons();
    const coupon = all.find((c) => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return {
        valid: false,
        error: 'Invalid promo code. Please check spelling.',
        discountAmount: 0,
      };
    }

    if (!coupon.active) {
      return {
        valid: false,
        error: 'This promo code has expired or is deactivated.',
        discountAmount: 0,
      };
    }

    // Check expiry date
    if (coupon.expiresAt) {
      const expiry = new Date(coupon.expiresAt);
      expiry.setHours(23, 59, 59, 999);
      if (expiry.getTime() < Date.now()) {
        return {
          valid: false,
          error: `This promo code expired on ${new Date(coupon.expiresAt).toLocaleDateString('en-IN')}.`,
          discountAmount: 0,
          coupon,
        };
      }
    }

    // Check maximum usage
    const currentUsage = coupon.usageCount ?? coupon.usesCount ?? 0;
    if (coupon.maxUsage && currentUsage >= coupon.maxUsage) {
      return {
        valid: false,
        error: `Promo code "${coupon.code}" has reached its maximum usage limit of ${coupon.maxUsage.toString()} redemptions.`,
        discountAmount: 0,
        coupon,
      };
    }

    if (orderTotal < coupon.minOrderValue) {
      return {
        valid: false,
        error: `Requires a minimum order value of ₹${coupon.minOrderValue.toLocaleString('en-IN')}.`,
        discountAmount: 0,
        coupon,
      };
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((orderTotal * coupon.discountValue) / 100);
    } else {
      discount = coupon.discountValue;
    }

    // Ensure discount does not exceed total
    discount = Math.min(discount, orderTotal);

    return { valid: true, discountAmount: discount, coupon };
  },
};
