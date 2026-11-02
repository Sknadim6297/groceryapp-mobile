export type LocationIntent = 'registration' | 'change';

export type LocationContinueTarget = 'back' | '/complete-profile' | '/home';

/**
 * Registration returns to the profile step.
 * A signed-in address change returns to the screen that opened it, or Home.
 * Neither path opens Login.
 */
export function locationContinueTarget(input: {
  intent: LocationIntent;
  canGoBack: boolean;
  signedIn: boolean;
}): LocationContinueTarget {
  if (!input.signedIn && input.intent === 'registration') {
    return '/complete-profile';
  }
  if (input.canGoBack) {
    return 'back';
  }
  return input.signedIn ? '/home' : '/complete-profile';
}
