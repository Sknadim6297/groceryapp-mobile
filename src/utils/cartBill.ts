import type { DemoProduct } from '@/types/catalog';

/**
 * No delivery or handling fee is configured.
 * These stay zero until a fee service exists. They are not a confirmed free-delivery offer.
 */
export const DELIVERY_PARTNER_FEE = 0;
export const HANDLING_FEE = 0;

export type CartLine = {
  product: DemoProduct;
  quantity: number;
};

export type CartBill = {
  itemCount: number;
  mrpTotal: number;
  itemTotal: number;
  savings: number;
  deliveryPartnerFee: number;
  handlingFee: number;
  subtotal: number;
};

export function buildCartBill(lines: readonly CartLine[]): CartBill {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const mrpTotal = lines.reduce((sum, line) => sum + (line.product.compareAt ?? line.product.price) * line.quantity, 0);
  const itemTotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const savings = Math.max(0, mrpTotal - itemTotal);
  const subtotal = itemTotal + DELIVERY_PARTNER_FEE + HANDLING_FEE;

  return {
    itemCount,
    mrpTotal,
    itemTotal,
    savings,
    deliveryPartnerFee: DELIVERY_PARTNER_FEE,
    handlingFee: HANDLING_FEE,
    subtotal,
  };
}

export function formatRupee(amount: number): string {
  const whole = Math.max(0, Math.round(amount));
  const digits = String(whole);
  if (digits.length <= 3) {
    return `₹${digits}`;
  }
  const head = digits.slice(0, -3);
  const tail = digits.slice(-3);
  return `₹${head.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${tail}`;
}
