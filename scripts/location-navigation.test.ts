import { locationContinueTarget } from '../src/navigation/locationFlow';

function expectTarget(
  input: { intent: 'registration' | 'change'; canGoBack: boolean; signedIn: boolean },
  target: 'back' | '/complete-profile' | '/home',
) {
  const actual = locationContinueTarget(input);
  if (actual !== target) {
    throw new Error(`${JSON.stringify(input)} went to ${actual}, expected ${target}`);
  }
}

expectTarget({ intent: 'registration', canGoBack: true, signedIn: false }, '/complete-profile');
expectTarget({ intent: 'registration', canGoBack: false, signedIn: false }, '/complete-profile');
expectTarget({ intent: 'change', canGoBack: true, signedIn: true }, 'back');
expectTarget({ intent: 'change', canGoBack: false, signedIn: true }, '/home');
expectTarget({ intent: 'registration', canGoBack: true, signedIn: true }, 'back');
expectTarget({ intent: 'change', canGoBack: false, signedIn: false }, '/complete-profile');

console.log('location navigation rules passed');
