export interface AtelierCoupon {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number; // percentage (e.g. 15 for 15%) or flat rupees (e.g. 500)
  minOrderValue: number;
  description: string;
  active: boolean;
  usesCount: number;
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
  },
  {
    code: 'ATELIER500',
    discountType: 'flat',
    discountValue: 500,
    minOrderValue: 2500,
    description: 'Flat ₹500 privileged discount on custom atelier stitching',
    active: true,
    usesCount: 38,
  },
  {
    code: 'SILK10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 1000,
    description: '10% privilege discount on pure silk & Banarasi textiles',
    active: true,
    usesCount: 52,
  },
  {
    code: 'ROYAL20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 5000,
    description: '20% off master artisan heavy embroidery commissions',
    active: true,
    usesCount: 8,
  },
];

export const couponService = {
  getCoupons(): AtelierCoupon[] {
    try {
      const raw = localStorage.getItem(COUPONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as AtelierCoupon[];
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
    if (existingIdx >= 0) {
      list[existingIdx] = coupon;
    } else {
      list.unshift(coupon);
    }
    this.saveCoupons(list);
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

    if (orderTotal < coupon.minOrderValue) {
      return {
        valid: false,
        error: `Requires a minimum order value of ₹${coupon.minOrderValue.toLocaleString('en-IN')}.`,
        discountAmount: 0,
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
