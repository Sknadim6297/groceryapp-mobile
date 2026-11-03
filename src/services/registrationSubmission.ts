import { ALREADY_REGISTERED_LOGIN_MESSAGE } from '@/navigation/alreadyRegisteredRecovery';
import { isAlreadyRegisteredMessage } from '@/services/api/interpretCustomerResponse';
import { buildCustomerRegistration, registerCustomer, sendCustomerOtp } from '@/services/customerAuth';
import { isDevOtpEnabled, promoteDevTestSessionToHome } from '@/services/devOtp';
import { shouldSkipPostRegistrationOtp, type MobileOtpVerification } from '@/services/mobileVerification';
import { buildTemporaryUiLogin } from '@/services/temporaryUiLogin';
import type { CustomerApiResult } from '@/types/customerApi';
import { registrationFollowUp, screenAfterCustomerCall } from '@/types/customerApi';
import type { DeliveryLocation } from '@/types/location';
import { isValidEmail } from '@/utils/profileValidation';
import { isValidIndiaMobile } from '@/utils/phoneValidation';

export type RegistrationDraftInput = {
  mobile: string;
  name: string;
  email: string;
  dateOfBirth: string | null;
  location: DeliveryLocation | null;
  /** Present only after OTP was verified for this mobile in the current flow. */
  mobileVerification?: MobileOtpVerification | null;
};

export type RegistrationSubmissionResult =
  | {
      ok: true;
      next: 'otp' | 'home';
      message: string;
      customer: CustomerApiResult['customer'];
      temporaryLogin?: CustomerApiResult['temporaryLogin'];
    }
  | {
      ok: false;
      message: string;
      reason: 'validation' | 'register' | 'otp' | 'already-registered';
    };

/**
 * Builds and posts registration once.
 * Requests OTP only when the backend still requires it and this mobile was not already OTP-verified.
 * Already-registered responses recover to login — they do not auto-send OTP or invent Home.
 *
 * Development OTP mode never posts register or send-otp. It finishes a local demo session only.
 */
export async function submitRegistrationThenOtp(
  input: RegistrationDraftInput,
): Promise<RegistrationSubmissionResult> {
  const name = input.name.trim();
  const email = input.email.trim();

  if (!isValidIndiaMobile(input.mobile)) {
    return { ok: false, message: 'Enter a valid 10-digit mobile number.', reason: 'validation' };
  }
  if (name.length === 0) {
    return { ok: false, message: 'Enter your full name.', reason: 'validation' };
  }
  if (email.length > 0 && !isValidEmail(email)) {
    return { ok: false, message: 'Enter a valid email address.', reason: 'validation' };
  }

  if (!input.location) {
    return { ok: false, message: 'Select a delivery address before registering.', reason: 'validation' };
  }

  // Development OTP: demo onboarding only — zero live register / OTP network calls.
  if (isDevOtpEnabled()) {
    const promoted = promoteDevTestSessionToHome(input.mobile);
    if (!promoted) {
      return {
        ok: false,
        message: 'No development session is active. Request a Development OTP from Login first.',
        reason: 'register',
      };
    }
    return {
      ok: true,
      next: 'home',
      message: 'Development demo registration complete. No live account or SMS was created.',
      customer: {
        customerId: 'development-demo',
        name,
        mobile: input.mobile,
        companyMobile: null,
      },
      // Intentionally omit temporaryLogin — demo Home uses development-test session only.
    };
  }

  const alreadyVerified = shouldSkipPostRegistrationOtp(input.mobileVerification ?? null, input.mobile);
  const verificationToken =
    alreadyVerified && input.mobileVerification?.credential?.value
      ? input.mobileVerification.credential.value
      : undefined;

  const registration = buildCustomerRegistration({
    mobile: input.mobile,
    name,
    email,
    dateOfBirth: input.dateOfBirth,
    location: input.location,
    mobileVerificationToken: verificationToken,
  });
  if (!registration.ok) {
    return { ok: false, message: registration.message, reason: 'validation' };
  }

  const result = await registerCustomer(registration.body);
  const followUp = registrationFollowUp(result, { mobileAlreadyVerified: alreadyVerified });

  if (followUp === 'login' || isAlreadyRegisteredMessage(result.message)) {
    return {
      ok: false,
      message: ALREADY_REGISTERED_LOGIN_MESSAGE,
      reason: 'already-registered',
    };
  }

  if (alreadyVerified) {
    if (followUp === 'home' && result.customer) {
      const temporaryLogin = buildTemporaryUiLogin(input.mobile, result.customer);
      if (!temporaryLogin) {
        return {
          ok: false,
          message: result.message || 'Registration succeeded, but sign-in could not be established.',
          reason: 'register',
        };
      }
      return {
        ok: true,
        next: 'home',
        message: result.message || 'Registration complete.',
        customer: result.customer,
        temporaryLogin,
      };
    }
    return {
      ok: false,
      message: result.message || 'Registration could not be completed.',
      reason: 'register',
    };
  }

  if (followUp !== 'otp') {
    return {
      ok: false,
      message: result.message || 'Registration could not be completed.',
      reason: 'register',
    };
  }

  const otp = await sendCustomerOtp(input.mobile);
  if (screenAfterCustomerCall(otp, 'send') !== 'otp') {
    return {
      ok: false,
      message: otp.message || 'Registration succeeded, but the verification code could not be sent.',
      reason: 'otp',
    };
  }

  return {
    ok: true,
    next: 'otp',
    message: otp.message || result.message,
    customer: result.customer,
  };
}

export function isProfileNameReady(name: string): boolean {
  return name.trim().length > 0;
}
