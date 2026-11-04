import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { isDevOtpEnabled } from '@/services/devOtp';
import {
  getAndroidAppSmsHash,
  isAndroidSmsOtpSupported,
  startAndroidSmsOtpSession,
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
  /** Re-arm Retriever → Consent after Resend OTP. */
  restart: () => void;
  supported: boolean;
};

/**
 * Android SMS Retriever with User Consent fallback.
 * No-ops on iOS/web, Expo Go (module not linked), and Development OTP mode.
 */
export function useAndroidSmsOtpAutofill({
  enabled,
  onCode,
  length = OTP_LENGTH,
}: UseAndroidSmsOtpAutofillArgs): UseAndroidSmsOtpAutofillResult {
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const sessionRef = useRef<{ stop: () => void; restart: () => void } | null>(null);
  const lastFilledRef = useRef<string | null>(null);
  const supported = Platform.OS === 'android' && isAndroidSmsOtpSupported();

  useEffect(() => {
    if (!enabled || !supported || isDevOtpEnabled()) {
      sessionRef.current?.stop();
      sessionRef.current = null;
      return;
    }

    lastFilledRef.current = null;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      void getAndroidAppSmsHash().then((hash) => {
        if (hash) {
          console.info('[android-sms-otp] app hash ready for SMS template (value not logged in production builds)');
          // Hash itself is not secret, but keep noise low: log length only.
          console.info('[android-sms-otp] hash length', hash.length);
        }
      });
    }

    const session = startAndroidSmsOtpSession({
      length,
      onEvent: (event) => {
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
      },
    });

    sessionRef.current = session;
    return () => {
      session.stop();
      if (sessionRef.current === session) {
        sessionRef.current = null;
      }
    };
  }, [enabled, length, supported]);

  return {
    supported,
    restart: () => {
      lastFilledRef.current = null;
      sessionRef.current?.restart();
    },
  };
}
