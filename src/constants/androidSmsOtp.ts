/**
 * Android SMS Retriever / User Consent notes for Mayapur Bazaar.
 *
 * Packages (hash differs per package + signing cert):
 * - Production / store: com.groceryapp.mayapurbazaar
 * - UI preview APK:     com.groceryapp.uipreview
 *
 * Native module: @pushpendersingh/react-native-otp-verify
 * (dev client / release Android builds only — not Expo Go)
 *
 * Permissions: none. READ_SMS / RECEIVE_SMS / READ_PHONE_STATE are blocked in app.json.
 *
 * Default listen mode is SMS User Consent (one Allow tap). It works with any OTP SMS
 * format and does not require an app hash. Zero-tap SMS Retriever only works when the
 * outbound SMS ends with the runtime 11-character hash from getAndroidAppSmsHash() for
 * the installed package + signing certificate. Enable Retriever-first with
 * EXPO_PUBLIC_ANDROID_SMS_RETRIEVER=on after the gateway appends the correct hash.
 *
 * Listening must start BEFORE send-otp / resend-otp. Messages that arrive earlier are
 * never delivered by Google Play Services.
 *
 * Suggested SMS body for zero-tap Retriever (≤140 bytes), hash on its own last line:
 *
 *   <#> Your Mayapur Bazaar code is 123456
 *
 *   <APP_HASH>
 *
 * Replace <APP_HASH> with getAndroidAppSmsHash() from the exact APK under test
 * (debug vs upload vs Play App Signing each produce a different hash).
 */

export const ANDROID_SMS_OTP_PACKAGE = 'com.groceryapp.mayapurbazaar';
export const ANDROID_SMS_OTP_PREVIEW_PACKAGE = 'com.groceryapp.uipreview';
export const ANDROID_SMS_OTP_MAX_BYTES = 140;

export type AndroidSmsListenModePreference = 'retriever' | 'consent';

/**
 * Consent is default until the SMS gateway appends the install's app hash.
 * Set EXPO_PUBLIC_ANDROID_SMS_RETRIEVER=on to prefer zero-tap Retriever first.
 */
export function preferredAndroidSmsListenMode(
  envValue: string | undefined = process.env.EXPO_PUBLIC_ANDROID_SMS_RETRIEVER,
): AndroidSmsListenModePreference {
  const flag = envValue?.trim().toLowerCase();
  if (flag === '1' || flag === 'true' || flag === 'on' || flag === 'yes' || flag === 'retriever') {
    return 'retriever';
  }
  return 'consent';
}
