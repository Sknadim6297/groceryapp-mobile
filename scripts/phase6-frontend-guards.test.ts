/**
 * Phase 6 regression: Android APK profile, Google Maps config, GPS cleanup markers.
 * Run: npx --yes tsx scripts/phase6-frontend-guards.test.ts
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DELIVERY_MAP_PROVIDER, GOOGLE_MAPS_ATTRIBUTION } from '../src/constants/mapStyle';
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

  // --- app.config wires Google Maps for normal builds (not ui-preview slim) ---
  const appConfig = read('app.config.ts');
  assert(appConfig.includes("PREVIEW_PROFILE = 'ui-preview'"), 'slim strip only for ui-preview');
  assert(appConfig.includes('react-native-maps'), 'react-native-maps plugin wired');
  assert(appConfig.includes('withGoogleMapsPlugin'), 'Google Maps plugin helper present');
  assert(appConfig.includes("deliveryMapProvider: 'google-maps'"), 'Google Maps provider extra');
  assert(!appConfig.includes('withMapLibrePlugin'), 'MapLibre plugin helper removed');

  // --- app.json permissions / project ownership ---
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
      appJson.expo.plugins.some((p) => Array.isArray(p) && p[0] === 'expo-location'),
    'expo-location plugin present',
  );
  assert(
    !JSON.stringify(appJson.expo?.plugins ?? []).includes('@maplibre/maplibre-react-native'),
    'MapLibre removed from app.json plugins',
  );
  assert(appJson.expo?.android?.package === 'com.groceryapp.mayapurbazaar', 'android package stable');

  // --- Google Maps branding constants ---
  assert(DELIVERY_MAP_PROVIDER === 'google-maps', 'delivery map provider is google-maps');
  assert(GOOGLE_MAPS_ATTRIBUTION.toLowerCase().includes('google'), 'Google attribution present');

  // --- Coordinate helpers still round-trip lng/lat pairs ---
  const center = mapLibreCenterFromLatLng(22.57, 88.36);
  assert(center[0] === 88.36 && center[1] === 22.57, 'center is [lng, lat]');
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
  assert(locationService.includes('googlePlacesAutocomplete'), 'Google Places search wired');
  assert(locationService.includes('googleReverseGeocode'), 'Google reverse geocode wired');

  // --- Manual pin preservation comment/guard in location-map ---
  const locationMap = read('src/app/location-map.tsx');
  assert(
    locationMap.includes('Reverse geocode must never rewrite the pin coordinates'),
    'manual/GPS pin coords preserved across reverse geocode',
  );

  // --- Packages ---
  const pkg = JSON.parse(read('package.json')) as { dependencies?: Record<string, string> };
  assert(Boolean(pkg.dependencies?.['expo-network']), 'expo-network dependency present');
  assert(Boolean(pkg.dependencies?.['react-native-maps']), 'react-native-maps dependency present');
  assert(!pkg.dependencies?.['@maplibre/maplibre-react-native'], 'MapLibre native package removed');
  assert(!pkg.dependencies?.['maplibre-gl'], 'maplibre-gl package removed');

  console.log('phase6-frontend-guards.test.ts: ok');
}

main();
