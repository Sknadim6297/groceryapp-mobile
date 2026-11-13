import type {
  CashfreePaymentStatusCode,
  VerifiedPaymentOutcome,
} from '@/types/cashfreePayment';

const PAID = /^(paid|success|successful|completed)$/i;
const ACTIVE = /^(active|pending|not[_ ]?paid|initiated|new)$/i;
const FAILED = /^(failed|fail|failure|declined|unsuccessful)$/i;
const EXPIRED = /^(expired|timeout|timed[_ ]?out)$/i;
const DROPPED = /^(user[_ ]?dropped|cancelled|canceled|aborted|dropped)$/i;

export function normalizeCashfreePaymentStatus(
  raw: string | null | undefined,
): CashfreePaymentStatusCode {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) {
    return 'UNKNOWN';
  }
  if (PAID.test(value)) {
    return 'PAID';
  }
  if (FAILED.test(value)) {
    return 'FAILED';
  }
  if (EXPIRED.test(value)) {
    return 'EXPIRED';
  }
  if (DROPPED.test(value)) {
    return 'USER_DROPPED';
  }
  if (ACTIVE.test(value) || value.toUpperCase() === 'ACTIVE') {
    return 'ACTIVE';
  }
  if (/^pending$/i.test(value)) {
    return 'PENDING';
  }
  return 'UNKNOWN';
}

/**
 * Map backend verify payload into a safe UI outcome.
 * Never treats ACTIVE / Pending as paid.
 */
export function mapVerifyOutcome(input: {
  apiStatus: string | null | undefined;
  paymentStatus: string | null | undefined;
}): { code: CashfreePaymentStatusCode; outcome: VerifiedPaymentOutcome; isPaid: boolean } {
  const code = normalizeCashfreePaymentStatus(input.paymentStatus);
  const api = (input.apiStatus ?? '').trim().toLowerCase();

  if (code === 'PAID') {
    return { code, outcome: 'paid', isPaid: true };
  }
  if (code === 'FAILED') {
    return { code, outcome: 'failed', isPaid: false };
  }
  if (code === 'EXPIRED') {
    return { code, outcome: 'expired', isPaid: false };
  }
  if (code === 'USER_DROPPED') {
    return { code, outcome: 'cancelled', isPaid: false };
  }
  if (code === 'ACTIVE' || code === 'PENDING') {
    return { code, outcome: 'pending', isPaid: false };
  }

  // API said Failed without a clear payment status — keep unresolved if message is soft.
  if (api === 'pending' || api === 'success') {
    return { code: 'UNKNOWN', outcome: 'pending', isPaid: false };
  }
  if (api === 'failed' || api === 'fail' || api === 'error') {
    return { code: 'UNKNOWN', outcome: 'unknown', isPaid: false };
  }

  return { code: 'UNKNOWN', outcome: 'unknown', isPaid: false };
}

export function paymentOutcomeTitle(outcome: VerifiedPaymentOutcome): string {
  switch (outcome) {
    case 'paid':
      return 'Payment Successful';
    case 'pending':
      return 'Payment Pending';
    case 'failed':
      return 'Payment Failed';
    case 'expired':
      return 'Payment Expired';
    case 'cancelled':
      return 'Payment Cancelled';
    default:
      return 'Verifying Payment';
  }
}

export function paymentOutcomeBody(outcome: VerifiedPaymentOutcome, message?: string | null): string {
  const server = typeof message === 'string' && message.trim().length > 0 ? message.trim() : null;
  switch (outcome) {
    case 'paid':
      return server ?? 'Your payment was verified successfully.';
    case 'pending':
      return (
        server ??
        'Payment is not completed yet. You can check again in a moment — we will not mark this as paid until the server confirms it.'
      );
    case 'failed':
      return server ?? 'Payment did not go through. You can retry or choose another method.';
    case 'expired':
      return server ?? 'This payment session expired. Start a new payment from checkout.';
    case 'cancelled':
      return server ?? 'Payment was cancelled. No charge was completed.';
    default:
      return (
        server ??
        'We could not confirm the payment status yet. Keep this order unresolved and check again.'
      );
  }
}

/** Bounded poll delays (ms). Total wait stays under ~40s. */
export const PAYMENT_VERIFY_POLL_DELAYS_MS = [2000, 3000, 4000, 5000, 5000, 5000, 5000, 5000] as const;

export function nextPaymentPollDelayMs(attemptIndex: number): number | null {
  if (attemptIndex < 0 || attemptIndex >= PAYMENT_VERIFY_POLL_DELAYS_MS.length) {
    return null;
  }
  return PAYMENT_VERIFY_POLL_DELAYS_MS[attemptIndex] ?? null;
}
