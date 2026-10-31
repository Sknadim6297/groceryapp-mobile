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

expectStay(200, { Message: 'OTP sent' }, 'OTP sent');
expectStay(200, { Success: true }, 'does not confirm');
expectStay(200, { Success: false, Message: 'Invalid OTP' }, 'Invalid OTP');
expectStay(200, { status: 'expired', Message: 'OTP expired' }, 'OTP expired');
expectStay(200, { Message: 'Mobile number already registered' }, 'already registered');
expectStay(0, { message: 'Unable to connect. Please try again.' }, 'Unable to connect');
expectStay(500, null, 'did not accept');

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
