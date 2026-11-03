import { isDevOtpModeEnabled } from '@/constants/devOtpMode';
import { isValidIndiaMobile } from '@/utils/phoneValidation';

/** Five minutes. The code lives in memory only and is never written to storage. */
export const DEV_OTP_TTL_MS = 5 * 60 * 1000;

/** Maximum wrong verification attempts before the current Dev OTP is locked. */
export const DEV_OTP_MAX_ATTEMPTS = 5;

export type DevMockCustomerStatus = 'registered' | 'unregistered';

export type DevOtpView = {
  code: string;
  expiresAt: number;
  used: boolean;
  locked: boolean;
  failedAttempts: number;
  attemptsRemaining: number;
  mockStatus: DevMockCustomerStatus;
};

export type DevTestSession = {
  kind: 'development-test';
  mobile: string;
  destination: 'home' | 'complete-profile';
};

export type DevOtpFailure = 'disabled' | 'missing' | 'wrong' | 'expired' | 'used' | 'locked';

export type DevOtpVerifyResult =
  | { ok: true; destination: DevTestSession['destination']; sessionKind: DevTestSession['kind'] }
  | { ok: false; reason: DevOtpFailure };

type DevOtpRecord = {
  mobile: string;
  code: string;
  expiresAt: number;
  used: boolean;
  locked: boolean;
  failedAttempts: number;
  mockStatus: DevMockCustomerStatus;
};

const records = new Map<string, DevOtpRecord>();
let session: DevTestSession | null = null;

function developmentBuild(): boolean {
  return isDevOtpModeEnabled();
}

function wipe(): void {
  records.clear();
  session = null;
}

function randomCode(): string {
  // Cryptographically strong when available; never a fixed universal code.
  try {
    const cryptoObj = globalThis.crypto as { getRandomValues?: (buffer: Uint32Array) => Uint32Array } | undefined;
    if (cryptoObj?.getRandomValues) {
      const buffer = new Uint32Array(1);
      cryptoObj.getRandomValues(buffer);
      return String(buffer[0]! % 1_000_000).padStart(6, '0');
    }
  } catch {
    // fall through
  }
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
}

function viewOf(record: DevOtpRecord): DevOtpView {
  const attemptsRemaining = Math.max(0, DEV_OTP_MAX_ATTEMPTS - record.failedAttempts);
  return {
    code: record.code,
    expiresAt: record.expiresAt,
    used: record.used,
    locked: record.locked || record.failedAttempts >= DEV_OTP_MAX_ATTEMPTS,
    failedAttempts: record.failedAttempts,
    attemptsRemaining,
    mockStatus: record.mockStatus,
  };
}

/** True only when `__DEV__` and `EXPO_PUBLIC_DEV_OTP` explicitly enable Dev OTP mode. */
export function isDevOtpEnabled(): boolean {
  return developmentBuild();
}

/**
 * Drops any in-memory development code and session when Dev OTP mode is off.
 * Release builds / disabled mode call this on startup so a development session cannot survive.
 */
export function rejectDevTestSessionOutsideDevelopment(): void {
  if (!developmentBuild()) {
    wipe();
    void sessionStore.remove();
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
    locked: false,
    failedAttempts: 0,
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

/** True while an unused, unlocked, unexpired in-memory development code is available. */
export function hasActiveDevOtp(mobile: string, enabled = developmentBuild(), now = Date.now()): boolean {
  const record = peekDevTestOtp(mobile, enabled);
  return Boolean(record && !record.used && !record.locked && now < record.expiresAt);
}

/** True when Dev OTP mode is on and this mobile has any in-memory Dev OTP record (including used/expired/locked). */
export function hasDevOtpRecord(mobile: string, enabled = developmentBuild()): boolean {
  return peekDevTestOtp(mobile, enabled) !== null;
}

/** Drops an in-memory Dev OTP so live verify-otp is used when Dev OTP mode is off. */
export function clearDevTestOtp(mobile: string): void {
  records.delete(mobile);
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
  if (record.locked || record.failedAttempts >= DEV_OTP_MAX_ATTEMPTS) {
    record.locked = true;
    return { ok: false, reason: 'locked' };
  }
  if (now >= record.expiresAt) {
    return { ok: false, reason: 'expired' };
  }
  if (code !== record.code) {
    record.failedAttempts += 1;
    if (record.failedAttempts >= DEV_OTP_MAX_ATTEMPTS) {
      record.locked = true;
      return { ok: false, reason: 'locked' };
    }
    return { ok: false, reason: 'wrong' };
  }

  record.used = true;
  const destination = record.mockStatus === 'registered' ? 'home' : 'complete-profile';
  session = { kind: 'development-test', mobile, destination };
  return { ok: true, destination, sessionKind: 'development-test' };
}

/** Null when Dev OTP mode is off, including after a code was previously accepted. */
export function readDevTestSession(enabled = developmentBuild()): DevTestSession | null {
  if (!enabled) {
    wipe();
    return null;
  }
  return session;
}

const DEV_SESSION_KEY = 'groceryapp.development-test-session';

type DevSessionStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const sessionMemory = new Map<string, string>();

const memorySessionStore: DevSessionStore = {
  async read() {
    return sessionMemory.get(DEV_SESSION_KEY) ?? null;
  },
  async write(value) {
    sessionMemory.set(DEV_SESSION_KEY, value);
  },
  async remove() {
    sessionMemory.delete(DEV_SESSION_KEY);
  },
};

let sessionStore: DevSessionStore = memorySessionStore;

/** Tests replace the store so a restart can be simulated without a device. */
export function installDevSessionStoreForTests(next: DevSessionStore | null): void {
  sessionMemory.clear();
  storeWipeOnlyMemory();
  sessionStore = next ?? memorySessionStore;
}

function storeWipeOnlyMemory(): void {
  wipe();
}

export function resetDevTestOtpForTests(): void {
  wipe();
  sessionMemory.clear();
}

export function serializeDevTestSession(value: DevTestSession): string | null {
  if (value.kind !== 'development-test' || !isValidIndiaMobile(value.mobile)) {
    return null;
  }
  if (value.destination !== 'home' && value.destination !== 'complete-profile') {
    return null;
  }
  return JSON.stringify({ kind: 'development-test', mobile: value.mobile, destination: value.destination });
}

export function parseDevTestSession(raw: string | null): DevTestSession | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const mobile = typeof record.mobile === 'string' ? record.mobile : '';
    const destination = record.destination === 'home' || record.destination === 'complete-profile' ? record.destination : null;
    if (record.kind !== 'development-test' || !destination || !isValidIndiaMobile(mobile)) {
      return null;
    }
    return { kind: 'development-test', mobile, destination };
  } catch {
    return null;
  }
}

/** Home is available only for a registered development-test customer while Dev OTP mode is on. */
export function canUseDevelopmentHome(value: DevTestSession | null, enabled = developmentBuild()): boolean {
  return enabled && value?.kind === 'development-test' && value.destination === 'home';
}

/**
 * After OTP-first Dev verify + successful registration, promote onboarding to Home.
 * Does not invent a live TemporaryUiLogin; only updates the development-test session.
 */
export function promoteDevTestSessionToHome(mobile: string, enabled = developmentBuild()): DevTestSession | null {
  if (!enabled || !isValidIndiaMobile(mobile)) {
    return null;
  }
  const current = session;
  if (!current || current.mobile !== mobile || current.kind !== 'development-test') {
    return null;
  }
  session = { kind: 'development-test', mobile, destination: 'home' };
  return session;
}

export async function saveDevTestSession(value: DevTestSession, enabled = developmentBuild()): Promise<boolean> {
  if (!enabled) {
    wipe();
    await sessionStore.remove();
    return false;
  }
  const serialized = serializeDevTestSession(value);
  if (!serialized) {
    return false;
  }
  session = value;
  await sessionStore.write(serialized);
  return true;
}

export async function loadDevTestSession(enabled = developmentBuild()): Promise<DevTestSession | null> {
  if (!enabled) {
    wipe();
    await sessionStore.remove();
    return null;
  }
  const raw = await sessionStore.read();
  const restored = parseDevTestSession(raw);
  if (!restored) {
    if (raw) {
      await sessionStore.remove();
    }
    return null;
  }
  session = restored;
  return restored;
}

/** Drops the development code and any saved development login. Does not call the OTP API. */
export async function clearDevTestSession(): Promise<void> {
  wipe();
  await sessionStore.remove();
}

export async function activateDeviceDevSessionStore(): Promise<void> {
  try {
    const SecureStore = await import('expo-secure-store');
    const secureStore: DevSessionStore = {
      async read() {
        return SecureStore.getItemAsync(DEV_SESSION_KEY);
      },
      async write(value) {
        await SecureStore.setItemAsync(DEV_SESSION_KEY, value);
      },
      async remove() {
        await SecureStore.deleteItemAsync(DEV_SESSION_KEY);
      },
    };
    if (!developmentBuild()) {
      wipe();
      await secureStore.remove();
      sessionStore = memorySessionStore;
      return;
    }
    sessionStore = secureStore;
  } catch {
    if (!developmentBuild()) {
      wipe();
    }
    sessionStore = memorySessionStore;
  }
}
