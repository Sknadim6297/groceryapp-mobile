import type { AppIconName } from '@/components/ui/AppIcon';

export const checkoutPaymentMethodIds = ['cod', 'online'] as const;

export type CheckoutPaymentMethodId = (typeof checkoutPaymentMethodIds)[number];

export type CheckoutPaymentMethod = {
  id: CheckoutPaymentMethodId;
  title: string;
  subtitle: string;
  icon: AppIconName;
  /**
   * Preview can place a simulated COD order locally.
   * Online uses Cashfree — never invent a successful charge client-side.
   */
  canPlaceDemoOrder: boolean;
  /** Opens Cashfree checkout after create-payment-order. */
  usesCashfree: boolean;
  demoBadge?: string;
};

export const CHECKOUT_PAYMENT_METHODS: readonly CheckoutPaymentMethod[] = [
  {
    id: 'cod',
    title: 'Cash on Delivery',
    subtitle: 'Pay when your order arrives',
    icon: 'bag',
    canPlaceDemoOrder: true,
    usesCashfree: false,
  },
  {
    id: 'online',
    title: 'Online Payment',
    subtitle: 'UPI, cards, net banking via Cashfree',
    icon: 'card',
    canPlaceDemoOrder: false,
    usesCashfree: true,
  },
] as const;

/** Legacy route params `upi` / `card` map to Cashfree online checkout. */
const LEGACY_ONLINE_IDS = new Set(['upi', 'card', 'cashfree', 'online']);

export function resolveCheckoutPaymentMethodId(
  raw: string | string[] | undefined | null,
): CheckoutPaymentMethodId {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return 'cod';
  }
  if (value === 'cod') {
    return 'cod';
  }
  if (LEGACY_ONLINE_IDS.has(value)) {
    return 'online';
  }
  if ((checkoutPaymentMethodIds as readonly string[]).includes(value)) {
    return value as CheckoutPaymentMethodId;
  }
  return 'cod';
}

export function getCheckoutPaymentMethod(id: CheckoutPaymentMethodId): CheckoutPaymentMethod {
  return CHECKOUT_PAYMENT_METHODS.find((entry) => entry.id === id) ?? CHECKOUT_PAYMENT_METHODS[0]!;
}
