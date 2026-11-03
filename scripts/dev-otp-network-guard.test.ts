/**
 * Spies on Axios posts and proves Development OTP mode makes ZERO live OTP/register network calls.
 * Run: npx --yes tsx scripts/dev-otp-network-guard.test.ts
 */

// Match Metro's development global so http.ts logging does not throw in Node.
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

import { setDevOtpModeForTests, getDevOtpRuntimeSnapshot } from '../src/constants/devOtpMode';
import { apiClient } from '../src/services/api/http';
import {
  registerCustomer,
  resendCustomerOtp,
  sendCustomerOtp,
  verifyCustomerOtp,
} from '../src/services/customerAuth';
import {
  issueDevTestOtp,
  resetDevTestOtpForTests,
  verifyDevTestOtp,
} from '../src/services/devOtp';
import { submitRegistrationThenOtp } from '../src/services/registrationSubmission';

const mobile = '9000000002';
const location = {
  id: 'home',
  label: 'Home',
  addressLine1: '12 Market Road',
  city: 'Lucknow',
  source: 'manual' as const,
};

type AxiosPostCall = { url: string };
const axiosPosts: AxiosPostCall[] = [];
const originalPost = apiClient.post.bind(apiClient);

function installAxiosSpy() {
  axiosPosts.length = 0;
  apiClient.post = (async (url: string) => {
    axiosPosts.push({ url: String(url) });
    return {
      status: 200,
      data: { Status: 'Success', Message: 'spy-should-not-run-in-dev-otp' },
      statusText: 'OK',
      headers: {},
      config: {},
    };
  }) as typeof apiClient.post;
}

function restoreAxiosSpy() {
  apiClient.post = originalPost;
}

function assertNoOtpNetwork(label: string) {
  const otpOrRegister = axiosPosts.filter((call) =>
    /send-otp|resend-otp|verify-otp|register/i.test(call.url),
  );
  if (otpOrRegister.length > 0 || axiosPosts.length > 0) {
    throw new Error(
      `${label}: unexpected live API posts (${axiosPosts.length}): ${axiosPosts.map((c) => c.url).join(', ')}`,
    );
  }
}

async function main() {
  installAxiosSpy();
  try {
    setDevOtpModeForTests(true);
    resetDevTestOtpForTests();

    const snap = getDevOtpRuntimeSnapshot();
    if (!snap.modeEnabled) {
      throw new Error('test override must enable Dev OTP mode');
    }

    // 1–3. Hard-block: send / resend / verify / register never touch Axios
    const send = await sendCustomerOtp(mobile);
    const resend = await resendCustomerOtp(mobile);
    const verify = await verifyCustomerOtp(mobile, '123456');
    const register = await registerCustomer({
      Mobile: mobile,
      Name: 'Demo',
      Email: '',
      Address: '12 Market Road',
    });

    if (send.confirmed || resend.confirmed || verify.confirmed || register.confirmed) {
      throw new Error('Dev OTP hard-block must not confirm live OTP/register');
    }
    if (!/blocked|Development OTP/i.test(send.message + resend.message + verify.message)) {
      throw new Error('OTP methods must report Development OTP hard-block');
    }
    assertNoOtpNetwork('1–3 hard-block send/resend/verify/register');

    // 1. Dev Login local issue
    axiosPosts.length = 0;
    const issued = issueDevTestOtp(mobile, 'unregistered', Date.now(), true, () => '246801');
    if (!issued || issued.code !== '246801') {
      throw new Error('Dev Login must issue a local OTP');
    }
    assertNoOtpNetwork('1 Dev Login local issue');

    // 2. Dev Resend local issue
    axiosPosts.length = 0;
    const resent = issueDevTestOtp(mobile, 'unregistered', Date.now(), true, () => '135790');
    if (!resent || resent.code !== '135790') {
      throw new Error('Dev Resend must replace the local OTP');
    }
    assertNoOtpNetwork('2 Dev Resend local issue');

    // 3. Dev Verify local
    axiosPosts.length = 0;
    const outcome = verifyDevTestOtp(mobile, '135790', Date.now(), true);
    if (!outcome.ok || outcome.destination !== 'complete-profile') {
      throw new Error('Dev Verify new customer must open complete-profile');
    }
    assertNoOtpNetwork('3 Dev Verify local');

    // 4. Dev New Customer → Personal Info → Location Done
    axiosPosts.length = 0;
    const demoReg = await submitRegistrationThenOtp({
      mobile,
      name: 'Demo User',
      email: '',
      dateOfBirth: null,
      location,
      mobileVerification: {
        mobile,
        standing: 'unregistered',
        source: 'development-test',
        credential: null,
      },
    });
    if (!demoReg.ok || demoReg.next !== 'home' || demoReg.temporaryLogin) {
      throw new Error('Dev registration must finish demo Home without TemporaryUiLogin');
    }
    if (demoReg.customer?.customerId !== 'development-demo') {
      throw new Error('Dev registration customer must be marked development-demo');
    }
    assertNoOtpNetwork('4 Dev New Customer registration');

    // 5. Dev Registered → Home
    axiosPosts.length = 0;
    resetDevTestOtpForTests();
    issueDevTestOtp(mobile, 'registered', Date.now(), true, () => '998877');
    const registeredHome = verifyDevTestOtp(mobile, '998877', Date.now(), true);
    if (!registeredHome.ok || registeredHome.destination !== 'home') {
      throw new Error('Dev Registered verify must open Home');
    }
    assertNoOtpNetwork('5 Dev Registered Home');

    // 6. Production mode → real OTP APIs (Axios post must fire)
    setDevOtpModeForTests(false);
    axiosPosts.length = 0;
    await sendCustomerOtp(mobile);
    if (axiosPosts.length !== 1 || !/send-otp/i.test(axiosPosts[0]!.url)) {
      throw new Error(`6 Production sendCustomerOtp must hit send-otp, got ${JSON.stringify(axiosPosts)}`);
    }

    axiosPosts.length = 0;
    await verifyCustomerOtp(mobile, '123456');
    if (axiosPosts.length !== 1 || !/verify-otp/i.test(axiosPosts[0]!.url)) {
      throw new Error(`6 Production verify must hit verify-otp, got ${JSON.stringify(axiosPosts)}`);
    }

    // 7. Runtime flag disabled → real resend API
    axiosPosts.length = 0;
    await resendCustomerOtp(mobile);
    if (axiosPosts.length !== 1 || !/resend-otp/i.test(axiosPosts[0]!.url)) {
      throw new Error(`7 Flag off resend must hit resend-otp, got ${JSON.stringify(axiosPosts)}`);
    }

    // 9. Duplicate tap prevention on hard-block
    setDevOtpModeForTests(true);
    axiosPosts.length = 0;
    await Promise.all([sendCustomerOtp(mobile), sendCustomerOtp(mobile), resendCustomerOtp(mobile)]);
    assertNoOtpNetwork('9 Duplicate tap hard-block');

    setDevOtpModeForTests(null);
    resetDevTestOtpForTests();
    console.log('dev otp network guard passed');
  } finally {
    restoreAxiosSpy();
    setDevOtpModeForTests(null);
    resetDevTestOtpForTests();
  }
}

void main();
