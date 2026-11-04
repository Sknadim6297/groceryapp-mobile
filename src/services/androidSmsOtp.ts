import { Platform } from 'react-native';

import { extractSmsOtp } from '@/utils/extractSmsOtp';
import { OTP_LENGTH } from '@/types/auth';

export type AndroidSmsListenMode = 'retriever' | 'consent';

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

/**
 * Starts Android SMS listening. Prefers SMS Retriever (zero-tap, needs app hash in SMS).
 * Falls back to SMS User Consent (one Allow tap, any OTP SMS) when Retriever cannot start
 * or times out without a matching message.
 *
 * Never requests READ_SMS / RECEIVE_SMS. Never logs OTP or SMS body.
 */
export function startAndroidSmsOtpSession(options: {
  onEvent: (event: AndroidSmsOtpEvent) => void;
  length?: number;
}): { stop: () => void; restart: () => void } {
  const length = options.length ?? OTP_LENGTH;
  let generation = 0;
  let active: Session | null = null;
  let stopped = false;

  function emit(event: AndroidSmsOtpEvent) {
    if (stopped) {
      return;
    }
    options.onEvent(event);
  }

  function clearActive() {
    const session = active;
    active = null;
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
      void native.removeSmsListener().catch(() => undefined);
    }
  }

  async function arm(mode: AndroidSmsListenMode, gen: number) {
    const native = loadNative();
    if (!native) {
      emit({ kind: 'unsupported' });
      return;
    }
    if (stopped || gen !== generation) {
      return;
    }

    clearActive();
    if (stopped || gen !== generation) {
      return;
    }

    const session: Session = { mode, subscription: null, closed: false };
    active = session;

    try {
      session.subscription = native.addSmsListener((message) => {
        if (session.closed || stopped || gen !== generation) {
          return;
        }
        if (message.status === 'timeout') {
          clearActive();
          emit({ kind: 'timeout', mode });
          if (mode === 'retriever') {
            void arm('consent', gen);
          }
          return;
        }
        if (message.status === 'error') {
          clearActive();
          emit({ kind: 'error', mode });
          if (mode === 'retriever') {
            void arm('consent', gen);
          }
          return;
        }
        if (message.status === 'success' && typeof message.message === 'string') {
          const fromNative = native.extractOtp(message.message, length);
          const code = fromNative && fromNative.length === length ? fromNative : extractSmsOtp(message.message, length);
          clearActive();
          if (code && code.length === length) {
            emit({ kind: 'code', code, mode });
            return;
          }
          // Message arrived but no usable OTP — fall back to consent if we were on Retriever.
          emit({ kind: 'error', mode });
          if (mode === 'retriever') {
            void arm('consent', gen);
          }
        }
      });
    } catch {
      clearActive();
      emit({ kind: 'unsupported' });
      return;
    }

    try {
      if (mode === 'retriever') {
        await native.startSmsRetriever();
      } else {
        await native.requestPhoneNumber();
      }
    } catch {
      if (session.closed || stopped || gen !== generation) {
        return;
      }
      clearActive();
      emit({ kind: 'error', mode });
      if (mode === 'retriever') {
        void arm('consent', gen);
      }
    }
  }

  function start() {
    generation += 1;
    const gen = generation;
    clearActive();
    if (Platform.OS !== 'android') {
      emit({ kind: 'unsupported' });
      return;
    }
    if (!loadNative()) {
      emit({ kind: 'unsupported' });
      return;
    }
    void arm('retriever', gen);
  }

  start();

  return {
    stop() {
      stopped = true;
      generation += 1;
      clearActive();
    },
    restart() {
      if (stopped) {
        return;
      }
      start();
    },
  };
}
