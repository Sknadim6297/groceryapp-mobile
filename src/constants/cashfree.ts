/**
 * Public Cashfree client config only.
 * Never put the Cashfree Secret Key in Expo public env — create/verify stay on the backend.
 */

export type CashfreeClientEnvironment = 'sandbox' | 'production';

function resolveCashfreeEnvironment(): CashfreeClientEnvironment {
  const raw = (process.env.EXPO_PUBLIC_CASHFREE_ENV ?? 'sandbox').trim().toLowerCase();
  return raw === 'production' ? 'production' : 'sandbox';
}

/** Sandbox by default. Set EXPO_PUBLIC_CASHFREE_ENV=production for live Cashfree checkout. */
export const CASHFREE_ENV: CashfreeClientEnvironment = resolveCashfreeEnvironment();

export const CASHFREE_IS_SANDBOX = CASHFREE_ENV === 'sandbox';

/**
 * Official Cashfree session checkout form endpoint (POST payment_session_id).
 * Used as WebView fallback when the native PG SDK is not linked (e.g. Expo Go).
 * @see https://www.cashfree.com/docs/payments/online/web/custom-checkout-ios
 */
export function cashfreeSessionCheckoutUrl(env: CashfreeClientEnvironment = CASHFREE_ENV): string {
  return env === 'production'
    ? 'https://api.cashfree.com/pg/view/sessions/checkout'
    : 'https://sandbox.cashfree.com/pg/view/sessions/checkout';
}
