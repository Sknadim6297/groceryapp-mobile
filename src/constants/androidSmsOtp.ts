/**
 * Android SMS Retriever / User Consent notes for Mayapur Bazaar.
 *
 * Package: com.groceryapp.mayapurbazaar
 * Native module: @pushpendersingh/react-native-otp-verify (dev/release Android builds only — not Expo Go)
 * Permissions: none. READ_SMS / RECEIVE_SMS are blocked in app.json.
 *
 * Zero-tap (SMS Retriever) requires the outbound OTP SMS to end with the runtime
 * 11-character app hash from getAndroidAppSmsHash() for the installed signing certificate.
 * Debug, upload, and Play App Signing certificates each produce a different hash.
 *
 * Suggested SMS body (≤140 bytes), hash on its own last line:
 *
 *   Your Mayapur Bazaar code is 123456
 *
 *   <APP_HASH>
 *
 * If the gateway cannot append the hash, SMS User Consent still prompts Allow once,
 * and the OTP TextInput keeps keyboard suggestion + paste fallbacks.
 */

export const ANDROID_SMS_OTP_PACKAGE = 'com.groceryapp.mayapurbazaar';
export const ANDROID_SMS_OTP_MAX_BYTES = 140;
