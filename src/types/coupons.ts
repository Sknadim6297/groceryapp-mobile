export type CouponDiscountType = 'percent' | 'flat';

export type CouponTone = 'yellow' | 'peach' | 'mint' | 'sky' | 'lavender';

/**
 * Frontend demo promocode.
 * Never treat as a live offer or submit to coupon/payment APIs.
 */
export type DemoCoupon = {
  id: string;
  code: string;
  title: string;
  detail: string;
  discountType: CouponDiscountType;
  /** Percent 1–100 or flat INR amount depending on discountType. */
  discountValue: number;
  minimum: number;
  maxDiscount?: number;
  expiresAtLabel: string;
  /** ISO date (YYYY-MM-DD) for eligibility checks. */
  expiresOn: string;
  tone: CouponTone;
  illustration: 'produce' | 'dairy' | 'fruits' | 'household' | 'snacks';
  terms: string;
};

/** Backward-compatible shape used by checkout bill helpers. */
export type PreviewCoupon = {
  id: string;
  title: string;
  detail: string;
  amount: number;
  minimum: number;
  code?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  maxDiscount?: number;
  expiresOn?: string;
};
