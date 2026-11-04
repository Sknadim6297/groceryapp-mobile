import {
  isLocationPickerHref,
  locationContinueTarget,
  resolveAddressBookAddReturnTo,
  resolveLocationExitHref,
} from '../src/navigation/locationFlow';

function expectTarget(
  input: {
    intent: 'registration' | 'change';
    canGoBack: boolean;
    signedIn: boolean;
    onboarding: boolean;
    profileNameReady: boolean;
  },
  target: 'caller' | '/complete-profile' | '/home' | 'submit-registration',
) {
  const actual = locationContinueTarget(input);
  if (actual !== target) {
    throw new Error(`${JSON.stringify(input)} went to ${actual}, expected ${target}`);
  }
  if (actual === 'caller' && input.onboarding) {
    throw new Error('incomplete onboarding must not leave by returning to caller alone');
  }
  if (actual === '/complete-profile' && input.profileNameReady && input.onboarding) {
    throw new Error('ready personal info must not bounce back to Personal Information after location');
  }
}

// Name not ready → collect personal info
expectTarget(
  { intent: 'registration', canGoBack: true, signedIn: false, onboarding: true, profileNameReady: false },
  '/complete-profile',
);
expectTarget(
  { intent: 'registration', canGoBack: false, signedIn: false, onboarding: true, profileNameReady: false },
  '/complete-profile',
);

// Name ready after Personal Information → submit registration (no loop)
expectTarget(
  { intent: 'registration', canGoBack: true, signedIn: false, onboarding: true, profileNameReady: true },
  'submit-registration',
);
expectTarget(
  { intent: 'registration', canGoBack: true, signedIn: true, onboarding: true, profileNameReady: true },
  'submit-registration',
);

// Signed-in address change → caller (never location search)
expectTarget(
  { intent: 'change', canGoBack: true, signedIn: true, onboarding: false, profileNameReady: true },
  'caller',
);
expectTarget(
  { intent: 'change', canGoBack: false, signedIn: true, onboarding: false, profileNameReady: true },
  '/home',
);

// Onboarding / unsigned still needs profile when name missing
expectTarget(
  { intent: 'change', canGoBack: true, signedIn: true, onboarding: true, profileNameReady: false },
  '/complete-profile',
);
expectTarget(
  { intent: 'change', canGoBack: true, signedIn: false, onboarding: false, profileNameReady: false },
  '/complete-profile',
);
expectTarget(
  { intent: 'change', canGoBack: true, signedIn: false, onboarding: false, profileNameReady: true },
  'submit-registration',
);

// --- Regression: Set Location must not reopen Select Delivery Location ---
if (isLocationPickerHref('/location') !== true) {
  throw new Error('/location must be treated as a location picker href');
}
if (isLocationPickerHref('/location-map') !== true) {
  throw new Error('/location-map must be treated as a location picker href');
}
if (isLocationPickerHref('/home') !== false) {
  throw new Error('/home must not be treated as a location picker href');
}

const homeExit = resolveLocationExitHref('/home');
if (homeExit !== '/home') {
  throw new Error(`expected /home exit, got ${String(homeExit)}`);
}
const cartExit = resolveLocationExitHref('/cart');
if (cartExit !== '/cart') {
  throw new Error(`expected /cart exit, got ${String(cartExit)}`);
}
const checkoutExit = resolveLocationExitHref('/checkout');
if (checkoutExit !== '/checkout') {
  throw new Error(`expected /checkout exit, got ${String(checkoutExit)}`);
}

// Stale / missing returnTo must never resolve to the search picker
const staleSearch = resolveLocationExitHref('/location');
if (staleSearch === '/location' || isLocationPickerHref(staleSearch)) {
  throw new Error('resolveLocationExitHref must not return the location search screen');
}
const missing = resolveLocationExitHref(null);
if (missing !== '/home' || isLocationPickerHref(missing)) {
  throw new Error('null returnTo must fall back to /home, not the location picker');
}

// Entry-point matrix: after a valid map selection, exit href leaves the picker
const entryExits: { entry: string; returnTo: '/home' | '/cart' | '/checkout' | '/addresses' | '/complete-profile' }[] = [
  { entry: 'registration', returnTo: '/complete-profile' },
  { entry: 'home', returnTo: '/home' },
  { entry: 'cart', returnTo: '/cart' },
  { entry: 'checkout', returnTo: '/checkout' },
  { entry: 'saved-addresses', returnTo: '/addresses' },
];
for (const row of entryExits) {
  const exit = resolveLocationExitHref(row.returnTo);
  if (isLocationPickerHref(exit)) {
    throw new Error(`${row.entry}: Set Location exit must leave the location picker (got ${String(exit)})`);
  }
  if (exit !== row.returnTo) {
    throw new Error(`${row.entry}: expected exit ${row.returnTo}, got ${String(exit)}`);
  }
}

// Address-book "Add" must preserve checkout/payment returnTo in select mode
const preserveCheckout = resolveAddressBookAddReturnTo({
  selectMode: true,
  existingReturnTo: '/checkout',
});
if (preserveCheckout !== '/checkout') {
  throw new Error(`select-mode Add from checkout must keep /checkout, got ${String(preserveCheckout)}`);
}
const preservePayment = resolveAddressBookAddReturnTo({
  selectMode: true,
  existingReturnTo: '/payment',
});
if (preservePayment !== '/payment') {
  throw new Error(`select-mode Add from payment must keep /payment, got ${String(preservePayment)}`);
}
const defaultCart = resolveAddressBookAddReturnTo({ selectMode: true, existingReturnTo: null });
if (defaultCart !== '/cart') {
  throw new Error(`select-mode Add with no returnTo must fall back to /cart, got ${String(defaultCart)}`);
}
const manageAddresses = resolveAddressBookAddReturnTo({
  selectMode: false,
  existingReturnTo: '/checkout',
});
if (manageAddresses !== '/addresses') {
  throw new Error(`non-select Add must return to /addresses, got ${String(manageAddresses)}`);
}

console.log('location navigation rules passed');
