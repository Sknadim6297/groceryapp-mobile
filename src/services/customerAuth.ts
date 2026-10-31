import { CUSTOMER_API } from '@/constants/api';
import { postJson } from '@/services/api/http';
import { interpretCustomerResponse } from '@/services/api/interpretCustomerResponse';
import type { CustomerApiResult, CustomerRegistrationRequest } from '@/types/customerApi';
import type { DeliveryLocation } from '@/types/location';
import { formatDeliveryAddress } from '@/data/referenceLocations';
import { OTP_LENGTH } from '@/types/auth';
import { isValidEmail, parseIsoDate } from '@/utils/profileValidation';
import { isValidIndiaMobile } from '@/utils/phoneValidation';

const INVALID_MOBILE: CustomerApiResult = {
  tone: 'error',
  message: 'Enter a valid 10-digit mobile number.',
  confirmed: false,
  next: 'stay',
};

export async function sendCustomerOtp(mobile: string): Promise<CustomerApiResult> {
  if (!isValidIndiaMobile(mobile)) {
    return INVALID_MOBILE;
  }
  const response = await postJson(CUSTOMER_API.sendOtp, { Mobile: mobile });
  return interpretCustomerResponse(response.status, response.body, 'The server did not accept the OTP request.');
}

export async function resendCustomerOtp(mobile: string): Promise<CustomerApiResult> {
  if (!isValidIndiaMobile(mobile)) {
    return INVALID_MOBILE;
  }
  const response = await postJson(CUSTOMER_API.resendOtp, { Mobile: mobile });
  return interpretCustomerResponse(response.status, response.body, 'The server did not resend a code.');
}

export async function verifyCustomerOtp(mobile: string, otp: string): Promise<CustomerApiResult> {
  if (!isValidIndiaMobile(mobile)) {
    return INVALID_MOBILE;
  }
  if (otp.length !== OTP_LENGTH) {
    return { tone: 'error', message: 'Enter the 6-digit code.', confirmed: false, next: 'stay' };
  }
  const response = await postJson(CUSTOMER_API.verifyOtp, { Mobile: mobile, OTP: otp });
  return interpretCustomerResponse(response.status, response.body, 'The server did not confirm this code.');
}

export function buildCustomerRegistration(input: {
  mobile: string;
  name: string;
  email: string;
  dateOfBirth: string | null;
  location: DeliveryLocation | null;
}): { ok: true; body: CustomerRegistrationRequest } | { ok: false; message: string } {
  const name = input.name.trim();
  const email = input.email.trim();
  if (!isValidIndiaMobile(input.mobile)) {
    return { ok: false, message: 'Enter a valid 10-digit mobile number.' };
  }
  if (name.length === 0) {
    return { ok: false, message: 'Enter your full name.' };
  }
  if (!isValidEmail(email)) {
    return { ok: false, message: 'Enter a valid email address.' };
  }
  if (!input.location) {
    return { ok: false, message: 'Select a delivery address before registering.' };
  }

  const address = formatDeliveryAddress(input.location).trim();
  if (address.length === 0) {
    return { ok: false, message: 'Select a delivery address before registering.' };
  }

  const body: CustomerRegistrationRequest = {
    Mobile: input.mobile,
    Name: name,
    Email: email,
    Address: address,
  };

  if (input.dateOfBirth && parseIsoDate(input.dateOfBirth)) {
    body.DOB = input.dateOfBirth;
  }
  if (input.location.country?.trim()) {
    body.Country = input.location.country.trim();
  }
  if (input.location.state?.trim()) {
    body.State = input.location.state.trim();
  }
  if (input.location.city?.trim()) {
    body.City = input.location.city.trim();
  }
  if (input.location.postalCode?.trim()) {
    body.Pincode = input.location.postalCode.trim();
  }

  return { ok: true, body };
}

export async function registerCustomer(body: CustomerRegistrationRequest): Promise<CustomerApiResult> {
  const response = await postJson(CUSTOMER_API.register, body);
  return interpretCustomerResponse(response.status, response.body, 'The server did not confirm registration.');
}
