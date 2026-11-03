/**
 * Explicit Development OTP mode for local frontend testing.
 *
 * Requires BOTH:
 * - a Metro/`__DEV__` development bundle
 * - EXPO_PUBLIC_DEV_OTP=on|true|1|yes
 *
 * Default: disabled. Release builds never enable this.
 * When enabled, Login/OTP/registration onboarding must not call live OTP or register APIs.
 */

function envEnabled(value: string | undefined | null): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes';
}

function readExtraDevOtp(): string | undefined {
  try {
    // Lazy require so Node regression scripts do not need a full Expo runtime.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants') as {
      default?: { expoConfig?: { extra?: { expoPublicDevOtp?: string } } };
      expoConfig?: { expoConfig?: never; extra?: { expoPublicDevOtp?: string } };
    };
    const expoConfig = Constants.default?.expoConfig ?? (Constants as { expoConfig?: { extra?: { expoPublicDevOtp?: string } } }).expoConfig;
    const raw = expoConfig?.extra?.expoPublicDevOtp;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw;
    }
  } catch {
    // Node tests / environments without expo-constants.
  }
  return undefined;
}

function readDevOtpEnvRaw(): string | undefined {
  const fromProcess = process.env.EXPO_PUBLIC_DEV_OTP;
  if (typeof fromProcess === 'string' && fromProcess.trim().length > 0) {
    return fromProcess;
  }
  return readExtraDevOtp();
}

/** Test override — null means use real env/`__DEV__`. */
let testOverride: boolean | null = null;

/** Tests only. Pass `null` to clear. */
export function setDevOtpModeForTests(enabled: boolean | null): void {
  testOverride = enabled;
}

/** Raw env opt-in string presence (ignored in release unless `__DEV__`). */
export function isDevOtpEnvFlagOn(): boolean {
  return envEnabled(readDevOtpEnvRaw());
}

/** True only in a development bundle with the explicit Dev OTP flag. */
export function isDevOtpModeEnabled(): boolean {
  if (testOverride !== null) {
    return testOverride;
  }
  if (typeof __DEV__ === 'undefined' || __DEV__ !== true) {
    return false;
  }
  return isDevOtpEnvFlagOn();
}

/** Safe runtime snapshot for diagnostics — never includes OTP codes or tokens. */
export function getDevOtpRuntimeSnapshot(): {
  __DEV__: boolean;
  envFlagPresent: boolean;
  envFlagOn: boolean;
  modeEnabled: boolean;
} {
  const raw = readDevOtpEnvRaw();
  return {
    __DEV__: typeof __DEV__ !== 'undefined' && __DEV__ === true,
    envFlagPresent: typeof raw === 'string' && raw.trim().length > 0,
    envFlagOn: envEnabled(raw),
    modeEnabled: isDevOtpModeEnabled(),
  };
}
