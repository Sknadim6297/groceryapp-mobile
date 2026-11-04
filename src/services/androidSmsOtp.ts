import { Platform } from 'react-native';

import {
  preferredAndroidSmsListenMode,
  type AndroidSmsListenModePreference,
} from '@/constants/androidSmsOtp';
import { extractSmsOtp } from '@/utils/extractSmsOtp';
import { OTP_LENGTH } from '@/types/auth';

export type AndroidSmsListenMode = AndroidSmsListenModePreference;
export { preferredAndroidSmsListenMode };

export type AndroidSmsOtpEvent =
  | { kind: 'code'; code: string; mode: AndroidSmsListenMode }
  | { kind: 'timeout'; mode: AndroidSmsListenMode }
  | { kind: 'error'; mode: AndroidSmsListenMode }
  | { kind: 'unsupported' };

type NativeOtpVerify = typeof import('@pushpendersingh/react-native-otp-verify');

let nativeModule: NativeOtpVerify | null | undefined;

function loadNative(): NativeOtpVerify | null {
  if (nativeModule !== undefined) {
    return nativeModule;
  }
  if (Platform.OS !== 'android') {
    nativeModule = null;
    return null;
  }
  try {
    // Native Turbo Module — missing in Expo Go until a custom Android build ships.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeModule = require('@pushpendersingh/react-native-otp-verify') as NativeOtpVerify;
  } catch {
    nativeModule = null;
  }
  return nativeModule;
}

export function isAndroidSmsOtpSupported(): boolean {
  return loadNative() != null;
}

/**
 * Runtime 11-character SMS Retriever hash for the installed signing certificate.
 * Null on iOS/web, Expo Go, or when the native module is not linked.
 */
export async function getAndroidAppSmsHash(): Promise<string | null> {
  const native = loadNative();
  if (!native) {
    return null;
  }
  try {
    const signature = await native.getAppSignature();
    const trimmed = typeof signature === 'string' ? signature.trim() : '';
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

type Session = {
  mode: AndroidSmsListenMode;
  subscription: { remove: () => void } | null;
  closed: boolean;
};

type BridgeListener = (event: AndroidSmsOtpEvent) => void;

type SharedBridge = {
  length: number;
  generation: number;
  active: Session | null;
  stopped: boolean;
  listeners: Set<BridgeListener>;
  /** Holds the latest unused code until an OTP screen subscribes. */
  pendingCode: { code: string; mode: AndroidSmsListenMode } | null;
};

let bridge: SharedBridge | null = null;

function emitToListeners(event: AndroidSmsOtpEvent) {
  if (!bridge || bridge.stopped) {
    return;
  }
  if (event.kind === 'code') {
    if (bridge.listeners.size === 0) {
      bridge.pendingCode = { code: event.code, mode: event.mode };
    } else {
      bridge.pendingCode = null;
    }
  }
  for (const listener of bridge.listeners) {
    try {
      listener(event);
    } catch {
      // ignore subscriber errors
    }
  }
}

function clearActiveSession() {
  if (!bridge) {
    return;
  }
  const session = bridge.active;
  bridge.active = null;
  if (!session) {
    return;
  }
  session.closed = true;
  try {
    session.subscription?.remove();
  } catch {
    // ignore
  }
  const native = loadNative();
  if (native) {
    // Library removeSmsListener clears the Retriever receiver; Consent cleans up
    // after dialog result / timeout inside the native module.
    void native.removeSmsListener().catch(() => undefined);
  }
}

async function armMode(mode: AndroidSmsListenMode, gen: number) {
  const native = loadNative();
  if (!native || !bridge) {
    emitToListeners({ kind: 'unsupported' });
    return;
  }
  if (bridge.stopped || gen !== bridge.generation) {
    return;
  }

  clearActiveSession();
  if (bridge.stopped || gen !== bridge.generation) {
    return;
  }

  const session: Session = { mode, subscription: null, closed: false };
  bridge.active = session;

  try {
    session.subscription = native.addSmsListener((message) => {
      if (!bridge || session.closed || bridge.stopped || gen !== bridge.generation) {
        return;
      }
      if (message.status === 'timeout') {
        clearActiveSession();
        emitToListeners({ kind: 'timeout', mode });
        if (mode === 'retriever') {
          void armMode('consent', gen);
        }
        return;
      }
      if (message.status === 'error') {
        clearActiveSession();
        emitToListeners({ kind: 'error', mode });
        if (mode === 'retriever') {
          void armMode('consent', gen);
        }
        return;
      }
      if (message.status === 'success' && typeof message.message === 'string') {
        const length = bridge.length;
        const fromNative = native.extractOtp(message.message, length);
        const code =
          fromNative && fromNative.length === length
            ? fromNative
            : extractSmsOtp(message.message, length);
        clearActiveSession();
        if (code && code.length === length) {
          emitToListeners({ kind: 'code', code, mode });
          return;
        }
        emitToListeners({ kind: 'error', mode });
        if (mode === 'retriever') {
          void armMode('consent', gen);
        }
      }
    });
  } catch {
    clearActiveSession();
    emitToListeners({ kind: 'unsupported' });
    return;
  }

  try {
    if (mode === 'retriever') {
      await native.startSmsRetriever();
    } else {
      await native.requestPhoneNumber();
    }
  } catch {
    if (!bridge || session.closed || bridge.stopped || gen !== bridge.generation) {
      return;
    }
    clearActiveSession();
    emitToListeners({ kind: 'error', mode });
    if (mode === 'retriever') {
      void armMode('consent', gen);
    }
  }
}

function ensureBridge(length: number): SharedBridge {
  if (!bridge) {
    bridge = {
      length,
      generation: 0,
      active: null,
      stopped: false,
      listeners: new Set(),
      pendingCode: null,
    };
  } else {
    bridge.length = length;
  }
  return bridge;
}

/**
 * Start Android SMS listening **before** calling send-otp / resend-otp.
 * Messages that arrive before this returns are not delivered by Google Play Services.
 *
 * Idempotent while a session is already active — OTP screen mount must not re-arm
 * and drop a listener that Login already started.
 */
export function prepareAndroidSmsOtpListen(options?: { length?: number; force?: boolean }): void {
  if (Platform.OS !== 'android') {
    return;
  }
  if (!loadNative()) {
    return;
  }
  const length = options?.length ?? OTP_LENGTH;
  const shared = ensureBridge(length);
  if (!options?.force && !shared.stopped && shared.active) {
    shared.length = length;
    return;
  }
  shared.stopped = false;
  shared.pendingCode = null;
  shared.generation += 1;
  const gen = shared.generation;
  clearActiveSession();
  void armMode(preferredAndroidSmsListenMode(), gen);
}

/** Stop shared listening (failed send, logout, successful verify, leaving auth). */
export function stopAndroidSmsOtpListen(): void {
  if (!bridge) {
    return;
  }
  bridge.stopped = true;
  bridge.generation += 1;
  bridge.pendingCode = null;
  clearActiveSession();
}

/**
 * Subscribe to SMS OTP events. Replays a pending code captured while navigating
 * from Login → OTP after prepareAndroidSmsOtpListen().
 */
export function subscribeAndroidSmsOtp(listener: BridgeListener): () => void {
  const shared = ensureBridge(OTP_LENGTH);
  shared.listeners.add(listener);
  const pending = shared.pendingCode;
  if (pending) {
    shared.pendingCode = null;
    try {
      listener({ kind: 'code', code: pending.code, mode: pending.mode });
    } catch {
      // ignore
    }
  }
  return () => {
    shared.listeners.delete(listener);
  };
}

/**
 * Re-arm listening (e.g. Resend). Must be called **before** the resend API.
 */
export function restartAndroidSmsOtpListen(options?: { length?: number }): void {
  prepareAndroidSmsOtpListen({ ...options, force: true });
}

/**
 * Imperative session helper used by the autofill hook when prepare() was not
 * called (e.g. deep-link onto OTP). Prefer prepareAndroidSmsOtpListen first.
 */
export function startAndroidSmsOtpSession(options: {
  onEvent: (event: AndroidSmsOtpEvent) => void;
  length?: number;
}): { stop: () => void; restart: () => void } {
  const length = options.length ?? OTP_LENGTH;
  prepareAndroidSmsOtpListen({ length });
  const unsubscribe = subscribeAndroidSmsOtp(options.onEvent);
  return {
    stop() {
      unsubscribe();
      // Only tear down native listening when no other subscribers remain.
      if (bridge && bridge.listeners.size === 0) {
        stopAndroidSmsOtpListen();
      }
    },
    restart() {
      restartAndroidSmsOtpListen({ length });
    },
  };
}
