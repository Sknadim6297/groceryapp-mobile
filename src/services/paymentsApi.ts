import { PAYMENT_API } from '@/constants/api';
import { getJson, postJson } from '@/services/api/http';
import { safeServerMessage } from '@/services/api/interpretCustomerResponse';
import type {
  CashfreePaymentCreateRequest,
  CashfreePaymentCreateResult,
  CashfreePaymentVerifyResult,
} from '@/types/cashfreePayment';
import { mapVerifyOutcome } from '@/utils/paymentStatus';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function firstRecord(body: unknown): Record<string, unknown> | null {
  if (Array.isArray(body)) {
    return asRecord(body[0]);
  }
  return asRecord(body);
}

function textField(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
}

function numberField(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function isSuccessStatus(status: string | null): boolean {
  return Boolean(status && status.trim().toLowerCase() === 'success');
}

/**
 * POST /api/values/PaymentGatway
 * Backend creates the Cashfree order with server credentials and returns payment_session_id.
 */
export async function createCashfreePaymentOrder(
  request: CashfreePaymentCreateRequest,
): Promise<CashfreePaymentCreateResult> {
  const amount = Number(request.Amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { status: 'Failed', message: 'A valid payable amount is required.' };
  }
  const phone = request.CustomerPhone.trim();
  if (phone.length < 10) {
    return { status: 'Failed', message: 'A valid mobile number is required for payment.' };
  }

  const payload: CashfreePaymentCreateRequest = {
    CustomerId: request.CustomerId.trim() || phone,
    CustomerName: request.CustomerName.trim() || 'Mayapur Bazaar Customer',
    CustomerEmail: request.CustomerEmail.trim(),
    CustomerPhone: phone,
    Amount: amount,
  };

  const result = await postJson(PAYMENT_API.create, payload);
  const record = firstRecord(result.body);
  const status = textField(record?.Status, record?.status) ?? (result.status >= 200 && result.status < 300 ? 'Unknown' : 'Failed');
  const message =
    safeServerMessage(result.body) ??
    textField(record?.Message, record?.message) ??
    (result.status === 0 ? 'Unable to connect. Please try again.' : 'Could not create payment order.');

  if (!isSuccessStatus(status)) {
    return {
      status: status === 'Failed' || status === 'Error' ? (status as 'Failed' | 'Error') : 'Failed',
      message,
    };
  }

  const orderId = textField(record?.OrderId, record?.orderId, record?.order_id);
  const paymentSessionId = textField(
    record?.PaymentSessionId,
    record?.paymentSessionId,
    record?.payment_session_id,
  );
  const orderAmount = numberField(record?.OrderAmount, record?.orderAmount, record?.Amount, record?.amount) ?? amount;
  const currency = textField(record?.Currency, record?.currency) ?? 'INR';

  if (!orderId || !paymentSessionId) {
    return {
      status: 'Failed',
      message: 'Payment order response was incomplete. No charge was started.',
    };
  }

  return {
    status: 'Success',
    message: message || 'Payment order created successfully.',
    orderId,
    paymentSessionId,
    orderAmount,
    currency,
  };
}

/**
 * GET /api/values/VerifyPayment?order_id=
 * Server verifies with Cashfree — never trust the client SDK callback alone.
 */
export async function verifyCashfreePayment(orderId: string): Promise<CashfreePaymentVerifyResult> {
  const id = orderId.trim();
  if (!id) {
    return {
      apiStatus: 'Failed',
      orderId: '',
      paymentStatus: 'UNKNOWN',
      rawPaymentStatus: null,
      amount: null,
      currency: null,
      message: 'Order id is required for verification.',
      outcome: 'unknown',
      isPaid: false,
    };
  }

  const result = await getJson(PAYMENT_API.verify, { order_id: id });
  const record = firstRecord(result.body);
  const apiStatus = textField(record?.Status, record?.status) ?? (result.status === 0 ? 'Failed' : 'Unknown');
  const rawPaymentStatus = textField(
    record?.PaymentStatus,
    record?.paymentStatus,
    record?.payment_status,
    record?.OrderStatus,
    record?.order_status,
  );
  const mapped = mapVerifyOutcome({ apiStatus, paymentStatus: rawPaymentStatus });
  const message =
    safeServerMessage(result.body) ??
    textField(record?.Message, record?.message) ??
    (result.status === 0
      ? 'Unable to verify payment right now. Status stays unresolved.'
      : 'Payment verification response was empty.');

  // Network/timeout: keep unresolved — do not mark failed.
  if (result.status === 0) {
    return {
      apiStatus: 'Pending',
      orderId: id,
      paymentStatus: 'ACTIVE',
      rawPaymentStatus,
      amount: numberField(record?.Amount, record?.amount, record?.OrderAmount),
      currency: textField(record?.Currency, record?.currency),
      message,
      outcome: 'pending',
      isPaid: false,
    };
  }

  return {
    apiStatus,
    orderId: textField(record?.OrderId, record?.orderId, record?.order_id) ?? id,
    paymentStatus: mapped.code,
    rawPaymentStatus,
    amount: numberField(record?.Amount, record?.amount, record?.OrderAmount, record?.orderAmount),
    currency: textField(record?.Currency, record?.currency),
    message,
    outcome: mapped.outcome,
    isPaid: mapped.isPaid,
  };
}
