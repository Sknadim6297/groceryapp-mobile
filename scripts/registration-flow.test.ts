import { locationContinueTarget } from '../src/navigation/locationFlow';
import { buildCustomerRegistration } from '../src/services/customerAuth';
import { shouldSkipPostRegistrationOtp } from '../src/services/mobileVerification';
import { isProfileNameReady } from '../src/services/registrationSubmission';
import { registrationFollowUp } from '../src/types/customerApi';

if (isProfileNameReady('') || isProfileNameReady('  ')) {
  throw new Error('empty name must not be ready');
}
if (!isProfileNameReady('Asha')) {
  throw new Error('non-empty name must be ready');
}

// 1–3. Unregistered → Personal Information → Location Done with name → submit-registration
const afterLocation = locationContinueTarget({
  intent: 'registration',
  canGoBack: true,
  signedIn: false,
  onboarding: true,
  profileNameReady: true,
});
if (afterLocation !== 'submit-registration') {
  throw new Error('Location Done with ready name must submit registration, not reopen Personal Information');
}

const beforeName = locationContinueTarget({
  intent: 'registration',
  canGoBack: true,
  signedIn: false,
  onboarding: true,
  profileNameReady: false,
});
if (beforeName !== '/complete-profile') {
  throw new Error('Location without a name must open Personal Information');
}

// Name required, email optional in registration body builder
const needsName = buildCustomerRegistration({
  mobile: '6000000000',
  name: '',
  email: '',
  dateOfBirth: null,
  location: {
    id: 'home',
    label: 'Home',
    addressLine1: '12 Market Road',
    city: 'Lucknow',
    source: 'manual',
  },
});
if (needsName.ok) {
  throw new Error('registration must require a name');
}

const optionalEmail = buildCustomerRegistration({
  mobile: '6000000000',
  name: 'Asha',
  email: '',
  dateOfBirth: null,
  location: {
    id: 'home',
    label: 'Home',
    addressLine1: '12 Market Road',
    city: 'Lucknow',
    source: 'manual',
  },
});
if (!optionalEmail.ok || optionalEmail.body.Email !== '') {
  throw new Error('registration must allow empty optional email');
}

const needsAddress = buildCustomerRegistration({
  mobile: '6000000000',
  name: 'Asha',
  email: '',
  dateOfBirth: null,
  location: null,
});
if (needsAddress.ok) {
  throw new Error('registration must require a delivery address from the location flow');
}

const withToken = buildCustomerRegistration({
  mobile: '6000000000',
  name: 'Asha',
  email: '',
  dateOfBirth: null,
  location: {
    id: 'home',
    label: 'Home',
    addressLine1: '12 Market Road',
    city: 'Lucknow',
    source: 'manual',
  },
  mobileVerificationToken: 'server-proof',
});
if (!withToken.ok || withToken.body.MobileVerificationToken !== 'server-proof') {
  throw new Error('registration must forward a server verification token when present');
}

if (
  !shouldSkipPostRegistrationOtp(
    { mobile: '6000000000', standing: 'unregistered', source: 'verify-otp', credential: { mobile: '6000000000', field: 'MobileVerificationToken', value: 'x' } },
    '6000000000',
  )
) {
  throw new Error('verified mobile must skip the post-registration OTP');
}
if (
  shouldSkipPostRegistrationOtp(
    { mobile: '6000000000', standing: 'unregistered', source: 'verify-otp', credential: null },
    '6000000001',
  )
) {
  throw new Error('verification for a different mobile must not skip OTP');
}

const registeredBody = {
  tone: 'success' as const,
  message: 'Customer registered successfully.',
  confirmed: true,
  next: 'otp' as const,
  customer: { customerId: '1', name: 'Asha', mobile: '6000000000', companyMobile: null },
};
if (registrationFollowUp(registeredBody, { mobileAlreadyVerified: true }) !== 'home') {
  throw new Error('verified registration follow-up must be Home');
}
if (registrationFollowUp(registeredBody) !== 'otp') {
  throw new Error('unverified registration follow-up must remain OTP');
}
if (
  registrationFollowUp({
    tone: 'error',
    message: 'This customer mobile number is already registered.',
    confirmed: false,
    next: 'stay',
  }) !== 'login'
) {
  throw new Error('already-registered register response must recover to login');
}

console.log('registration flow rules passed');
