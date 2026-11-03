import { buildCartBill, type CartBill, type CartLine } from '@/utils/cartBill';

/** Demo delivery fee shown only in preview checkout math — not a live fee quote. */
export const DEMO_DELIVERY_FEE = 29;

export type DemoCheckoutBill = CartBill & {
  deliveryFee: number;
  discount: number;
  grandTotal: number;
};

let demoOrderSeq = 1000;

/** Session-local demo order id. Not a server order number. */
export function createDemoOrderId(): string {
  demoOrderSeq += 1;
  return `DEMO-${demoOrderSeq}`;
}

/** Preview-only bill math. Delivery fee and discounts are simulated, not live quotes. */
export function buildDemoCheckoutBill(lines: readonly CartLine[], discount = 0): DemoCheckoutBill {
  const base = buildCartBill(lines);
  const deliveryFee = lines.length > 0 ? DEMO_DELIVERY_FEE : 0;
  const safeDiscount = Math.max(0, Math.min(discount, base.itemTotal));
  const grandTotal = Math.max(0, base.itemTotal + deliveryFee - safeDiscount);
  return {
    ...base,
    deliveryPartnerFee: deliveryFee,
    deliveryFee,
    discount: safeDiscount,
    subtotal: base.itemTotal + deliveryFee,
    grandTotal,
  };
}
