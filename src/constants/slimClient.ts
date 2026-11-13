/**
 * Slim internal download APK (`client-apk` / `ui-preview`):
 * arm64-only, no Maps / Cashfree native / Camera+ML Kit barcode.
 */
function envSlim(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'ui-preview';
}

export const IS_SLIM_CLIENT_APK = envSlim(process.env.EXPO_PUBLIC_UI_PREVIEW);
