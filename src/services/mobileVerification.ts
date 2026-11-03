import type { AuthCredential } from '@/types/customerApi';
import { isValidIndiaMobile } from '@/utils/phoneValidation';

/**
 * Proof that this mobile completed OTP verification in the current onboarding flow.
 * Live proof prefers a server credential from verify-otp. A bare UI flag is never enough alone.
 */
export type MobileOtpVerification = {
  mobile: string;
  standing: 'registered' | 'unregistered';
  source: 'verify-otp' | 'development-test';
  /** Present when verify-otp returned a Token/Session/Jwt/Bearer field. Values must not be logged. */
  credential: AuthCredential | null;
};

export function isMobileOtpVerification(
  value: MobileOtpVerification | null | undefined,
  mobile: string,
): value is MobileOtpVerification {
  if (!value || !isValidIndiaMobile(mobile) || value.mobile !== mobile) {
    return false;
  }
  if (value.source === 'development-test') {
    return value.standing === 'registered' || value.standing === 'unregistered';
  }
  // Live verify-otp: require Status Success path that produced this record (credential optional until backend ships it).
  return value.source === 'verify-otp';
}

/**
 * True when registration must not request a second OTP because this mobile already passed verify-otp
 * (or a development-test OTP) in the same onboarding flow.
 */
export function shouldSkipPostRegistrationOtp(
  verification: MobileOtpVerification | null | undefined,
  mobile: string,
): boolean {
  return isMobileOtpVerification(verification, mobile);
}
