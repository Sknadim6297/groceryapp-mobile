import type { OtpAvailability } from '@/types/auth';

export const OTP_UNAVAILABLE_MESSAGE =
  'OTP sending is not available yet. No verification code will be sent.';

export const OTP_VERIFY_UNAVAILABLE_MESSAGE =
  'OTP verification is not available yet. This code cannot be checked.';

export const OTP_RESEND_UNAVAILABLE_MESSAGE =
  'Resend is not available yet. No verification code will be sent.';

export type OtpStartResult = {
  status: OtpAvailability;
  message: string;
};

/**
 * OTP delivery is not connected.
 * This does not call customer registration and does not send a code.
 */
export function startOtpVerification(): OtpStartResult {
  return {
    status: 'unavailable',
    message: OTP_UNAVAILABLE_MESSAGE,
  };
}

/** Does not accept or record the code, and does not call a verification API. */
export function verifyOtpCode(): OtpStartResult {
  return {
    status: 'unavailable',
    message: OTP_VERIFY_UNAVAILABLE_MESSAGE,
  };
}

/** Does not send another code. */
export function resendOtpCode(): OtpStartResult {
  return {
    status: 'unavailable',
    message: OTP_RESEND_UNAVAILABLE_MESSAGE,
  };
}
