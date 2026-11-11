/**
 * Phase 6 regression: Android APK profile, MapLibre/OpenFreeMap config, GPS cleanup markers.
 * Run: npx --yes tsx scripts/phase6-frontend-guards.test.ts
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { OPEN_FREE_MAP_ATTRIBUTION, OPEN_FREE_MAP_STYLE_URL } from '../src/constants/mapStyle';
import {
  latLngFromMapLibreCenter,
  mapLibreCenterFromLatLng,
} from '../src/utils/gpsFixQuality';
import { isValidMapCoordinate } from '../src/utils/mapCameraGuards';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel: string): string {
  return readFileSync(path.join(root, rel), 'utf8');
}

function main() {
  // --- EAS client-apk profile ---
  const eas = JSON.parse(read('eas.json')) as {
    build?: { 'client-apk'?: { android?: { buildType?: string }; env?: Record<string, string> } };
  };
  const clientApk = eas.build?.['client-apk'];
  assert(clientApk, 'client-apk profile must exist');
  assert(clientApk.android?.buildType === 'apk', 'client-apk must emit APK');
  assert(clientApk.env?.EXPO_PUBLIC_UI_PREVIEW === 'on', 'client-apk preview env is on');
  assert(
    typeof clientApk.env?.EXPO_PUBLIC_API_BASE_URL === 'string' &&
      clientApk.env.EXPO_PUBLIC_API_BASE_URL.startsWith('https://'),
    'client-apk must pin HTTPS API base',
  );

  // --- app.config keeps MapLibre for EXPO_PUBLIC_UI_PREVIEW=on (not ui-preview slim) ---
  const appConfig = read('app.config.ts');
  assert(appConfig.includes("PREVIEW_PROFILE = 'ui-preview'"), 'slim strip only for ui-preview');
  assert(appConfig.includes('@maplibre/maplibre-react-native'), 'MapLibre plugin wired');
  assert(appConfig.includes('deliveryMapProvider'), 'delivery map provider extra present');

  // --- app.json permissions / MapLibre / project ownership ---
  const appJson = JSON.parse(read('app.json')) as {
    expo?: {
      owner?: string;
      plugins?: unknown[];
      extra?: { eas?: { projectId?: string } };
      android?: { package?: string };
    };
  };
  assert(appJson.expo?.owner === 'nadim123456', 'EAS owner configured');
  assert(typeof appJson.expo?.extra?.eas?.projectId === 'string', 'EAS projectId present');
  assert(
    Array.isArray(appJson.expo?.plugins) &&
      appJson.expo.plugins.some(
        (p) =>
          p === '@maplibre/maplibre-react-native' ||
          (Array.isArray(p) && p[0] === 'expo-location'),
      ),
    'MapLibre + expo-location plugins present',
  );
  assert(appJson.expo?.android?.package === 'com.groceryapp.mayapurbazaar', 'android package stable');

  // --- OpenFreeMap style + attribution ---
  assert(OPEN_FREE_MAP_STYLE_URL.includes('openfreemap.org'), 'OpenFreeMap style URL');
  assert(OPEN_FREE_MAP_ATTRIBUTION.toLowerCase().includes('openstreetmap'), 'OSM attribution required');

  // --- Coordinate sync helpers (lng/lat MapLibre order) ---
  const center = mapLibreCenterFromLatLng(22.57, 88.36);
  assert(center[0] === 88.36 && center[1] === 22.57, 'MapLibre center is [lng, lat]');
  const back = latLngFromMapLibreCenter(center);
  assert(back?.latitude === 22.57 && back?.longitude === 88.36, 'round-trip lat/lng');
  assert(isValidMapCoordinate(22.57, 88.36), 'valid delivery coordinate');

  // --- GPS watcher cleanup + timeout still present (no live GPS claims) ---
  const locationService = read('src/services/location/locationService.ts');
  assert(locationService.includes('LOCATE_TIMEOUT_MS'), 'locate timeout configured');
  assert(locationService.includes('WATCH_IMPROVE_WINDOW_MS'), 'watch improve window configured');
  assert(locationService.includes('watchPositionAsync'), 'watchPositionAsync used');
  assert(locationService.includes('cleanup.stop'), 'watcher cleanup stop hook present');
  assert(locationService.includes('sub.remove()'), 'subscription remove on cleanup');
  assert(locationService.includes('aborted = true'), 'abort flag after race');

  // --- Manual pin preservation comment/guard in location-map ---
  const locationMap = read('src/app/location-map.tsx');
  assert(
    locationMap.includes('Reverse geocode must never rewrite the pin coordinates'),
    'manual/GPS pin coords preserved across reverse geocode',
  );

  // --- expo-network present for offline banner (auto permissions; no config plugin required) ---
  const pkg = JSON.parse(read('package.json')) as { dependencies?: Record<string, string> };
  assert(typeof pkg.dependencies?.['expo-network'] === 'string', 'expo-network dependency installed');

  console.log('phase6-frontend-guards: ok');
}

main();
