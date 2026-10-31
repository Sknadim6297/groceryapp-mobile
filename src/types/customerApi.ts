/** Request bodies taken from the ASP.NET help pages. Response samples are not published. */

export type CustomerOtpRequest = {
  Mobile: string;
};

export type CustomerOtpVerifyRequest = {
  Mobile: string;
  OTP: string;
};

/**
 * Only fields the app already collects.
 * Company mobile, WhatsApp, anniversary, and GST are omitted because this app does not ask for them.
 */
export type CustomerRegistrationRequest = {
  Mobile: string;
  Name: string;
  Email: string;
  Address?: string;
  DOB?: string;
  Country?: string;
  State?: string;
  City?: string;
  Pincode?: string;
};

export type AuthTone = 'success' | 'error' | 'warning' | 'info';

export type CustomerAuthNext = 'stay' | 'register';

export type CustomerApiResult = {
  tone: AuthTone;
  message: string;
  /**
   * True only when the published contract says this response completes authentication.
   * The help pages do not publish that contract, so this stays false.
   */
  confirmed: false;
  /** `register` only when the server text says the customer is not registered. */
  next: CustomerAuthNext;
};

export type AuthScreen = 'stay' | 'complete-profile' | 'otp' | 'home';

/** Shared by the login screen and the fixture tests. HTTP 200 never opens Home. */
export function screenAfterCustomerCall(
  result: CustomerApiResult,
  step: 'send' | 'verify' | 'register',
): AuthScreen {
  if (step === 'send' && result.next === 'register') {
    return 'complete-profile';
  }
  if (result.confirmed && step === 'send') {
    return 'otp';
  }
  if (result.confirmed && step === 'verify') {
    return 'home';
  }
  return 'stay';
}
