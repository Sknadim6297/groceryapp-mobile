import {
  canEnterHome,
  clearAuthSession,
  installSessionStoreForTests,
  loadAuthSession,
  parseStoredSession,
  saveAuthSession,
} from '../src/services/authSession';
import { interpretCustomerResponse, safeServerMessage, sessionFieldNames } from '../src/services/api/interpretCustomerResponse';
import {
  clearRememberedCustomer,
  displayCustomer,
  installRememberedStoreForTests,
  loadRememberedCustomer,
  parseRememberedCustomer,
  profileFromVerifiedOtp,
  saveRememberedCustomer,
} from '../src/services/rememberedCustomer';
import {
  applyTemporaryUiLogin,
  canEnterTemporaryUi,
  clearTemporaryUiLogin,
  installTemporaryLoginStoreForTests,
  loadTemporaryUiLogin,
  parseTemporaryUiLogin,
  saveTemporaryUiLogin,
} from '../src/services/temporaryUiLogin';
import { buildCustomerRegistration, sendCustomerOtp, verifyCustomerOtp } from '../src/services/customerAuth';
import { registrationFollowUp, screenAfterCustomerCall } from '../src/types/customerApi';

const fallback = 'The server did not accept the OTP request.';

function expectStay(status: number, body: unknown, messageIncludes: string) {
  const result = interpretCustomerResponse(status, body, fallback);
  if (result.confirmed || result.next !== 'stay' || screenAfterCustomerCall(result, 'send') !== 'stay') {
    throw new Error(`expected stay for ${JSON.stringify(body)}`);
  }
  if (screenAfterCustomerCall(result, 'verify') === 'home' || screenAfterCustomerCall(result, 'register') !== 'stay') {
    throw new Error(`expected no home for ${JSON.stringify(body)}`);
  }
  if (!result.message.toLowerCase().includes(messageIncludes.toLowerCase())) {
    throw new Error(`expected "${messageIncludes}" in "${result.message}"`);
  }
}

const unregistered = interpretCustomerResponse(200, { Message: 'Customer is not registered' }, fallback);
if (screenAfterCustomerCall(unregistered, 'send') !== 'complete-profile' || unregistered.confirmed) {
  throw new Error('unregistered customer should open profile without a session');
}
if (unregistered.message !== 'Customer is not registered') {
  throw new Error('unregistered toast must keep the server message');
}

const unregisteredList = interpretCustomerResponse(200, [{ message: 'Customer is not registered' }], fallback);
if (screenAfterCustomerCall(unregisteredList, 'send') !== 'complete-profile') {
  throw new Error('array response should open profile');
}

const registered = interpretCustomerResponse(
  200,
  [{ Status: 'Success', Message: 'OTP sent successfully' }],
  fallback,
);
if (registered.message !== 'OTP sent successfully' || screenAfterCustomerCall(registered, 'send') !== 'otp') {
  throw new Error('a confirmed code should open OTP verification');
}
if (screenAfterCustomerCall(registered, 'verify') === 'home') {
  throw new Error('a sent code is not a signed-in customer');
}
const sentLogin = applyTemporaryUiLogin(registered, [{ Status: 'Success', Message: 'OTP sent successfully' }], '9000000001');
if (sentLogin.localLogin || screenAfterCustomerCall(sentLogin, 'verify') === 'home') {
  throw new Error('a sent code must not create a temporary login');
}

const bareSuccess = interpretCustomerResponse(200, { Success: true }, fallback);
if (bareSuccess.confirmed || screenAfterCustomerCall(bareSuccess, 'send') !== 'stay' || screenAfterCustomerCall(bareSuccess, 'verify') === 'home') {
  throw new Error('a success flag without an OTP message must stay');
}

const verifiedWithoutSession = interpretCustomerResponse(
  200,
  { Status: 'Success', Message: 'OTP verified successfully' },
  fallback,
);
if (
  !verifiedWithoutSession.confirmed ||
  verifiedWithoutSession.localLogin !== 'temporary-ui' ||
  screenAfterCustomerCall(verifiedWithoutSession, 'verify') !== 'home' ||
  verifiedWithoutSession.session ||
  !verifiedWithoutSession.message.includes('OTP verified successfully')
) {
  throw new Error('Status Success on verify-otp opens a temporary device login without a token');
}

const verifiedCustomerOnly = interpretCustomerResponse(
  200,
  { Status: 'Success', Message: 'OTP verified successfully', CustomerId: 2017, Name: 'Asha', Mobile: '9000000001' },
  fallback,
);
if (verifiedCustomerOnly.localLogin !== 'temporary-ui' || screenAfterCustomerCall(verifiedCustomerOnly, 'verify') !== 'home' || verifiedCustomerOnly.session) {
  throw new Error('Status Success with a customer id opens temporary UI login and must not create a token');
}
const rememberedProfile = profileFromVerifiedOtp(verifiedCustomerOnly, '9000000001');
if (
  !rememberedProfile ||
  rememberedProfile.customerId !== '2017' ||
  rememberedProfile.name !== 'Asha' ||
  rememberedProfile.mobile !== '9000000001' ||
  canEnterHome(null)
) {
  throw new Error('a verified customer is saved without becoming a backend session');
}
if (profileFromVerifiedOtp(verifiedCustomerOnly, '9000000002')) {
  throw new Error('a verified customer for a different mobile must not be saved');
}

const verified = interpretCustomerResponse(
  200,
  { Status: 'Success', Message: 'OTP verified successfully', AccessToken: 'secret-value' },
  fallback,
);
if (
  screenAfterCustomerCall(verified, 'verify') !== 'home' ||
  verified.localLogin !== 'temporary-ui' ||
  verified.message.includes('secret-value')
) {
  throw new Error('Status Success opens Home without copying the token into the login');
}

const verifiedWithProfile = interpretCustomerResponse(
  200,
  { Status: 'Success', Message: 'OTP verified successfully', AccessToken: 'secret-value', CustomerId: 2017, Name: 'Asha', Mobile: '9000000001' },
  fallback,
);
const verifiedProfile = profileFromVerifiedOtp(verifiedWithProfile, '9000000001');
if (screenAfterCustomerCall(verifiedWithProfile, 'verify') !== 'home' || verifiedProfile?.name !== 'Asha' || verifiedWithProfile.session || verifiedWithProfile.message.includes('secret-value')) {
  throw new Error('Status Success may keep the customer and must not keep the token on the login');
}

const created = interpretCustomerResponse(
  200,
  [{
    Code: 200,
    Status: 'Success',
    Message: 'Customer registered successfully.',
    CustomerId: 2017,
    Name: 'Asha',
    Mobile: '9000000001',
    CompanyMobile: '9000000088',
  }],
  fallback,
);
if (
  created.message !== 'Customer registered successfully.' ||
  created.tone !== 'success' ||
  created.customer?.customerId !== '2017' ||
  created.customer.name !== 'Asha' ||
  created.next !== 'otp' ||
  screenAfterCustomerCall(created, 'register') !== 'otp' ||
  screenAfterCustomerCall(created, 'register') === 'home' ||
  screenAfterCustomerCall(created, 'send') === 'home'
) {
  throw new Error('a confirmed registration must request OTP and must not open Home');
}

const createdWithoutId = interpretCustomerResponse(
  200,
  [{ Status: 'Success', Message: 'Customer registered successfully.' }],
  fallback,
);
if (createdWithoutId.confirmed || screenAfterCustomerCall(createdWithoutId, 'register') === 'home') {
  throw new Error('registration without a customer id must stay');
}

const serverFailure = interpretCustomerResponse(200, [{ Status: 'Failed', Message: 'Unable to send OTP' }], fallback);
if (serverFailure.message !== 'Unable to send OTP' || serverFailure.confirmed || screenAfterCustomerCall(serverFailure, 'send') !== 'stay') {
  throw new Error('the server failure text must stay on screen');
}

const wrapped = interpretCustomerResponse(200, '[{"Status":"Failed","Message":"Customer is not registered"}]', fallback);
if (screenAfterCustomerCall(wrapped, 'send') !== 'complete-profile') {
  throw new Error('a JSON string should still open registration');
}

expectStay(400, null, 'HTTP 400');
expectStay(200, { unexpected: true }, "Couldn't confirm");
expectStay(0, { message: 'The request timed out. Please try again.' }, 'timed out');

const unregisteredAfterCode = interpretCustomerResponse(200, { Message: 'Customer is not registered' }, fallback);
if (screenAfterCustomerCall(unregisteredAfterCode, 'verify') !== 'complete-profile') {
  throw new Error('a new customer should open registration after the code is checked');
}

expectStay(200, { Success: false, Message: 'Invalid OTP' }, 'Invalid OTP');
expectStay(200, { status: 'expired', Message: 'OTP expired' }, 'OTP expired');
expectStay(200, { Message: 'Mobile number already registered' }, 'already registered');
expectStay(0, { message: 'Unable to connect. Please try again.' }, 'Unable to connect');
expectStay(500, null, 'HTTP 500');

const registration = buildCustomerRegistration({
  mobile: '6000000000',
  name: 'A',
  email: 'a@b.co',
  dateOfBirth: null,
  location: null,
});
if (registration.ok) {
  throw new Error('registration must not be built without an address');
}

const body = buildCustomerRegistration({
  mobile: '6000000000',
  name: 'Asha',
  email: 'asha@example.com',
  dateOfBirth: '1990-01-02',
  location: {
    id: 'home',
    label: 'Home',
    addressLine1: '12 Market Road',
    city: 'Lucknow',
    source: 'manual',
  },
});
if (!body.ok || 'CompanyMobile' in body.body || 'WhatsApp' in body.body || 'GSTIN' in body.body) {
  throw new Error('registration body invented fields');
}

const withoutEmail = buildCustomerRegistration({
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
if (!withoutEmail.ok || withoutEmail.body.Email !== '') {
  throw new Error('registration must allow an empty optional email');
}

const badEmail = buildCustomerRegistration({
  mobile: '6000000000',
  name: 'Asha',
  email: 'not-an-email',
  dateOfBirth: null,
  location: {
    id: 'home',
    label: 'Home',
    addressLine1: '12 Market Road',
    city: 'Lucknow',
    source: 'manual',
  },
});
if (badEmail.ok) {
  throw new Error('registration must reject an invalid email when one is entered');
}

const masked = safeServerMessage([{ Message: 'Code 123456 sent' }]);
if (masked !== 'Code ****** sent') {
  throw new Error('a code inside the server message must be masked');
}
const sessionFields = sessionFieldNames([{ Status: 'Success', Message: 'OTP sent successfully', AccessToken: 'secret-value' }]);
if (sessionFields.length !== 1 || sessionFields[0] !== 'AccessToken') {
  throw new Error('session check must report the field name only');
}
if (sessionFieldNames([{ Status: 'Failed', Message: 'Unable to send OTP' }]).length !== 0) {
  throw new Error('a failed OTP response is not a session');
}

const processFailure = interpretCustomerResponse(
  200,
  [{ Status: 'Failed', Message: 'Unable to process OTP. Please try again' }],
  'The server did not accept the OTP request.',
);
if (
  processFailure.message !== 'Unable to process OTP. Please try again' ||
  processFailure.confirmed ||
  processFailure.next !== 'stay' ||
  safeServerMessage([{ Status: 'Failed', Message: 'Unable to process OTP. Please try again' }]) !== processFailure.message
) {
  throw new Error('the server process-failure sentence must stay visible and unconfirmed');
}

const tokenWithoutVerification = interpretCustomerResponse(200, { AccessToken: 'secret-value' }, fallback);
if (tokenWithoutVerification.next === 'home' || tokenWithoutVerification.confirmed) {
  throw new Error('a token without a verified OTP must not open Home');
}

const failedWithToken = interpretCustomerResponse(
  200,
  { Status: 'Failed', Message: 'OTP verified successfully', AccessToken: 'secret-value' },
  fallback,
);
if (failedWithToken.confirmed || failedWithToken.next === 'home' || screenAfterCustomerCall(failedWithToken, 'verify') === 'home') {
  throw new Error('a failed verify response must not open Home even when a token is present');
}

const duplicateCustomer = interpretCustomerResponse(
  200,
  { Status: 'Failed', Message: 'Mobile number already registered' },
  fallback,
);
if (registrationFollowUp(duplicateCustomer) !== 'login' || screenAfterCustomerCall(duplicateCustomer, 'register') === 'home') {
  throw new Error('a duplicate customer must recover to login and must not open Home or auto-send OTP');
}
const explicitAlreadyRegistered = interpretCustomerResponse(
  200,
  { Status: 'Failed', Message: 'This customer mobile number is already registered.' },
  fallback,
);
if (
  !explicitAlreadyRegistered.message.toLowerCase().includes('already registered') ||
  registrationFollowUp(explicitAlreadyRegistered) !== 'login'
) {
  throw new Error('register already-registered wording must recover to login');
}
if (registrationFollowUp(created) !== 'otp' || registrationFollowUp(createdWithoutId) !== 'stay') {
  throw new Error('only a confirmed registration should continue to OTP');
}
if (profileFromVerifiedOtp(created, '9000000001')) {
  throw new Error('registration must not be stored as a verified OTP profile');
}

const failedWithCustomer = interpretCustomerResponse(
  200,
  { Status: 'Failed', Message: 'OTP expired, already used, or invalid. Please request a new OTP.', CustomerId: 2017, Name: 'Asha', Mobile: '9000000001' },
  fallback,
);
if (failedWithCustomer.customer || profileFromVerifiedOtp(failedWithCustomer, '9000000001') || failedWithCustomer.next === 'home') {
  throw new Error('a failed OTP must not remember the customer or open Home');
}
const deniedLogin = applyTemporaryUiLogin(
  failedWithCustomer,
  { Status: 'Failed', Message: 'OTP expired, already used, or invalid. Please request a new OTP.', CustomerId: 2017, Name: 'Asha', Mobile: '9000000001' },
  '9000000001',
);
if (deniedLogin.temporaryLogin || deniedLogin.localLogin || screenAfterCustomerCall(deniedLogin, 'verify') === 'home') {
  throw new Error('an invalid OTP must not create a temporary login');
}
const openedLogin = applyTemporaryUiLogin(
  verifiedCustomerOnly,
  { Status: 'Success', Message: 'OTP verified successfully', CustomerId: 2017, Name: 'Asha', Mobile: '9000000001' },
  '9000000001',
);
if (
  openedLogin.temporaryLogin?.basis !== 'temporary-ui' ||
  openedLogin.temporaryLogin.customerId !== '2017' ||
  openedLogin.temporaryLogin.name !== 'Asha' ||
  openedLogin.temporaryLogin.mobile !== '9000000001' ||
  openedLogin.session ||
  JSON.stringify(openedLogin.temporaryLogin).includes('token')
) {
  throw new Error('Status Success must save the verified customer without a token');
}

const detailedUnregistered = interpretCustomerResponse(
  200,
  [{ Status: 'Failed', Message: 'Customer is not registered with this mobile number.' }],
  fallback,
);
if (screenAfterCustomerCall(detailedUnregistered, 'send') !== 'complete-profile' || detailedUnregistered.next === 'stay') {
  throw new Error('an unregistered mobile must not be treated as already registered');
}

// OTP-first: verify Success for an unregistered mobile opens Personal Information, not Home.
const otpFirstUnregistered = interpretCustomerResponse(
  200,
  {
    Status: 'Success',
    Message: 'Mobile verified. Complete registration.',
    IsRegistered: false,
    MobileVerificationToken: 'verify-secret',
  },
  fallback,
);
const otpFirstLogin = applyTemporaryUiLogin(
  otpFirstUnregistered,
  {
    Status: 'Success',
    Message: 'Mobile verified. Complete registration.',
    IsRegistered: false,
    MobileVerificationToken: 'verify-secret',
  },
  '9000000001',
);
if (
  screenAfterCustomerCall(otpFirstLogin, 'verify') !== 'complete-profile' ||
  otpFirstLogin.localLogin ||
  otpFirstLogin.next !== 'register' ||
  !otpFirstLogin.confirmed ||
  otpFirstLogin.session?.field !== 'MobileVerificationToken' ||
  otpFirstLogin.message.includes('verify-secret')
) {
  throw new Error('OTP-first unregistered verify must open Personal Information with a redacted verification credential');
}
if (registrationFollowUp(created, { mobileAlreadyVerified: true }) !== 'home') {
  throw new Error('OTP-first registration after verified mobile must open Home without a second OTP');
}
if (registrationFollowUp(created) !== 'otp') {
  throw new Error('without prior OTP verification, registration must still request OTP');
}

async function main() {
  installSessionStoreForTests(null);
  installRememberedStoreForTests(null);
  installTemporaryLoginStoreForTests(null);
  const stored = await saveAuthSession({ mobile: '9000000001', field: 'AccessToken', value: 'secret-value' });
  const restored = await loadAuthSession();
  if (!stored || !canEnterHome(restored) || restored?.field !== 'AccessToken') {
    throw new Error('a restart may restore only a real session credential');
  }
  await clearAuthSession();
  if (canEnterHome(await loadAuthSession())) {
    throw new Error('logout must clear the stored session');
  }
  if (parseStoredSession(JSON.stringify({ customerId: '2017', name: 'Asha', mobile: '9000000001' }))) {
    throw new Error('a stored customer record must not restore as a session');
  }
  const profileSaved = await saveRememberedCustomer({ mobile: '9000000001', customerId: '2017', name: 'Asha' });
  const profileRestored = await loadRememberedCustomer();
  if (!profileSaved || profileRestored?.name !== 'Asha' || profileRestored.customerId !== '2017' || canEnterHome(null)) {
    throw new Error('a restart may restore the remembered customer without opening Home');
  }
  if (
    displayCustomer(null, null, profileRestored) ||
    displayCustomer({ mobile: '9000000002' }, null, profileRestored)
  ) {
    throw new Error('a remembered customer must not be shown without a matching server session');
  }
  const shown = displayCustomer({ mobile: '9000000001' }, null, profileRestored);
  if (shown?.name !== 'Asha' || shown.mobile !== '9000000001') {
    throw new Error('a matching server session may display the remembered name and mobile');
  }
  if (parseRememberedCustomer(JSON.stringify({ mobile: '9000000001', field: 'AccessToken', value: 'secret-value' }))) {
    throw new Error('a session credential must not be read as a remembered customer');
  }
  await clearRememberedCustomer();
  if (await loadRememberedCustomer()) {
    throw new Error('logout must clear the remembered customer');
  }
  const loginSaved = await saveTemporaryUiLogin({ basis: 'temporary-ui', mobile: '9000000001', customerId: '2017', name: 'Asha' });
  const loginRestored = await loadTemporaryUiLogin();
  if (!loginSaved || !canEnterTemporaryUi(loginRestored) || loginRestored?.name !== 'Asha' || canEnterHome(null)) {
    throw new Error('a restart restores the temporary device login without creating a backend session');
  }
  const shownLogin = displayCustomer(loginRestored, null, null);
  if (shownLogin?.name !== 'Asha' || shownLogin.customerId !== '2017') {
    throw new Error('the restored temporary login supplies the profile name and customer id');
  }
  if (parseTemporaryUiLogin(JSON.stringify({ mobile: '9000000001', customerId: '2017', name: 'Asha' }))) {
    throw new Error('a stored mobile number without the temporary marker must not log the customer in');
  }
  await clearTemporaryUiLogin();
  if (canEnterTemporaryUi(await loadTemporaryUiLogin())) {
    throw new Error('logout must clear the temporary device login');
  }

  const invalidMobile = await sendCustomerOtp('12345');
  const shortCode = await verifyCustomerOtp('6000000000', '12');
  if (invalidMobile.next !== 'stay' || shortCode.confirmed || screenAfterCustomerCall(shortCode, 'verify') === 'home') {
    throw new Error('invalid input must not authenticate');
  }

  console.log('customer auth fixtures passed');
}

void main();
