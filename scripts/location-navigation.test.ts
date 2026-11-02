import { locationContinueTarget } from '../src/navigation/locationFlow';

function expectTarget(
  input: { intent: 'registration' | 'change'; canGoBack: boolean; signedIn: boolean; onboarding: boolean },
  target: 'back' | '/complete-profile' | '/home',
) {
  const actual = locationContinueTarget(input);
  if (actual !== target) {
    throw new Error(`${JSON.stringify(input)} went to ${actual}, expected ${target}`);
  }
  if (actual === 'back' && input.onboarding) {
    throw new Error('incomplete onboarding must not leave by going back');
  }
}

expectTarget({ intent: 'registration', canGoBack: true, signedIn: false, onboarding: true }, '/complete-profile');
expectTarget({ intent: 'registration', canGoBack: false, signedIn: false, onboarding: true }, '/complete-profile');
expectTarget({ intent: 'change', canGoBack: true, signedIn: true, onboarding: false }, 'back');
expectTarget({ intent: 'change', canGoBack: false, signedIn: true, onboarding: false }, '/home');
expectTarget({ intent: 'change', canGoBack: true, signedIn: true, onboarding: true }, '/complete-profile');
expectTarget({ intent: 'change', canGoBack: true, signedIn: false, onboarding: false }, '/complete-profile');
expectTarget({ intent: 'registration', canGoBack: true, signedIn: true, onboarding: true }, '/complete-profile');

console.log('location navigation rules passed');
