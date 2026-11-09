const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

/** Live HTTPS host from env (or production default). Trailing slashes are stripped. */
export const LIVE_API_BASE_URL = (
  configured && configured.length > 0 ? configured : 'https://api.supertrading.online'
).replace(/\/+$/, '');

/**
 * Axios base URL for native and production web.
 * Expo web development overrides this in `http.ts` to same-origin so Metro can
 * proxy `/api/*` (the live host has no CORS headers; OPTIONS returns 405).
 */
export const API_BASE_URL = LIVE_API_BASE_URL;

export const CUSTOMER_API = {
  register: '/api/values/customer/register',
  update: '/api/values/customer/update',
  sendOtp: '/api/values/customer/send-otp',
  resendOtp: '/api/values/customer/resend-otp',
  verifyOtp: '/api/values/customer/verify-otp',
} as const;

/** Published help page: GET api/values/products?company={company} (Required). */
export const PRODUCTS_API = {
  list: '/api/values/products',
} as const;
