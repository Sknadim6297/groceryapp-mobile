import { activeLoginForDisplay, displayCustomer } from '../src/services/rememberedCustomer';
import { registeredDisplayName, registeredDisplayPhone } from '../src/utils/registeredIdentity';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  // Logged in with mobile only (verify-otp Success without Name/CustomerId).
  const identity = displayCustomer({ mobile: '9876543210', name: '', customerId: '' }, null, null);
  assert(identity != null, 'identity should exist');
  assert(identity!.mobile === '9876543210', 'mobile preserved');
  assert(registeredDisplayName(identity) === 'Your account', 'name fallback');
  assert(registeredDisplayPhone(identity).includes('98765'), 'phone shown');

  // Dev OTP session without TemporaryUiLogin — only when Dev OTP mode is allowed.
  assert(activeLoginForDisplay(null, { mobile: '9123456789' }, false) === null, 'dev login ignored when disabled');
  const login = activeLoginForDisplay(null, { mobile: '9123456789' }, true);
  const devIdentity = displayCustomer(login, null, null);
  assert(devIdentity?.mobile === '9123456789', 'dev mobile shown');
  assert(registeredDisplayPhone(devIdentity) !== 'No phone number yet', 'no empty phone copy');

  // Prefer account name when present.
  const named = displayCustomer(
    { mobile: '9876543210' },
    { customerId: '2', name: 'Riya', mobile: '9876543210', companyMobile: null },
    null,
  );
  assert(registeredDisplayName(named) === 'Riya', 'account name wins');

  console.log('display-customer.test.ts: ok');
}

run();
