/**
 * Pure helpers covering auto-verify guard rules used by the OTP screen.
 * Does not call live APIs or invent OTP codes.
 * SMS autofill feeds the same six-digit `code` path; these guards still apply.
 */

const OTP_LENGTH = 6;

function shouldAutoSubmit(args: {
  code: string;
  busy: boolean;
  lastFailedCode: string | null;
  lastAutoSubmittedCode: string | null;
}): boolean {
  const { code, busy, lastFailedCode, lastAutoSubmittedCode } = args;
  if (busy) {
    return false;
  }
  if (code.length !== OTP_LENGTH) {
    return false;
  }
  if (lastFailedCode === code) {
    return false;
  }
  if (lastAutoSubmittedCode === code) {
    return false;
  }
  return true;
}

function shouldAcceptSmsAutofill(args: {
  busy: boolean;
  verifying: boolean;
  leaving: boolean;
  digits: string;
}): boolean {
  if (args.busy || args.verifying || args.leaving) {
    return false;
  }
  return args.digits.length === OTP_LENGTH && /^\d{6}$/.test(args.digits);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  shouldAutoSubmit({
    code: '123456',
    busy: false,
    lastFailedCode: null,
    lastAutoSubmittedCode: null,
  }),
  'fresh complete code should auto-submit',
);

assert(
  !shouldAutoSubmit({
    code: '12345',
    busy: false,
    lastFailedCode: null,
    lastAutoSubmittedCode: null,
  }),
  'incomplete code must not auto-submit',
);

assert(
  !shouldAutoSubmit({
    code: '123456',
    busy: true,
    lastFailedCode: null,
    lastAutoSubmittedCode: null,
  }),
  'busy state must block auto-submit',
);

assert(
  !shouldAutoSubmit({
    code: '111111',
    busy: false,
    lastFailedCode: '111111',
    lastAutoSubmittedCode: null,
  }),
  'same failed code must not auto-retry',
);

assert(
  !shouldAutoSubmit({
    code: '222222',
    busy: false,
    lastFailedCode: null,
    lastAutoSubmittedCode: '222222',
  }),
  'already auto-submitted code must not fire again',
);

assert(
  shouldAutoSubmit({
    code: '333333',
    busy: false,
    lastFailedCode: '111111',
    lastAutoSubmittedCode: '111111',
  }),
  'a changed complete code may auto-submit again',
);

assert(
  shouldAcceptSmsAutofill({
    busy: false,
    verifying: false,
    leaving: false,
    digits: '654321',
  }),
  'SMS autofill may apply a complete code when idle',
);

assert(
  !shouldAcceptSmsAutofill({
    busy: true,
    verifying: false,
    leaving: false,
    digits: '654321',
  }),
  'SMS autofill must not overwrite while verifying',
);

assert(
  !shouldAcceptSmsAutofill({
    busy: false,
    verifying: true,
    leaving: false,
    digits: '654321',
  }),
  'SMS autofill must not apply while verifyingRef is set',
);

assert(
  shouldAutoSubmit({
    code: '654321',
    busy: false,
    lastFailedCode: null,
    lastAutoSubmittedCode: null,
  }),
  'SMS-filled complete code should auto-submit once',
);

console.log('otp auto-verify guard fixtures passed');
