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

/** Customer fields returned by a confirmed registration. This is not a login token. */
export type RegisteredCustomer = {
  customerId: string;
  name: string;
  mobile: string;
  companyMobile: string | null;
};

export type AuthTone = 'success' | 'error' | 'warning' | 'info';

export type CustomerAuthNext = 'stay' | 'register' | 'otp' | 'home';

export type CustomerApiResult = {
  tone: AuthTone;
  message: string;
  /**
   * True when this response accepts the current step.
   * HTTP 200 alone does not set this. A failure status does not set this.
   */
  confirmed: boolean;
  /**
   * `register` when the server says the customer is not registered.
   * `otp` when a code was sent.
   * `home` when this step is accepted for an existing customer or a finished registration.
   */
  next: CustomerAuthNext;
  /** Present only when registration returned a customer id and name. */
  customer?: RegisteredCustomer;
};

export type AuthScreen = 'stay' | 'complete-profile' | 'otp' | 'home';

/**
 * Login always asks for the 6-digit code before Home.
 * A new customer opens registration. An accepted code opens Home.
 */
export function screenAfterCustomerCall(
  result: CustomerApiResult,
  step: 'send' | 'verify' | 'register',
): AuthScreen {
  if (result.next === 'register' && step !== 'register') {
    return 'complete-profile';
  }
  if (step === 'send' && result.next === 'otp') {
    return 'otp';
  }
  if ((step === 'verify' || step === 'register') && result.next === 'home') {
    return 'home';
  }
  return 'stay';
}
