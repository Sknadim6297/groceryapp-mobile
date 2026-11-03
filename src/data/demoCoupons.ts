import type { DemoCoupon, PreviewCoupon } from '@/types/coupons';

/**
 * Fictional Mayapur Bazaar promocodes for UI preview.
 * Large percentages are visual examples — not live promotions.
 */
export const DEMO_COUPONS: readonly DemoCoupon[] = [
  {
    id: 'demo-grocery-30',
    code: 'MAYA30',
    title: 'Grocery Special',
    detail: 'On orders above ₹999',
    discountType: 'percent',
    discountValue: 30,
    minimum: 999,
    maxDiscount: 150,
    expiresAtLabel: 'Expires 31 Dec 2026',
    expiresOn: '2026-12-31',
    tone: 'yellow',
    illustration: 'produce',
    terms: 'Demo only. Caps at ₹150 off preview carts of ₹999+. Not a live offer.',
  },
  {
    id: 'demo-daily-25',
    code: 'DAILY25',
    title: 'Daily Essentials',
    detail: 'On orders above ₹699',
    discountType: 'percent',
    discountValue: 25,
    minimum: 699,
    maxDiscount: 100,
    expiresAtLabel: 'Expires 30 Nov 2026',
    expiresOn: '2026-11-30',
    tone: 'peach',
    illustration: 'dairy',
    terms: 'Demo only. Caps at ₹100 off. Dairy & staples themed preview coupon.',
  },
  {
    id: 'demo-produce-49',
    code: 'FRESH49',
    title: 'Fruits & Vegetables',
    detail: 'On orders above ₹1,499',
    discountType: 'percent',
    discountValue: 49,
    minimum: 1499,
    maxDiscount: 200,
    expiresAtLabel: 'Expires 15 Dec 2026',
    expiresOn: '2026-12-15',
    tone: 'mint',
    illustration: 'fruits',
    terms: 'Demo only. Caps at ₹200 off. Visual 49% badge is not a live deal.',
  },
  {
    id: 'demo-home-60',
    code: 'HOME60',
    title: 'Home Essentials',
    detail: 'On orders above ₹2,499',
    discountType: 'percent',
    discountValue: 60,
    minimum: 2499,
    maxDiscount: 250,
    expiresAtLabel: 'Expires 20 Jan 2027',
    expiresOn: '2027-01-20',
    tone: 'sky',
    illustration: 'household',
    terms: 'Demo only. Caps at ₹250 off. Household-themed preview coupon.',
  },
  {
    id: 'demo-snacks-53',
    code: 'SNACK53',
    title: 'Snacks & Beverages',
    detail: 'On orders above ₹1,199',
    discountType: 'percent',
    discountValue: 53,
    minimum: 1199,
    maxDiscount: 180,
    expiresAtLabel: 'Expires 10 Dec 2026',
    expiresOn: '2026-12-10',
    tone: 'lavender',
    illustration: 'snacks',
    terms: 'Demo only. Caps at ₹180 off. Snacks-themed preview coupon.',
  },
  {
    id: 'demo-expired-flat',
    code: 'OLD10',
    title: 'Expired Preview Offer',
    detail: 'Was ₹10 off above ₹50',
    discountType: 'flat',
    discountValue: 10,
    minimum: 50,
    expiresAtLabel: 'Expired 01 Jan 2026',
    expiresOn: '2026-01-01',
    tone: 'peach',
    illustration: 'produce',
    terms: 'Expired demo coupon. Cannot be collected or applied.',
  },
];

export function formatDiscountBadge(coupon: DemoCoupon): string {
  if (coupon.discountType === 'percent') {
    return `${coupon.discountValue}%\nOFF`;
  }
  return `₹${coupon.discountValue}\nOFF`;
}

export function formatDiscountSummary(coupon: DemoCoupon): string {
  if (coupon.discountType === 'percent') {
    const cap = coupon.maxDiscount != null ? ` (max ₹${coupon.maxDiscount})` : '';
    return `${coupon.discountValue}% off${cap}`;
  }
  return `₹${coupon.discountValue} off`;
}

export function isCouponExpired(coupon: DemoCoupon, todayIso = todayIsoDate()): boolean {
  return coupon.expiresOn < todayIso;
}

export function demoCouponById(id: string | null | undefined): DemoCoupon | undefined {
  if (!id) {
    return undefined;
  }
  return DEMO_COUPONS.find((coupon) => coupon.id === id);
}

/** Flat preview amount used when cart total is unknown (list cards / legacy helpers). */
export function demoCouponPreviewAmount(coupon: DemoCoupon): number {
  if (coupon.discountType === 'flat') {
    return coupon.discountValue;
  }
  return coupon.maxDiscount ?? Math.round((coupon.minimum * coupon.discountValue) / 100);
}

export function computeDemoCouponDiscount(coupon: DemoCoupon, itemTotal: number): number {
  if (isCouponExpired(coupon) || itemTotal < coupon.minimum) {
    return 0;
  }
  if (coupon.discountType === 'flat') {
    return Math.min(coupon.discountValue, itemTotal);
  }
  const raw = Math.floor((itemTotal * coupon.discountValue) / 100);
  const capped = coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw;
  return Math.max(0, Math.min(capped, itemTotal));
}

export function toPreviewCoupon(coupon: DemoCoupon): PreviewCoupon {
  return {
    id: coupon.id,
    title: coupon.title,
    detail: coupon.detail,
    amount: demoCouponPreviewAmount(coupon),
    minimum: coupon.minimum,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscount: coupon.maxDiscount,
    expiresOn: coupon.expiresOn,
  };
}

/** Legacy export used by checkout/cart — maps to the richer demo catalog. */
export const previewCoupons: readonly PreviewCoupon[] = DEMO_COUPONS.filter(
  (coupon) => !isCouponExpired(coupon),
).map(toPreviewCoupon);

export function previewCouponById(id: string | null): PreviewCoupon | undefined {
  const coupon = demoCouponById(id);
  if (!coupon || isCouponExpired(coupon)) {
    return undefined;
  }
  return toPreviewCoupon(coupon);
}

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
