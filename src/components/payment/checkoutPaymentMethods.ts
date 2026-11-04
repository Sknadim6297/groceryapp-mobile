import type { AppIconName } from '@/components/ui/AppIcon';

export const checkoutPaymentMethodIds = ['cod', 'upi', 'card'] as const;

export type CheckoutPaymentMethodId = (typeof checkoutPaymentMethodIds)[number];

export type CheckoutPaymentMethod = {
  id: CheckoutPaymentMethodId;
  title: string;
  subtitle: string;
  icon: AppIconName;
  /**
   * Preview can place a simulated COD order locally.
   * UPI/Card have no gateway — never invent a successful charge.
   */
  canPlaceDemoOrder: boolean;
  demoBadge?: string;
};

export const CHECKOUT_PAYMENT_METHODS: readonly CheckoutPaymentMethod[] = [
  {
    id: 'cod',
    title: 'Cash on Delivery',
    subtitle: 'Pay when your order arrives',
    icon: 'bag',
    canPlaceDemoOrder: true,
  },
  {
    id: 'upi',
    title: 'Pay using UPI',
    subtitle: 'Secure payment using your UPI app',
    icon: 'phone',
    canPlaceDemoOrder: false,
    demoBadge: 'Demo · gateway not connected',
  },
  {
    id: 'card',
    title: 'Credit / Debit Card',
    subtitle: 'Visa, Mastercard and supported cards',
    icon: 'card',
    canPlaceDemoOrder: false,
    demoBadge: 'Demo · gateway not connected',
  },
] as const;

export function resolveCheckoutPaymentMethodId(
  raw: string | string[] | undefined | null,
): CheckoutPaymentMethodId {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && (checkoutPaymentMethodIds as readonly string[]).includes(value)) {
    return value as CheckoutPaymentMethodId;
  }
  return 'cod';
}

export function getCheckoutPaymentMethod(id: CheckoutPaymentMethodId): CheckoutPaymentMethod {
  return CHECKOUT_PAYMENT_METHODS.find((entry) => entry.id === id) ?? CHECKOUT_PAYMENT_METHODS[0]!;
}
