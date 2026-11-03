/**
 * Frontend-only demo / preview UI (orders, checkout simulation, coupons, stores, etc.).
 *
 * This does **not** enable demo authentication, invent C# API responses, or create
 * real payments. Customer auth, registration, and location flows stay on live APIs.
 *
 * Enable with EXPO_PUBLIC_UI_PREVIEW=on|true|1
 */
function envEnabled(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes';
}

export const UI_PREVIEW_MODE = envEnabled(process.env.EXPO_PUBLIC_UI_PREVIEW);

/** Visible badge copy so demo surfaces are never mistaken for live commerce. */
export const DEMO_BANNER_LABEL = 'Demo preview — not a live store order';
