/**
 * Friendly copy when register returns an already-registered mobile.
 * Early send-otp detection should prevent this; this is the safety net only.
 */
export const ALREADY_REGISTERED_LOGIN_MESSAGE = 'This number already has an account. Please log in.';

export type AlreadyRegisteredRecovery = {
  nationalNumber: string;
  standing: 'registered';
  otpDispatched: false;
  mobileVerification: null;
};
