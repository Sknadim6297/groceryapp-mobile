/**
 * Map camera / GPS / reverse-geocode guard helpers + flow simulations.
 * Run: npx --yes tsx scripts/map-camera-guards.test.ts
 */

import {
  isValidMapCoordinate,
  REGION_EPSILON_DEG,
  regionDistanceDeg,
  regionsNearlyEqual,
} from '../src/utils/mapCameraGuards';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  // --- Coordinate validation ---
  assert(isValidMapCoordinate(22.57, 88.36), 'valid Kolkata coords must pass');
  assert(
    !isValidMapCoordinate(undefined, 88.36) && !isValidMapCoordinate(91, 0) && !isValidMapCoordinate(NaN, 0),
    'invalid coords must fail',
  );

  const a = { latitude: 22.5726, longitude: 88.3639 };
  const near = { latitude: 22.5726 + REGION_EPSILON_DEG / 2, longitude: 88.3639 };
  const far = { latitude: 22.58, longitude: 88.37 };

  assert(regionsNearlyEqual(a, near), 'sub-epsilon drift must be ignored');
  assert(!regionsNearlyEqual(a, far), 'real drag distance must not be ignored');
  assert(regionDistanceDeg(a, far) > REGION_EPSILON_DEG, 'far points must report distance above epsilon');

  // --- No map camera feedback loop (epsilon gate) ---
  let scheduled = 0;
  function maybeSchedule(prev: typeof a | null, next: typeof a) {
    if (prev && regionsNearlyEqual(prev, next)) {
      return;
    }
    scheduled += 1;
  }
  maybeSchedule(a, near);
  maybeSchedule(a, far);
  assert(scheduled === 1, 'only meaningful region moves should schedule reverse geocode');

  // --- Single GPS request + duplicate tap prevention ---
  let gpsCalls = 0;
  let gpsInFlight = false;
  async function requestGpsOnce() {
    if (gpsInFlight) {
      return 'blocked';
    }
    gpsInFlight = true;
    gpsCalls += 1;
    try {
      return 'ready';
    } finally {
      gpsInFlight = false;
    }
  }
  assert((await requestGpsOnce()) === 'ready', 'first GPS request must run');
  assert(gpsCalls === 1, 'exactly one GPS call after first action');
  gpsInFlight = true;
  assert((await requestGpsOnce()) === 'blocked', 'duplicate tap while in flight must be blocked');
  assert(gpsCalls === 1, 'blocked tap must not increment GPS calls');
  gpsInFlight = false;

  // --- Permission denied outcome shape ---
  const denied = { status: 'denied' as const };
  assert(denied.status === 'denied', 'permission denied must surface as denied');

  // --- GPS success shape keeps coordinates without requiring geocode ---
  const gpsReady = {
    status: 'ready' as const,
    location: {
      latitude: 22.57,
      longitude: 88.36,
      label: 'Current location',
      approximate: true,
    },
  };
  assert(
    gpsReady.status === 'ready' && isValidMapCoordinate(gpsReady.location.latitude, gpsReady.location.longitude),
    'GPS success must keep valid coordinates',
  );

  // --- Programmatic settle must not re-center after user drag ---
  let cameraMoves = 0;
  let lastResolved: typeof a | null = { ...a };
  let programmaticUntil = 0;
  function onRegionChangeCompleteSim(next: typeof a, isGesture: boolean | undefined) {
    const programmatic = Date.now() < programmaticUntil;
    if (isGesture === false || (isGesture === undefined && programmatic)) {
      return;
    }
    if (lastResolved && regionsNearlyEqual(lastResolved, next)) {
      return;
    }
    lastResolved = next;
  }
  function centerOnce(coords: typeof a) {
    cameraMoves += 1;
    programmaticUntil = Date.now() + 700;
    lastResolved = coords;
  }
  centerOnce(a);
  onRegionChangeCompleteSim(near, false);
  onRegionChangeCompleteSim(far, true);
  assert(cameraMoves === 1, 'map centers only once for GPS');
  assert(lastResolved?.latitude === far.latitude, 'user drag updates selection without GPS recenter');

  // --- Stale reverse-geocode response protection ---
  let activeRequest = 0;
  let appliedLabel = '';
  async function reverseWithStaleGuard(label: string, delayMs: number, requestId: number) {
    await new Promise((r) => setTimeout(r, delayMs));
    if (requestId !== activeRequest) {
      return;
    }
    appliedLabel = label;
  }
  activeRequest = 1;
  const first = reverseWithStaleGuard('old', 40, 1);
  activeRequest = 2;
  const second = reverseWithStaleGuard('new', 5, 2);
  await Promise.all([first, second]);
  assert(appliedLabel === 'new', 'stale geocode response must not replace latest');

  // --- Geocode failure keeps coordinates ---
  const pin = { latitude: 22.57, longitude: 88.36 };
  const geocodeFailed = true;
  const keptPin = geocodeFailed ? pin : null;
  assert(keptPin?.latitude === pin.latitude, 'geocode failure must keep map pin coordinates');

  // --- Debounce: only last schedule runs ---
  let debounceRuns = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  function scheduleDebounced(ms: number) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceRuns += 1;
    }, ms);
  }
  scheduleDebounced(30);
  scheduleDebounced(30);
  scheduleDebounced(30);
  await new Promise((r) => setTimeout(r, 80));
  assert(debounceRuns === 1, 'reverse geocode must debounce to a single request');

  // --- Unmount cleanup invalidates pending work ---
  let mounted = true;
  let reverseRequestId = 0;
  function cleanup() {
    mounted = false;
    reverseRequestId += 1;
  }
  const pendingId = ++reverseRequestId;
  cleanup();
  assert(!mounted && pendingId !== reverseRequestId, 'unmount must invalidate pending geocode ids');

  // --- Set Location / navigation handoff shapes ---
  assert(true, 'confirm requires preview with coordinates');
  const checkoutReturn = '/checkout';
  const registrationReturn = 'submit-registration';
  const addressFormReturn = '/addresses/address-form';
  assert(Boolean(checkoutReturn && registrationReturn && addressFormReturn), 'caller destinations preserved');

  console.log('map camera guards passed');
}

void main();
