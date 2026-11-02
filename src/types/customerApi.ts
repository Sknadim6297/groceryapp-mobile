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

/** A credential the server returned. CustomerId is never stored here. */
export type AuthCredential = {
  mobile: string;
  field: string;
  value: string;
};

/**
 * TEMPORARY device sign-in.
 * Written only after verify-otp returns Status Success.
 * Not a backend token, and not sent on later API requests.
 */
export type TemporaryUiLogin = {
  basis: 'temporary-ui';
  mobile: string;
  customerId: string;
  name: string;
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
   * `otp` when a code was sent, or when registration succeeded and the code is still required.
   * `home` when verify-otp returns Status Success. That opens a temporary device login, not a backend session.
   */
  next: CustomerAuthNext;
  /** Present only when registration returned a customer id and name. */
  customer?: RegisteredCustomer;
    /** Present only when verify-otp returned a non-empty session credential. The UI does not store this as login. */
  session?: AuthCredential;
  /**
   * TEMPORARY local UI sign-in. Set only after verify-otp returns Status Success.
   * This is not a backend session and must not be sent as Authorization.
   */
  localLogin?: 'temporary-ui';
  /** Device login built from the verified mobile and any CustomerId and Name in that response. */
  temporaryLogin?: TemporaryUiLogin;
};

export type AuthScreen = 'stay' | 'complete-profile' | 'otp' | 'home';

/**
 * A dispatched code opens OTP. Registration does not open Home.
 * Home opens only after verify-otp returns Status Success.
 * A token is not required, and a token alone is not enough.
 */
export function screenAfterCustomerCall(
  result: CustomerApiResult,
  step: 'send' | 'verify' | 'register',
): AuthScreen {
  if (result.next === 'register' && step !== 'register') {
    return 'complete-profile';
  }
  if (result.next === 'otp' && (step === 'send' || step === 'register')) {
    return 'otp';
  }
  if (step === 'verify' && result.localLogin === 'temporary-ui') {
    return 'home';
  }
  return 'stay';
}

const DUPLICATE_CUSTOMER = /already registered|duplicate mobile|mobile number already/i;

/**
 * A confirmed registration, or a duplicate mobile, requests one OTP.
 * Anything else stays so the customer can correct the form and try again.
 */
export function registrationFollowUp(result: CustomerApiResult): 'otp' | 'stay' {
  if (screenAfterCustomerCall(result, 'register') === 'otp' || DUPLICATE_CUSTOMER.test(result.message)) {
    return 'otp';
  }
  return 'stay';
}
