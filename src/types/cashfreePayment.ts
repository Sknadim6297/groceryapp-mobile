/**
 * Types for live Cashfree payment APIs published on api.supertrading.online Help.
 * Request field names match CashfreePaymentRequest exactly.
 */

export type CashfreePaymentCreateRequest = {
  CustomerId: string;
  CustomerName: string;
  CustomerEmail: string;
  CustomerPhone: string;
  Amount: number;
};

export type CashfreePaymentCreateSuccess = {
  status: 'Success';
  message: string;
  orderId: string;
  paymentSessionId: string;
  orderAmount: number;
  currency: string;
};

export type CashfreePaymentCreateFailure = {
  status: 'Failed' | 'Error' | 'Unknown';
  message: string;
};

export type CashfreePaymentCreateResult = CashfreePaymentCreateSuccess | CashfreePaymentCreateFailure;

/**
 * Cashfree order-level payment status as returned by VerifyPayment.
 * ACTIVE means the order is open — never treat it as paid.
 */
export type CashfreePaymentStatusCode =
  | 'PAID'
  | 'ACTIVE'
  | 'FAILED'
  | 'EXPIRED'
  | 'USER_DROPPED'
  | 'PENDING'
  | 'UNKNOWN';

export type VerifiedPaymentOutcome =
  | 'paid'
  | 'pending'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'unknown';

export type CashfreePaymentVerifyResult = {
  /** Top-level API Status (Success / Pending / Failed). */
  apiStatus: string;
  orderId: string;
  paymentStatus: CashfreePaymentStatusCode;
  rawPaymentStatus: string | null;
  amount: number | null;
  currency: string | null;
  message: string;
  outcome: VerifiedPaymentOutcome;
  /** True only when backend confirms PAID. */
  isPaid: boolean;
};

export type PendingPaymentSnapshot = {
  orderId: string;
  paymentSessionId: string;
  amount: number;
  currency: string;
  createdAt: number;
  customerPhone: string;
  addressTitle: string;
  addressLine: string;
  itemSummary: { id: string; name: string; quantity: number; unit?: string }[];
  /** Prevents double Pay Now for the same session. */
  submitToken: string;
};
