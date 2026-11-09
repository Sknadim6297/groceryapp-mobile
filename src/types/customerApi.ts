/** Request bodies taken from the ASP.NET help pages. Response samples are not published. */

export type CustomerOtpRequest = {
  Mobile: string;
};

export type CustomerOtpVerifyRequest = {
  Mobile: string;
  OTP: string;
};

/**
 * Help-page CustomerRegistration fields the app can fill from collected data.
 * WhatsApp / Anniversary / GST are omitted — this app does not collect them.
 * CompanyMobile is sent only when EXPO_PUBLIC_PRODUCTS_COMPANY is configured.
 */
export type CustomerRegistrationRequest = {
  Mobile: string;
  Name: string;
  Email: string;
  Address?: string;
  CompanyMobile?: string;
  DOB?: string;
  Country?: string;
  State?: string;
  City?: string;
  Pincode?: string;
  /**
   * Optional server proof from OTP-first verify-otp.
   * Sent only when verify-otp returned a Token/Session field. Never invented by the client.
   */
  MobileVerificationToken?: string;
};

/** Help-page CustomerUpdateRequest — address + profile fields the app can sync. */
export type CustomerUpdateRequest = {
  Mobile: string;
  Name?: string;
  Email?: string;
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

const ALREADY_REGISTERED =
  /already registered|duplicate mobile|mobile number already|customer mobile number is already/i;

export type RegistrationFollowUp = 'otp' | 'home' | 'stay' | 'login';

/**
 * A confirmed registration normally requests one OTP (register-then-OTP contract).
 * Duplicate / already-registered must recover to login — never auto-send another OTP.
 * When the mobile was already verified in an OTP-first flow, a confirmed registration
 * (with customer record) opens Home instead of a second OTP.
 */
export function registrationFollowUp(
  result: CustomerApiResult,
  options?: { mobileAlreadyVerified?: boolean },
): RegistrationFollowUp {
  if (ALREADY_REGISTERED.test(result.message)) {
    return 'login';
  }
  if (options?.mobileAlreadyVerified) {
    if (result.localLogin === 'temporary-ui' || result.next === 'home') {
      return 'home';
    }
    if (result.customer && result.confirmed) {
      return 'home';
    }
    return 'stay';
  }
  if (screenAfterCustomerCall(result, 'register') === 'otp') {
    return 'otp';
  }
  return 'stay';
}
