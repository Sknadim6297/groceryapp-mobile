import type { PaymentMethodOption } from '@/types/paymentPreferences';

/**
 * Visual-only demo card. Numbers are fictional and partially masked.
 * Never treat this as a real saved payment instrument.
 */
export const DEMO_PAYMENT_CARD = {
  brandLabel: 'Mayapur Bazaar',
  brandSubLabel: 'GROCERY DELIVERY',
  networkLabel: 'DEMO',
  /** Masked display only — not a real PAN. */
  maskedNumber: '•••• •••• •••• 4242',
  holderLabel: 'DEMO CUSTOMER',
  expiryLabel: '08/28',
  badge: 'Demo Card',
} as const;

export const PAYMENT_METHOD_OPTIONS: readonly PaymentMethodOption[] = [
  {
    id: 'card',
    title: 'Credit / Debit Card',
    subtitle: 'Pay using Visa, Mastercard and more',
  },
  {
    id: 'upi',
    title: 'UPI / Digital Wallet',
    subtitle: 'PhonePe, Google Pay, Paytm and more',
  },
  {
    id: 'cod',
    title: 'Cash on Delivery',
    subtitle: 'Pay when your groceries arrive',
  },
];

export const PAYMENT_METHOD_DETAIL: Record<PaymentMethodOption['id'], string> = {
  card: 'Coming Soon. Card checkout is simulated in preview and never charges a real card.',
  upi: 'Coming Soon. UPI selection is a local preference only — no wallet is contacted.',
  cod: 'Cash on Delivery can be preferred here for demo. Checkout still uses its own simulated payment step.',
};
