import type { Href } from 'expo-router';

import { locationRoutes } from '@/navigation/locationRoutes';

export type LocationIntent = 'registration' | 'change';

/** 'caller' = leave the location picker and reopen the screen that started the flow. */
export type LocationContinueTarget = 'caller' | '/complete-profile' | '/home' | 'submit-registration';

const LOCATION_PICKER_PATHS = new Set([
  String(locationRoutes.search),
  String(locationRoutes.map),
  String(locationRoutes.manual),
]);

/**
 * After Choose Location is confirmed:
 * - Onboarding with a ready personal-info draft → submit registration (do not bounce to Personal Information).
 * - Onboarding without a name yet → Personal Information.
 * - Signed-in address change → caller screen (Home / Cart / Checkout), never the search picker.
 * Login is never a location destination.
 */
export function locationContinueTarget(input: {
  intent: LocationIntent;
  canGoBack: boolean;
  signedIn: boolean;
  onboarding: boolean;
  /** True when Full Name is already captured in the registration draft. */
  profileNameReady: boolean;
}): LocationContinueTarget {
  const registrationPath =
    input.onboarding || !input.signedIn || input.intent === 'registration';

  if (registrationPath) {
    return input.profileNameReady ? 'submit-registration' : '/complete-profile';
  }
  if (input.canGoBack) {
    return 'caller';
  }
  return '/home';
}

/** True when an href is one of the location picker screens (search / map / manual). */
export function isLocationPickerHref(href: Href | string | null | undefined): boolean {
  if (href == null) {
    return false;
  }
  if (typeof href === 'string') {
    const path = href.split('?')[0] ?? href;
    return LOCATION_PICKER_PATHS.has(path);
  }
  const pathname = 'pathname' in href && typeof href.pathname === 'string' ? href.pathname : '';
  return LOCATION_PICKER_PATHS.has(pathname);
}

/**
 * Exit href after Set Location for a change-location flow.
 * Never returns a location picker route (that caused the search ↔ map loop).
 */
export function resolveLocationExitHref(returnTo: Href | null | undefined, fallback: Href = '/home'): Href {
  if (returnTo != null && !isLocationPickerHref(returnTo)) {
    return returnTo;
  }
  if (!isLocationPickerHref(fallback)) {
    return fallback;
  }
  return '/home';
}
