export type PreviewCoupon = {
  id: string;
  title: string;
  detail: string;
  amount: number;
  minimum: number;
};

/** Simulated offers for UI preview. These are not live coupons and do not change a real bill. */
export const previewCoupons: readonly PreviewCoupon[] = [
  {
    id: 'preview-10',
    title: 'Preview ₹10 off',
    detail: 'Simulated. Applies only in this preview session.',
    amount: 10,
    minimum: 50,
  },
  {
    id: 'preview-25',
    title: 'Preview ₹25 off',
    detail: 'Simulated. Applies only in this preview session.',
    amount: 25,
    minimum: 200,
  },
];

export function previewCouponById(id: string | null): PreviewCoupon | undefined {
  if (!id) {
    return undefined;
  }
  return previewCoupons.find((coupon) => coupon.id === id);
}
