import type { AuthTone, CustomerApiResult } from '@/types/customerApi';

const MESSAGE_KEYS = ['Message', 'message', 'error', 'Error', 'error_description'] as const;
const FAILURE_STATUS = /^(false|fail|failed|error|invalid|expired|unsuccessful)$/i;
const NOT_REGISTERED = /customer is not registered/i;
const ALREADY_REGISTERED = /already registered|duplicate mobile|mobile number already/i;
const OTP_PROBLEM = /invalid otp|incorrect otp|otp expired|otp is expired|expired otp/i;

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

function readMessage(body: unknown): string | null {
  const record = firstRecord(body);
  if (!record) {
    return typeof body === 'string' && body.trim().length > 0 ? body.trim().slice(0, 180) : null;
  }

  for (const key of MESSAGE_KEYS) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim().slice(0, 180);
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
 * HTTP 200 is not treated as success. The help pages describe the response only as
 * "Collection of Object" and do not publish a success or session sample.
 */
export function interpretCustomerResponse(status: number, body: unknown, fallback: string): CustomerApiResult {
  const serverMessage = readMessage(body);

  if (serverMessage && NOT_REGISTERED.test(serverMessage)) {
    return {
      tone: 'info',
      message: "Let's create your account",
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

  if (status < 200 || status >= 300 || explicitFailure(body)) {
    return {
      tone: 'error',
      message: serverMessage ?? fallback,
      confirmed: false,
      next: 'stay',
    };
  }

  const tone: AuthTone = 'warning';
  return {
    tone,
    message: serverMessage
      ? serverMessage
      : 'The server replied, but the API help page does not confirm this step.',
    confirmed: false,
    next: 'stay',
  };
}
