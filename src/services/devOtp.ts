import { isValidIndiaMobile } from '@/utils/phoneValidation';

/** Five minutes. The code lives in memory only and is never written to storage. */
export const DEV_OTP_TTL_MS = 5 * 60 * 1000;

export type DevMockCustomerStatus = 'registered' | 'unregistered';

export type DevOtpView = {
  code: string;
  expiresAt: number;
  used: boolean;
  mockStatus: DevMockCustomerStatus;
};

export type DevTestSession = {
  kind: 'development-test';
  mobile: string;
  destination: 'home' | 'complete-profile';
};

export type DevOtpFailure = 'disabled' | 'missing' | 'wrong' | 'expired' | 'used';

export type DevOtpVerifyResult =
  | { ok: true; destination: DevTestSession['destination']; sessionKind: DevTestSession['kind'] }
  | { ok: false; reason: DevOtpFailure };

type DevOtpRecord = DevOtpView & { mobile: string };

const records = new Map<string, DevOtpRecord>();
let session: DevTestSession | null = null;

function developmentBuild(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

function wipe(): void {
  records.clear();
  session = null;
}

function randomCode(): string {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
}

function viewOf(record: DevOtpRecord): DevOtpView {
  return {
    code: record.code,
    expiresAt: record.expiresAt,
    used: record.used,
    mockStatus: record.mockStatus,
  };
}

/** True only in a local Metro development bundle. Release builds are false. */
export function isDevOtpEnabled(): boolean {
  return developmentBuild();
}

/**
 * Drops any in-memory development code and session when this is not a development build.
 * Release builds call this on startup so a development session cannot survive.
 */
export function rejectDevTestSessionOutsideDevelopment(): void {
  if (!developmentBuild()) {
    wipe();
  }
}

export function issueDevTestOtp(
  mobile: string,
  mockStatus: DevMockCustomerStatus = 'unregistered',
  now = Date.now(),
  enabled = developmentBuild(),
  nextCode: () => string = randomCode,
): DevOtpView | null {
  if (!enabled) {
    wipe();
    return null;
  }
  if (!isValidIndiaMobile(mobile)) {
    return null;
  }

  const record: DevOtpRecord = {
    mobile,
    code: nextCode(),
    expiresAt: now + DEV_OTP_TTL_MS,
    used: false,
    mockStatus,
  };
  records.set(mobile, record);
  return viewOf(record);
}

export function peekDevTestOtp(mobile: string, enabled = developmentBuild()): DevOtpView | null {
  if (!enabled) {
    wipe();
    return null;
  }
  const record = records.get(mobile);
  return record ? viewOf(record) : null;
}

export function setDevMockCustomerStatus(
  mobile: string,
  mockStatus: DevMockCustomerStatus,
  enabled = developmentBuild(),
): boolean {
  if (!enabled) {
    wipe();
    return false;
  }
  const record = records.get(mobile);
  if (!record || record.used) {
    return false;
  }
  record.mockStatus = mockStatus;
  return true;
}

export function verifyDevTestOtp(
  mobile: string,
  code: string,
  now = Date.now(),
  enabled = developmentBuild(),
): DevOtpVerifyResult {
  if (!enabled) {
    wipe();
    return { ok: false, reason: 'disabled' };
  }

  const record = records.get(mobile);
  if (!record) {
    return { ok: false, reason: 'missing' };
  }
  if (record.used) {
    return { ok: false, reason: 'used' };
  }
  if (now >= record.expiresAt) {
    return { ok: false, reason: 'expired' };
  }
  if (code !== record.code) {
    return { ok: false, reason: 'wrong' };
  }

  record.used = true;
  const destination = record.mockStatus === 'registered' ? 'home' : 'complete-profile';
  session = { kind: 'development-test', mobile, destination };
  return { ok: true, destination, sessionKind: 'development-test' };
}

/** Null outside a development build, including after a code was previously accepted. */
export function readDevTestSession(enabled = developmentBuild()): DevTestSession | null {
  if (!enabled) {
    wipe();
    return null;
  }
  return session;
}

export function resetDevTestOtpForTests(): void {
  wipe();
}
