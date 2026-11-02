import { readSessionCredential } from '@/services/authSession';
import type { CustomerApiResult, RegisteredCustomer } from '@/types/customerApi';

const MESSAGE_KEYS = ['Message', 'message', 'ExceptionMessage', 'error_description', 'title'] as const;
const FAILURE_STATUS = /^(false|fail|failed|error|invalid|expired|unsuccessful)$/i;
const NOT_REGISTERED = /customer is not registered/i;
const ALREADY_REGISTERED = /already registered|duplicate mobile|mobile number already/i;
const OTP_PROBLEM = /invalid otp|incorrect otp|otp expired|otp is expired|expired otp|already used/i;
const OTP_DISPATCHED = /otp (has been |is |was )?sent|verification code (has been |is |was )?sent|code (has been |is |was )?sent/i;
const OTP_VERIFIED = /otp (has been |is |was )?(verified|matched|validated)|verified successfully|verification successful|login successful/i;

/** True when the server text says the code was verified. A customer id in the same body is not included here. */
export function isOtpVerifiedMessage(message: string): boolean {
  return OTP_VERIFIED.test(message);
}

/** True only for Status/status "Success". A Success boolean is not this field. */
export function hasSuccessStatus(body: unknown): boolean {
  const record = firstRecord(normalizeBody(body));
  if (!record) {
    return false;
  }
  for (const key of ['Status', 'status'] as const) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().toLowerCase() === 'success') {
      return true;
    }
  }
  return false;
}
const REGISTERED = /customer registered successfully/i;

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

function readableText(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0 || /<!doctype html|<html[\s>]/i.test(trimmed)) {
    return null;
  }
  return trimmed.slice(0, 180);
}

function normalizeBody(body: unknown): unknown {
  if (typeof body !== 'string') {
    return body;
  }
  const trimmed = body.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return body;
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return body;
  }
}

const SESSION_KEY = /token|session|jwt|bearer/i;

/** Names of credential fields in a response. Values are never returned. */
export function sessionFieldNames(body: unknown): string[] {
  const record = firstRecord(normalizeBody(body));
  if (!record) {
    return [];
  }
  return Object.keys(record).filter((key) => {
    const value = record[key];
    return SESSION_KEY.test(key) && value !== null && value !== undefined && value !== '';
  });
}

/** Server Message text for a toast. A 6-digit code inside the text is masked. */
export function safeServerMessage(body: unknown): string | null {
  const text = readMessage(normalizeBody(body));
  if (!text) {
    return null;
  }
  return text.replace(/\b\d{6}\b/g, '******');
}

function readMessage(body: unknown): string | null {
  if (typeof body === 'string') {
    return readableText(body);
  }

  const record = firstRecord(body);
  if (!record) {
    return null;
  }

  for (const key of MESSAGE_KEYS) {
    const value = record[key];
    if (typeof value === 'string') {
      const text = readableText(value);
      if (text) {
        return text;
      }
    }
  }

  for (const key of ['error', 'Error']) {
    const value = record[key];
    if (typeof value === 'string') {
      const text = readableText(value);
      if (text) {
        return text;
      }
    }
    const nested = asRecord(value);
    const nestedMessage = nested?.message ?? nested?.Message;
    if (typeof nestedMessage === 'string') {
      const text = readableText(nestedMessage);
      if (text) {
        return text;
      }
    }
  }

  return null;
}

function explicitFailure(body: unknown): boolean {
  const record = firstRecord(body);
  if (!record) {
    return false;
  }

  for (const key of ['Success', 'success', 'IsSuccess', 'isSuccess']) {
    if (record[key] === false) {
      return true;
    }
  }

  for (const key of ['Status', 'status', 'Result', 'result']) {
    const value = record[key];
    if (value === false) {
      return true;
    }
    if (typeof value === 'string' && FAILURE_STATUS.test(value.trim())) {
      return true;
    }
  }

  return false;
}

/**
 * HTTP 200 is not enough. Failures from this API also arrive as HTTP 200 with Status "Failed".
 * A step is accepted only when the message says the code was sent, or verify-otp returns Status Success.
 */
function textField(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

/** Reads the customer record the register endpoint returns with a confirmed account. */
export function readRegisteredCustomer(body: unknown): RegisteredCustomer | null {
  const record = firstRecord(normalizeBody(body));
  if (!record) {
    return null;
  }
  const customerId = textField(record.CustomerId ?? record.customerId);
  const name = textField(record.Name ?? record.name);
  const mobile = textField(record.Mobile ?? record.mobile);
  if (!customerId || !name || !mobile) {
    return null;
  }
  return {
    customerId,
    name,
    mobile,
    companyMobile: textField(record.CompanyMobile ?? record.companyMobile),
  };
}

function statusFallback(status: number, fallback: string): string {
  if (status >= 400 && status < 600) {
    return `The server could not complete the request (HTTP ${status}).`;
  }
  return fallback;
}

export function interpretCustomerResponse(status: number, body: unknown, fallback: string): CustomerApiResult {
  const normalized = normalizeBody(body);
  const serverMessage = readMessage(normalized);

  if (serverMessage && NOT_REGISTERED.test(serverMessage)) {
    return {
      tone: 'info',
      message: serverMessage,
      confirmed: false,
      next: 'register',
    };
  }

  if (serverMessage && ALREADY_REGISTERED.test(serverMessage)) {
    return {
      tone: 'error',
      message: serverMessage,
      confirmed: false,
      next: 'stay',
    };
  }

  if (serverMessage && OTP_PROBLEM.test(serverMessage)) {
    return {
      tone: 'error',
      message: serverMessage,
      confirmed: false,
      next: 'stay',
    };
  }

  if (status === 0) {
    return {
      tone: 'error',
      message: serverMessage ?? 'Unable to connect. Please try again.',
      confirmed: false,
      next: 'stay',
    };
  }

  if (status < 200 || status >= 300 || explicitFailure(normalized)) {
    return {
      tone: 'error',
      message: serverMessage ?? statusFallback(status, fallback),
      confirmed: false,
      next: 'stay',
    };
  }

  const registered = readRegisteredCustomer(normalized);
  if (serverMessage && REGISTERED.test(serverMessage) && registered) {
    return {
      tone: 'success',
      message: serverMessage,
      confirmed: true,
      next: 'otp',
      customer: registered,
    };
  }

  const dispatched = Boolean(serverMessage && OTP_DISPATCHED.test(serverMessage));
  const verified = Boolean(serverMessage && OTP_VERIFIED.test(serverMessage));

  if (dispatched) {
    return {
      tone: 'success',
      message: serverMessage ?? 'OTP sent successfully',
      confirmed: true,
      next: 'otp',
    };
  }

  if (verified) {
    const credential = readSessionCredential(normalized);
    const customer = readRegisteredCustomer(normalized) ?? undefined;
    if (hasSuccessStatus(normalized)) {
      return {
        tone: 'success',
        message: serverMessage ?? 'OTP verified successfully',
        confirmed: true,
        next: 'home',
        customer,
        localLogin: 'temporary-ui',
      };
    }
    if (!credential) {
      return {
        tone: 'warning',
        message: serverMessage
          ? `${serverMessage} The server did not return a sign-in session.`
          : 'The server did not return a sign-in session.',
        confirmed: false,
        next: 'stay',
        customer,
      };
    }
    return {
      tone: 'warning',
      message: serverMessage ?? 'The server did not return Status Success.',
      confirmed: false,
      next: 'stay',
      customer,
    };
  }

  return {
    tone: 'warning',
    message: serverMessage
      ? serverMessage
      : "Couldn't confirm that. Please try again.",
    confirmed: false,
    next: 'stay',
  };
}
