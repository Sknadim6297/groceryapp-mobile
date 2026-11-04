/**
 * Pure fixtures for Android SMS listen-mode selection (no native module).
 */

import { preferredAndroidSmsListenMode } from '../src/constants/androidSmsOtp';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  preferredAndroidSmsListenMode(undefined) === 'consent',
  'default mode must be consent until SMS hash is confirmed in the gateway template',
);
assert(preferredAndroidSmsListenMode('on') === 'retriever', 'flag on → retriever first');
assert(preferredAndroidSmsListenMode('retriever') === 'retriever', 'flag retriever → retriever first');
assert(preferredAndroidSmsListenMode('off') === 'consent', 'flag off → consent');

console.log('android sms otp order fixtures passed');
