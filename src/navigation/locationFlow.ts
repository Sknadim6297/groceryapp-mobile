export type LocationIntent = 'registration' | 'change';

export type LocationContinueTarget = 'back' | '/complete-profile' | '/home';

/**
 * Incomplete onboarding returns to Complete Profile.
 * A signed-in address change returns to the screen that opened it, or Home.
 * Login is never a location destination.
 */
export function locationContinueTarget(input: {
  intent: LocationIntent;
  canGoBack: boolean;
  signedIn: boolean;
  onboarding: boolean;
}): LocationContinueTarget {
  if (input.onboarding || !input.signedIn || input.intent === 'registration') {
    return '/complete-profile';
  }
  if (input.canGoBack) {
    return 'back';
  }
  return '/home';
}
