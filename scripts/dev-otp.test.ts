import { isDevOtpModeEnabled, setDevOtpModeForTests } from '../src/constants/devOtpMode';
import {
  DEV_OTP_MAX_ATTEMPTS,
  DEV_OTP_TTL_MS,
  canUseDevelopmentHome,
  clearDevTestSession,
  hasActiveDevOtp,
  issueDevTestOtp,
  loadDevTestSession,
  parseDevTestSession,
  peekDevTestOtp,
  readDevTestSession,
  resetDevTestOtpForTests,
  saveDevTestSession,
  setDevMockCustomerStatus,
  verifyDevTestOtp,
} from '../src/services/devOtp';
import { canEnterTemporaryUi, parseTemporaryUiLogin } from '../src/services/temporaryUiLogin';

const mobile = '9000000001';
const fixed = () => '482915';
const start = 1_700_000_000_000;

function reset() {
  setDevOtpModeForTests(null);
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
if (!issued || issued.code !== '482915' || issued.expiresAt - start !== DEV_OTP_TTL_MS || issued.used || issued.locked) {
  throw new Error('a development code should last five minutes');
}
if (issued.attemptsRemaining !== DEV_OTP_MAX_ATTEMPTS) {
  throw new Error('a fresh code should start with five attempts');
}
if (issueDevTestOtp('12345', 'unregistered', start, true, fixed) !== null) {
  throw new Error('an invalid mobile must not get a development code');
}

const wrong = verifyDevTestOtp(mobile, '000000', start + 1000, true);
if (wrong.ok || wrong.reason !== 'wrong' || peekDevTestOtp(mobile, true)?.used) {
  throw new Error('a wrong code must stay unused');
}
if (peekDevTestOtp(mobile, true)?.failedAttempts !== 1) {
  throw new Error('wrong attempts must increment');
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
if (replaced?.code !== '111111' || replaced.failedAttempts !== 0) {
  throw new Error('resend should replace the code and reset attempts');
}
const oldCode = verifyDevTestOtp(mobile, '482915', start + 6000, true);
const newCode = verifyDevTestOtp(mobile, '111111', start + 6000, true);
if (oldCode.ok || oldCode.reason !== 'wrong' || !newCode.ok) {
  throw new Error('only the resent code should match');
}

reset();
issueDevTestOtp(mobile, 'unregistered', start, true, fixed);
for (let attempt = 0; attempt < DEV_OTP_MAX_ATTEMPTS - 1; attempt += 1) {
  const fail = verifyDevTestOtp(mobile, '000000', start + 1000 + attempt, true);
  if (fail.ok || fail.reason !== 'wrong') {
    throw new Error(`attempt ${attempt + 1} should be wrong`);
  }
}
const locked = verifyDevTestOtp(mobile, '000000', start + 2000, true);
if (locked.ok || locked.reason !== 'locked' || !peekDevTestOtp(mobile, true)?.locked) {
  throw new Error('fifth wrong attempt must lock the code');
}
const lockedCorrect = verifyDevTestOtp(mobile, '482915', start + 3000, true);
if (lockedCorrect.ok || lockedCorrect.reason !== 'locked') {
  throw new Error('a locked code must reject even the correct digits');
}
if (hasActiveDevOtp(mobile, true, start + 3000)) {
  throw new Error('a locked code must not count as active');
}
const afterLockResend = issueDevTestOtp(mobile, 'unregistered', start + 4000, true, () => '777777');
if (!afterLockResend || afterLockResend.locked || afterLockResend.code !== '777777') {
  throw new Error('resend after lock must issue a fresh unlocked code');
}

async function main() {
  reset();
  const saved = await saveDevTestSession({ kind: 'development-test', mobile, destination: 'home' }, true);
  const restarted = await loadDevTestSession(true);
  if (!saved || restarted?.kind !== 'development-test' || restarted.destination !== 'home' || restarted.mobile !== mobile) {
    throw new Error('a development login should survive a restart only as a development-test record');
  }
  if (canUseDevelopmentHome(restarted, false) || !canUseDevelopmentHome(restarted, true)) {
    throw new Error('development Home access must stay inside Dev OTP mode');
  }
  if (parseTemporaryUiLogin(JSON.stringify(restarted)) || canEnterTemporaryUi(null)) {
    throw new Error('a development login must not become a real customer session');
  }
  if (parseDevTestSession(JSON.stringify({ basis: 'temporary-ui', mobile, customerId: '2017', name: 'Asha' }))) {
    throw new Error('a real customer record must not be read as a development login');
  }
  const production = await loadDevTestSession(false);
  if (production !== null || (await loadDevTestSession(true)) !== null) {
    throw new Error('production mode must clear a saved development login');
  }

  reset();
  await saveDevTestSession({ kind: 'development-test', mobile, destination: 'complete-profile' }, true);
  await clearDevTestSession();
  if ((await loadDevTestSession(true)) !== null || readDevTestSession(true) !== null) {
    throw new Error('logout must clear the development login');
  }

  // Mode helper must never claim enabled in this Node test process (no __DEV__ Metro).
  if (isDevOtpModeEnabled()) {
    throw new Error('isDevOtpModeEnabled must be false outside a Metro __DEV__ bundle');
  }

  setDevOtpModeForTests(true);
  if (!isDevOtpModeEnabled()) {
    throw new Error('setDevOtpModeForTests(true) must force mode on for network-guard tests');
  }
  setDevOtpModeForTests(false);
  if (isDevOtpModeEnabled()) {
    throw new Error('setDevOtpModeForTests(false) must force mode off');
  }
  setDevOtpModeForTests(null);

  reset();
  console.log('development otp fixtures passed');
}

void main();
