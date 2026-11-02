import { interpretCustomerResponse } from '../src/services/api/interpretCustomerResponse';
import { buildCustomerRegistration, sendCustomerOtp, verifyCustomerOtp } from '../src/services/customerAuth';
import { screenAfterCustomerCall } from '../src/types/customerApi';

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
if (unregistered.message !== "Let's create your account") {
  throw new Error('unregistered toast mismatch');
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

const bareSuccess = interpretCustomerResponse(200, { Success: true }, fallback);
if (bareSuccess.confirmed || screenAfterCustomerCall(bareSuccess, 'send') !== 'stay' || screenAfterCustomerCall(bareSuccess, 'verify') === 'home') {
  throw new Error('a success flag without an OTP message must stay');
}

const verified = interpretCustomerResponse(200, { Status: 'Success', Message: 'OTP verified successfully' }, fallback);
if (screenAfterCustomerCall(verified, 'verify') !== 'home' || screenAfterCustomerCall(verified, 'send') === 'otp') {
  throw new Error('verified code should open Home only after verification');
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
  created.message !== 'Welcome, Asha.' ||
  created.tone !== 'success' ||
  created.customer?.customerId !== '2017' ||
  created.customer.name !== 'Asha' ||
  screenAfterCustomerCall(created, 'register') !== 'home' ||
  screenAfterCustomerCall(created, 'send') === 'home'
) {
  throw new Error('a confirmed registration should open Home with the returned customer');
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

async function main() {
  const invalidMobile = await sendCustomerOtp('12345');
  const shortCode = await verifyCustomerOtp('6000000000', '12');
  if (invalidMobile.next !== 'stay' || shortCode.confirmed || screenAfterCustomerCall(shortCode, 'verify') === 'home') {
    throw new Error('invalid input must not authenticate');
  }

  console.log('customer auth fixtures passed');
}

void main();
