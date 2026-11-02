import {
  DEV_OTP_TTL_MS,
  issueDevTestOtp,
  peekDevTestOtp,
  readDevTestSession,
  resetDevTestOtpForTests,
  setDevMockCustomerStatus,
  verifyDevTestOtp,
} from '../src/services/devOtp';

const mobile = '9000000001';
const fixed = () => '482915';
const start = 1_700_000_000_000;

function reset() {
  resetDevTestOtpForTests();
}

reset();

const blocked = issueDevTestOtp(mobile, 'unregistered', start, false, fixed);
if (blocked !== null || peekDevTestOtp(mobile, false) !== null || readDevTestSession(false) !== null) {
  throw new Error('a release build must not issue or keep a development code');
}
if (verifyDevTestOtp(mobile, '482915', start, false).ok) {
  throw new Error('a release build must reject a development code');
}

reset();
const issued = issueDevTestOtp(mobile, 'unregistered', start, true, fixed);
if (!issued || issued.code !== '482915' || issued.expiresAt - start !== DEV_OTP_TTL_MS || issued.used) {
  throw new Error('a development code should last five minutes');
}
if (issueDevTestOtp('12345', 'unregistered', start, true, fixed) !== null) {
  throw new Error('an invalid mobile must not get a development code');
}

const wrong = verifyDevTestOtp(mobile, '000000', start + 1000, true);
if (wrong.ok || wrong.reason !== 'wrong' || peekDevTestOtp(mobile, true)?.used) {
  throw new Error('a wrong code must stay unused');
}

const correct = verifyDevTestOtp(mobile, '482915', start + 1000, true);
if (!correct.ok || correct.destination !== 'complete-profile' || correct.sessionKind !== 'development-test') {
  throw new Error('a new mock customer should open Complete Profile');
}
if (readDevTestSession(true)?.kind !== 'development-test') {
  throw new Error('the development session must stay marked as a test');
}
const reused = verifyDevTestOtp(mobile, '482915', start + 2000, true);
if (reused.ok || reused.reason !== 'used') {
  throw new Error('a used code must be rejected');
}

reset();
issueDevTestOtp(mobile, 'unregistered', start, true, fixed);
if (!setDevMockCustomerStatus(mobile, 'registered', true)) {
  throw new Error('mock status should change before the code is used');
}
const registered = verifyDevTestOtp(mobile, '482915', start + 1000, true);
if (!registered.ok || registered.destination !== 'home') {
  throw new Error('a registered mock customer should open Home');
}
if (readDevTestSession(false) !== null || peekDevTestOtp(mobile, false) !== null) {
  throw new Error('reading the session outside development must clear it');
}

reset();
issueDevTestOtp(mobile, 'registered', start, true, fixed);
const expired = verifyDevTestOtp(mobile, '482915', start + DEV_OTP_TTL_MS, true);
if (expired.ok || expired.reason !== 'expired' || peekDevTestOtp(mobile, true)?.used) {
  throw new Error('an expired code must be rejected without being consumed');
}
const stillValid = verifyDevTestOtp(mobile, '482915', start + DEV_OTP_TTL_MS - 1, true);
if (!stillValid.ok) {
  throw new Error('the same code should still match inside the five minutes');
}

reset();
issueDevTestOtp(mobile, 'unregistered', start, true, fixed);
const replaced = issueDevTestOtp(mobile, 'unregistered', start + 5000, true, () => '111111');
if (replaced?.code !== '111111') {
  throw new Error('resend should replace the code');
}
const oldCode = verifyDevTestOtp(mobile, '482915', start + 6000, true);
const newCode = verifyDevTestOtp(mobile, '111111', start + 6000, true);
if (oldCode.ok || oldCode.reason !== 'wrong' || !newCode.ok) {
  throw new Error('only the resent code should match');
}

reset();
console.log('development otp fixtures passed');
