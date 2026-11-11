import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { isDevOtpEnabled } from '@/services/devOtp';
import {
  getAndroidAppSmsHash,
  isAndroidSmsOtpSupported,
  prepareAndroidSmsOtpListen,
  restartAndroidSmsOtpListen,
  stopAndroidSmsOtpListen,
  subscribeAndroidSmsOtp,
  type AndroidSmsListenMode,
} from '@/services/androidSmsOtp';
import { OTP_LENGTH } from '@/types/auth';

type UseAndroidSmsOtpAutofillArgs = {
  /** When false, native listeners stay off (e.g. screen unfocused or flow not ready). */
  enabled: boolean;
  /** Called once per received SMS that yields a complete OTP. Must not log the code. */
  onCode: (code: string) => void;
  length?: number;
};

type UseAndroidSmsOtpAutofillResult = {
  /** Re-arm listening after Resend OTP — call **before** the resend API. */
  restart: () => void;
  supported: boolean;
};

/**
 * Android SMS Retriever / User Consent autofill.
 * Prefer calling prepareAndroidSmsOtpListen() on Login before send-otp so the
 * SMS is not missed during navigation. This hook subscribes (and prepares if needed).
 * No-ops on iOS/web, Expo Go (module not linked), and Development OTP mode.
 */
export function useAndroidSmsOtpAutofill({
  enabled,
  onCode,
  length = OTP_LENGTH,
}: UseAndroidSmsOtpAutofillArgs): UseAndroidSmsOtpAutofillResult {
  const onCodeRef = useRef(onCode);
  const lastFilledRef = useRef<string | null>(null);
  const supported = Platform.OS === 'android' && isAndroidSmsOtpSupported();

  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (!enabled || !supported || isDevOtpEnabled()) {
      lastFilledRef.current = null;
      return;
    }

    lastFilledRef.current = null;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      void getAndroidAppSmsHash().then((hash) => {
        if (hash) {
          // Hash is required in the SMS body for zero-tap Retriever — safe to log in __DEV__.
          console.info('[android-sms-otp] app hash for SMS template:', hash);
        } else {
          console.info('[android-sms-otp] app hash unavailable (Expo Go or native module missing)');
        }
      });
    }

    // Ensure listening even if Login forgot to prepare (deep link / cold OTP).
    prepareAndroidSmsOtpListen({ length });

    const unsubscribe = subscribeAndroidSmsOtp((event) => {
      if (event.kind === 'code') {
        if (lastFilledRef.current === event.code) {
          return;
        }
        lastFilledRef.current = event.code;
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          const mode: AndroidSmsListenMode = event.mode;
          console.info('[android-sms-otp] code received via', mode);
        }
        onCodeRef.current(event.code);
        return;
      }
      if (typeof __DEV__ !== 'undefined' && __DEV__ && event.kind !== 'unsupported') {
        console.info('[android-sms-otp]', event.kind, 'mode' in event ? event.mode : '');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [enabled, length, supported]);

  useEffect(() => {
    if (enabled && supported && !isDevOtpEnabled()) {
      return;
    }
    // Leaving OTP / Dev OTP / unsupported: drop native receivers so the next
    // Login prepare starts clean.
    stopAndroidSmsOtpListen();
  }, [enabled, supported]);

  return {
    supported,
    restart: () => {
      lastFilledRef.current = null;
      restartAndroidSmsOtpListen({ length });
    },
  };
}
