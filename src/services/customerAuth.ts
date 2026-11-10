import { CUSTOMER_API } from '@/constants/api';
import { PRODUCTS_COMPANY } from '@/constants/liveData';
import { postJson } from '@/services/api/http';
import { interpretCustomerResponse, safeServerMessage, sessionFieldNames } from '@/services/api/interpretCustomerResponse';
import { isDevOtpEnabled } from '@/services/devOtp';
import { applyTemporaryUiLogin } from '@/services/temporaryUiLogin';
import type {
  CustomerApiResult,
  CustomerRegistrationRequest,
  CustomerUpdateRequest,
} from '@/types/customerApi';
import type { DeliveryLocation } from '@/types/location';
import { OTP_LENGTH } from '@/types/auth';
import { addressFieldsFromDeliveryLocation } from '@/utils/customerAddressPayload';
import { isValidEmail, parseIsoDate } from '@/utils/profileValidation';
import { isValidIndiaMobile } from '@/utils/phoneValidation';

const INVALID_MOBILE: CustomerApiResult = {
  tone: 'error',
  message: 'Enter a valid 10-digit mobile number.',
  confirmed: false,
  next: 'stay',
};

/** Hard stop: never hit live OTP endpoints while Development OTP mode is on. */
const DEV_OTP_NETWORK_BLOCKED: CustomerApiResult = {
  tone: 'error',
  message: 'Live OTP APIs are blocked while Development OTP mode is on.',
  confirmed: false,
  next: 'stay',
};

const DEV_REGISTER_NETWORK_BLOCKED: CustomerApiResult = {
  tone: 'error',
  message: 'Live registration is blocked while Development OTP mode is on. Demo onboarding only.',
  confirmed: false,
  next: 'stay',
};

function withServerMessage(status: number, body: unknown, fallback: string): CustomerApiResult {
  const result = interpretCustomerResponse(status, body, fallback);
  const exact = safeServerMessage(body);
  if (exact && !result.message.includes(exact)) {
    return { ...result, message: exact };
  }
  return result;
}

function noteSession(path: string, body: unknown) {
  if (typeof __DEV__ === 'undefined' || __DEV__ !== true) {
    return;
  }
  const names = sessionFieldNames(body);
  console.info('[customer-api]', path, names.length === 0 ? 'no session credential' : `session credential fields: ${names.join(', ')}`);
}

export async function sendCustomerOtp(mobile: string): Promise<CustomerApiResult> {
  if (isDevOtpEnabled()) {
    return DEV_OTP_NETWORK_BLOCKED;
  }
  if (!isValidIndiaMobile(mobile)) {
    return INVALID_MOBILE;
  }
  const response = await postJson(CUSTOMER_API.sendOtp, { Mobile: mobile });
  noteSession(CUSTOMER_API.sendOtp, response.body);
  return withServerMessage(response.status, response.body, 'The server did not accept the OTP request.');
}

export async function resendCustomerOtp(mobile: string): Promise<CustomerApiResult> {
  if (isDevOtpEnabled()) {
    return DEV_OTP_NETWORK_BLOCKED;
  }
  if (!isValidIndiaMobile(mobile)) {
    return INVALID_MOBILE;
  }
  const response = await postJson(CUSTOMER_API.resendOtp, { Mobile: mobile });
  noteSession(CUSTOMER_API.resendOtp, response.body);
  return withServerMessage(response.status, response.body, 'The server did not resend a code.');
}

export async function verifyCustomerOtp(mobile: string, otp: string): Promise<CustomerApiResult> {
  if (isDevOtpEnabled()) {
    return DEV_OTP_NETWORK_BLOCKED;
  }
  if (!isValidIndiaMobile(mobile)) {
    return INVALID_MOBILE;
  }
  if (otp.length !== OTP_LENGTH) {
    return { tone: 'error', message: 'Enter the 6-digit code.', confirmed: false, next: 'stay' };
  }
  const response = await postJson(CUSTOMER_API.verifyOtp, { Mobile: mobile, OTP: otp });
  noteSession(CUSTOMER_API.verifyOtp, response.body);
  const result = withServerMessage(response.status, response.body, 'The server did not confirm this code.');
  return applyTemporaryUiLogin(result, response.body, mobile);
}

export function buildCustomerRegistration(input: {
  mobile: string;
  name: string;
  email: string;
  dateOfBirth: string | null;
  location: DeliveryLocation | null;
  /** Server verification token from OTP-first verify-otp. Omitted when absent. */
  mobileVerificationToken?: string;
}): { ok: true; body: CustomerRegistrationRequest } | { ok: false; message: string } {
  const name = input.name.trim();
  const email = input.email.trim();
  if (!isValidIndiaMobile(input.mobile)) {
    return { ok: false, message: 'Enter a valid 10-digit mobile number.' };
  }
  if (name.length === 0) {
    return { ok: false, message: 'Enter your full name.' };
  }
  if (email.length > 0 && !isValidEmail(email)) {
    return { ok: false, message: 'Enter a valid email address.' };
  }

  const addressFields = addressFieldsFromDeliveryLocation(input.location);
  if (!addressFields) {
    return { ok: false, message: 'Select a delivery address before registering.' };
  }

  const body: CustomerRegistrationRequest = {
    Mobile: input.mobile,
    Name: name,
    Email: email,
    ...addressFields,
  };

  if (PRODUCTS_COMPANY) {
    body.CompanyMobile = PRODUCTS_COMPANY;
  }
  if (input.dateOfBirth && parseIsoDate(input.dateOfBirth)) {
    body.DOB = input.dateOfBirth;
  }
  const token = input.mobileVerificationToken?.trim();
  if (token) {
    body.MobileVerificationToken = token;
  }

  return { ok: true, body };
}

export function buildCustomerUpdate(input: {
  mobile: string;
  name?: string;
  email?: string;
  dateOfBirth?: string | null;
  /** Fills Address/Country/State/City/Pincode from the chosen delivery location. */
  location?: DeliveryLocation | null;
}): { ok: true; body: CustomerUpdateRequest } | { ok: false; message: string } {
  if (!isValidIndiaMobile(input.mobile)) {
    return { ok: false, message: 'Enter a valid 10-digit mobile number.' };
  }

  const body: CustomerUpdateRequest = { Mobile: input.mobile };
  const name = input.name?.trim();
  if (name) {
    body.Name = name;
  }
  if (input.email !== undefined) {
    const email = input.email.trim();
    if (email.length > 0 && !isValidEmail(email)) {
      return { ok: false, message: 'Enter a valid email address.' };
    }
    if (email.length > 0) {
      body.Email = email;
    }
  }
  if (input.dateOfBirth && parseIsoDate(input.dateOfBirth)) {
    body.DOB = input.dateOfBirth;
  }

  const addressFields = addressFieldsFromDeliveryLocation(input.location ?? null);
  if (addressFields) {
    Object.assign(body, addressFields);
  }

  const hasExtra = Boolean(body.Name || body.Email || body.DOB || body.Address);
  if (!hasExtra) {
    return { ok: false, message: 'Nothing to update.' };
  }

  return { ok: true, body };
}

export async function registerCustomer(body: CustomerRegistrationRequest): Promise<CustomerApiResult> {
  if (isDevOtpEnabled()) {
    return DEV_REGISTER_NETWORK_BLOCKED;
  }
  const response = await postJson(CUSTOMER_API.register, body);
  return interpretCustomerResponse(response.status, response.body, 'The server did not confirm registration.');
}

export async function updateCustomer(body: CustomerUpdateRequest): Promise<CustomerApiResult> {
  if (isDevOtpEnabled()) {
    return {
      tone: 'info',
      message: 'Live profile update is blocked while Development OTP mode is on.',
      confirmed: false,
      next: 'stay',
    };
  }
  const response = await postJson(CUSTOMER_API.update, body);
  return interpretCustomerResponse(response.status, response.body, 'The server did not confirm the profile update.');
}
