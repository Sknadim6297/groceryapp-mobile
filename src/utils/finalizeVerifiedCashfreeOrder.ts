import type { SimulatedOrder } from '@/types/order';

export type VerifiedCheckoutLine = {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
};

export function buildVerifiedCashfreeOrder(input: {
  orderId: string;
  amount: number;
  addressTitle: string;
  addressLine: string;
  items: VerifiedCheckoutLine[];
}): SimulatedOrder {
  return {
    id: input.orderId,
    placedAtLabel: 'Just now',
    status: 'confirmed',
    statusDetail: 'Online payment verified with Cashfree via Mayapur Bazaar servers.',
    statusAt: {
      placed: 'Just now',
      confirmed: 'Just now',
    },
    addressTitle: input.addressTitle,
    addressLine: input.addressLine,
    items: input.items,
    totalAmount: input.amount,
    total: input.amount,
    paymentLabel: 'Online · Cashfree (verified)',
    partner: { name: 'Mayapur Bazaar', status: 'Confirmed' },
  };
}
