import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Cashfree checkout launcher.
 *
 * Native PG SDK is intentionally not required here:
 * - It breaks EAS "Exporting server" (imports package.json)
 * - It is large for the under-20MB download APK
 * - Official WebView session checkout covers Expo Go + slim client APK
 *
 * Payment success still depends on backend VerifyPayment — never the WebView alone.
 */

export type CashfreeCheckoutCallbacks = {
  onVerify: (orderId: string) => void;
  onError: (message: string, orderId: string) => void;
};

export type CashfreeCheckoutStartResult =
  | { ok: true }
  | { ok: false; message: string; code: 'unsupported' | 'unavailable' | 'invalid' | 'start_failed' };

export function isCashfreeNativeCheckoutAvailable(): boolean {
  return false;
}

export function getCashfreeUnavailableReason(): string {
  if (Platform.OS === 'web') {
    return 'Cashfree checkout runs in the Mayapur Bazaar Android/iOS app.';
  }
  if (Constants.appOwnership === 'expo') {
    return 'Opening Cashfree secure WebView checkout…';
  }
  return 'Opening Cashfree secure WebView checkout…';
}

/** No-op: native SDK callbacks are unused while WebView checkout is the path. */
export function bindCashfreeCheckoutCallbacks(_callbacks: CashfreeCheckoutCallbacks): () => void {
  return () => undefined;
}

/**
 * Native SDK start is disabled. Callers should open `/payment-checkout` WebView instead.
 */
export function startCashfreeWebCheckout(_input: {
  paymentSessionId: string;
  orderId: string;
}): CashfreeCheckoutStartResult {
  return {
    ok: false,
    code: 'unavailable',
    message: getCashfreeUnavailableReason(),
  };
}

export function resetCashfreeCheckoutCacheForTests(): void {
  // no-op
}
