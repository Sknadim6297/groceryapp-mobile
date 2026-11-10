/**
 * GPS fix selection / MapLibre coordinate-order helpers.
 * Run: npx --yes tsx scripts/gps-fix-quality.test.ts
 */

import {
  classifyGpsFix,
  latLngFromMapLibreCenter,
  mapLibreCenterFromLatLng,
  pickBestGpsSample,
  type GpsFixSample,
} from '../src/utils/gpsFixQuality';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const now = Date.now();
  const coarse: GpsFixSample = {
    latitude: 22.48,
    longitude: 88.31,
    accuracyMeters: 1800,
    timestamp: now - 2000,
  };
  const better: GpsFixSample = {
    latitude: 22.4793,
    longitude: 88.3106,
    accuracyMeters: 35,
    timestamp: now - 1000,
  };
  const stale: GpsFixSample = {
    latitude: 23.42,
    longitude: 88.39,
    accuracyMeters: 10,
    timestamp: now - 120_000,
  };

  const best = pickBestGpsSample([coarse, better, stale], now);
  assert(best != null && best.accuracyMeters === 35, 'must prefer the freshest accurate GPS sample');
  assert(pickBestGpsSample([stale], now) == null, 'stale Mayapur/cached samples must be rejected');

  const network = classifyGpsFix(coarse);
  assert(network.kind === 'network-or-coarse' && network.approximate, 'km-scale accuracy is network/coarse');

  const good = classifyGpsFix(better, { fromWatch: true });
  assert(good.kind === 'watched-gps' && !good.approximate, '±35 m watched GPS is acceptable');

  const lastKnown = classifyGpsFix(better, { fromLastKnown: true });
  assert(lastKnown.kind === 'last-known' && lastKnown.approximate, 'last-known must never be labeled exact');

  const center = mapLibreCenterFromLatLng(22.4793, 88.3106);
  assert(center[0] === 88.3106 && center[1] === 22.4793, 'MapLibre center must be [lng, lat]');
  const back = latLngFromMapLibreCenter(center);
  assert(back.latitude === 22.4793 && back.longitude === 88.3106, 'round-trip lat/lng must not swap');

  // eslint-disable-next-line no-console
  console.log('gps-fix-quality.test.ts: all assertions passed');
}

main();
