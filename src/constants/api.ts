const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

/** Help pages live on this host. Override with EXPO_PUBLIC_API_BASE_URL if the host changes. */
export const API_BASE_URL = (configured && configured.length > 0 ? configured : 'https://api.supertrading.online').replace(
  /\/+$/,
  '',
);

export const CUSTOMER_API = {
  register: '/api/values/customer/register',
  sendOtp: '/api/values/customer/send-otp',
  resendOtp: '/api/values/customer/resend-otp',
  verifyOtp: '/api/values/customer/verify-otp',
} as const;
