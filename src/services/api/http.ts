import { create, isAxiosError } from 'axios';

import { API_BASE_URL } from '@/constants/api';

const TIMEOUT_MS = 15000;

/** The only HTTP client used for customer authentication. */
export const apiClient = create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  validateStatus: () => true,
});

export type ApiPostResult = {
  status: number;
  body: unknown;
};

const SECRET_KEY = /otp|token|password|authorization|secret|cookie|session|jwt|bearer|exception|stack|customerid|customer_id|^name$/i;
const PHONE_KEY = /mobile|phone|msisdn/i;

function maskDigits(value: string): string {
  return value.replace(/\d{6,}/g, (digits) => `${'*'.repeat(Math.max(digits.length - 2, 4))}${digits.slice(-2)}`);
}

function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return '[truncated]';
  }
  if (typeof value === 'string') {
    return maskDigits(value).slice(0, 180);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 3).map((item) => sanitizeForLog(item, depth + 1));
  }
  if (!value || typeof value !== 'object') {
    return value ?? null;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value).slice(0, 12)) {
    if (SECRET_KEY.test(key)) {
      sanitized[key] = '[redacted]';
    } else if (PHONE_KEY.test(key) && typeof item === 'string') {
      sanitized[key] = maskDigits(item);
    } else {
      sanitized[key] = sanitizeForLog(item, depth + 1);
    }
  }
  return sanitized;
}

function logCustomerCall(method: string, path: string, status: number, detail: unknown, category: string) {
  if (!__DEV__) {
    return;
  }
  const record = detail && typeof detail === 'object' ? (Array.isArray(detail) ? detail[0] : detail) : null;
  const messageField =
    record && typeof record === 'object'
      ? (record as Record<string, unknown>).Message ?? (record as Record<string, unknown>).message
      : typeof detail === 'string'
        ? detail
        : null;
  console.info('[customer-api]', {
    method,
    endpoint: path,
    status,
    category,
    shape: Array.isArray(detail) ? 'array' : detail === null || detail === undefined ? 'empty' : typeof detail,
    message: typeof messageField === 'string' ? maskDigits(messageField).slice(0, 180) : null,
    body: sanitizeForLog(detail),
  });
}

async function requestJson(
  method: 'get' | 'post',
  path: string,
  body?: unknown,
  query?: Record<string, string>,
): Promise<ApiPostResult> {
  if (!API_BASE_URL.startsWith('https://')) {
    return { status: 0, body: { message: 'The API address must use HTTPS.' } };
  }

  try {
    const response =
      method === 'post'
        ? await apiClient.post<unknown>(path, body)
        : await apiClient.get<unknown>(path, { params: query });
    const payload = response.data ?? null;
    logCustomerCall(method.toUpperCase(), path, response.status, payload, 'http');
    return { status: response.status, body: payload };
  } catch (error) {
    const timedOut = isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT');
    const category = timedOut ? 'timeout' : isAxiosError(error) ? 'network' : 'unknown';
    const message = timedOut ? 'The request timed out. Please try again.' : 'Unable to connect. Please try again.';
    logCustomerCall(method.toUpperCase(), path, 0, { category, message }, category);
    return { status: 0, body: { message } };
  }
}

export async function postJson(path: string, body: unknown): Promise<ApiPostResult> {
  return requestJson('post', path, body);
}

/** Not used for OTP. Send, resend, and verify are POST only. */
export async function getJson(path: string, query: Record<string, string>): Promise<ApiPostResult> {
  return requestJson('get', path, undefined, query);
}
