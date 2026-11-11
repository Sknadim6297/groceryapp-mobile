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

  // Remembered profile for another mobile must not leak onto the active login.
  const mismatched = displayCustomer(
    { mobile: '9000000002' },
    null,
    { mobile: '9000000001', customerId: '2017', name: 'Asha' },
  );
  assert(mismatched != null, 'active login still has a display identity');
  assert(mismatched!.mobile === '9000000002', 'active mobile preserved');
  assert(mismatched!.name !== 'Asha', 'remembered name must not leak');
  assert(mismatched!.customerId !== '2017', 'remembered customerId must not leak');

  assert(
    displayCustomer(null, null, { mobile: '9000000001', customerId: '2017', name: 'Asha' }) == null,
    'remembered alone is not authenticated',
  );

  console.log('display-customer.test.ts: ok');
}

run();
