import { Platform } from 'react-native';
import * as Location from 'expo-location';

import { formatDeliveryAddress, referenceLocations } from '@/data/referenceLocations';
import type { DeliveryLocation, LocationSearchResult } from '@/types/location';
import {
  classifyGpsFix,
  fixAgeMs,
  isFreshEnough,
  LOW_CONFIDENCE_ACCURACY_M,
  pickBestGpsSample,
  TARGET_ACCURACY_M,
  type GpsFixSample,
} from '@/utils/gpsFixQuality';

const LOCATE_TIMEOUT_MS = 18_000;
const WATCH_IMPROVE_WINDOW_MS = 12_000;
const SEARCH_TIMEOUT_MS = 10_000;

export type CurrentLocationOutcome =
  | { status: 'ready'; location: DeliveryLocation }
  /** Fix obtained, but Precise/Fine location permission is reduced or coarse. */
  | { status: 'approximate-permission'; location: DeliveryLocation }
  | { status: 'denied' }
  | { status: 'services-off' }
  | { status: 'timeout' }
  | { status: 'unavailable' };

export type ReverseGeocodeOutcome =
  | { status: 'ready'; location: DeliveryLocation }
  | { status: 'unavailable' };

export type LocationDiagnostics = {
  permission: 'granted' | 'denied' | 'undetermined' | 'unknown';
  precise: boolean;
  servicesEnabled: boolean;
  platform: string;
  sampleCount: number;
  bestAccuracyMeters: number | null;
  bestAgeMs: number | null;
  fixKind: DeliveryLocation['fixKind'] | null;
  note: string;
};

function addressFromPlace(place: Location.LocationGeocodedAddress): Pick<
  DeliveryLocation,
  'addressLine1' | 'locality' | 'city' | 'state' | 'postalCode' | 'country' | 'label'
> | null {
  const street = [place.streetNumber, place.street].filter(Boolean).join(' ');
  const locality = place.district || place.name || place.subregion || '';
  const addressLine1 = street || locality || place.city || '';
  const city = place.city || place.subregion || '';

  if (!addressLine1 && !city) {
    return null;
  }

  return {
    label: locality || city || 'Selected location',
    addressLine1: addressLine1 || city,
    locality: locality || undefined,
    city: city || undefined,
    state: place.region || undefined,
    postalCode: place.postalCode || undefined,
    country: place.country || undefined,
  };
}

function withCoords(
  base: Omit<DeliveryLocation, 'id' | 'source' | 'latitude' | 'longitude' | 'approximate'> &
    Partial<
      Pick<
        DeliveryLocation,
        'id' | 'source' | 'approximate' | 'accuracyMeters' | 'fixAgeMs' | 'fixKind' | 'fixNote'
      >
    >,
  latitude: number,
  longitude: number,
  source: DeliveryLocation['source'],
  approximate?: boolean,
): DeliveryLocation {
  return {
    id: base.id ?? `${source}-${latitude.toFixed(5)}-${longitude.toFixed(5)}`,
    label: base.label,
    addressLine1: base.addressLine1,
    landmark: base.landmark,
    locality: base.locality,
    city: base.city,
    state: base.state,
    postalCode: base.postalCode,
    country: base.country,
    latitude,
    longitude,
    source,
    approximate,
    accuracyMeters: base.accuracyMeters,
    fixAgeMs: base.fixAgeMs,
    fixKind: base.fixKind,
    fixNote: base.fixNote,
  };
}

export function isPreciseLocationGranted(permission: Location.LocationPermissionResponse): boolean {
  if (permission.status !== 'granted') {
    return false;
  }
  if (Platform.OS === 'ios' && permission.ios?.accuracy === 'reduced') {
    return false;
  }
  if (Platform.OS === 'android' && permission.android?.accuracy === 'coarse') {
    return false;
  }
  return true;
}

export function logLocationDiagnostics(tag: string, diagnostics: LocationDiagnostics): void {
  if (!__DEV__) {
    return;
  }
  console.info(`[location:${tag}]`, diagnostics);
}

export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number,
  source: DeliveryLocation['source'] = 'map',
): Promise<ReverseGeocodeOutcome> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { status: 'unavailable' };
  }
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const address = places[0] ? addressFromPlace(places[0]) : null;
    if (!address) {
      return {
        status: 'ready',
        location: withCoords(
          {
            label: 'Pinned location',
            addressLine1: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            fixKind: 'map-pin',
          },
          latitude,
          longitude,
          source,
          true,
        ),
      };
    }
    return {
      status: 'ready',
      location: withCoords(
        { ...address, fixKind: source === 'map' ? 'map-pin' : undefined },
        latitude,
        longitude,
        source,
      ),
    };
  } catch {
    return { status: 'unavailable' };
  }
}

function sampleFromPosition(
  position: Location.LocationObject,
  coarsePermission: boolean,
): GpsFixSample {
  const accuracy = position.coords.accuracy;
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: typeof accuracy === 'number' && Number.isFinite(accuracy) ? accuracy : null,
    timestamp: position.timestamp,
    coarsePermission,
  };
}

/**
 * Watch GPS briefly so accuracy can improve; never silently accept stale last-known as exact.
 */
async function acquireBestPosition(coarsePermission: boolean): Promise<{
  sample: GpsFixSample;
  fromWatch: boolean;
  fromLastKnown: boolean;
  sampleCount: number;
} | null> {
  const samples: GpsFixSample[] = [];
  const cleanup = { stop: () => undefined as void };

  const push = (position: Location.LocationObject) => {
    const sample = sampleFromPosition(position, coarsePermission);
    if (isFreshEnough(sample)) {
      samples.push(sample);
    }
  };

  try {
    // Seed with a one-shot request (may return network/Wi‑Fi quickly).
    try {
      const once = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
          mayShowUserSettingsDialog: true,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('oneshot-timeout')), 8_000);
        }),
      ]);
      push(once);
    } catch {
      // Continue into watch window.
    }

    let settled = false;
    let aborted = false;

    const watchPromise = new Promise<void>((resolve) => {
      const finish = () => {
        if (settled) {
          return;
        }
        settled = true;
        resolve();
      };
      const timer = setTimeout(finish, WATCH_IMPROVE_WINDOW_MS);
      void Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
          mayShowUserSettingsDialog: true,
        },
        (position) => {
          if (aborted) {
            return;
          }
          push(position);
          const best = pickBestGpsSample(samples);
          if (
            best &&
            typeof best.accuracyMeters === 'number' &&
            best.accuracyMeters <= TARGET_ACCURACY_M &&
            !best.coarsePermission
          ) {
            clearTimeout(timer);
            finish();
          }
        },
      )
        .then((sub) => {
          cleanup.stop = () => {
            try {
              sub.remove();
            } catch {
              // Subscription may already be removed.
            }
          };
          // Race timeout can finish before the subscription resolves — stop immediately.
          if (settled || aborted) {
            cleanup.stop();
          }
        })
        .catch(() => {
          clearTimeout(timer);
          finish();
        });
    });

    await Promise.race([
      watchPromise,
      new Promise<void>((resolve) => {
        setTimeout(resolve, LOCATE_TIMEOUT_MS);
      }),
    ]);
    aborted = true;
    settled = true;
  } finally {
    cleanup.stop();
  }

  const bestWatched = pickBestGpsSample(samples);
  if (bestWatched) {
    return {
      sample: bestWatched,
      fromWatch: samples.length > 1,
      fromLastKnown: false,
      sampleCount: samples.length,
    };
  }

  // Last-known is never "verified current" — only a last-resort approximate seed.
  const last = await Location.getLastKnownPositionAsync({
    maxAge: MAX_ACCEPTABLE_FIX_AGE_MS_LOCAL,
    requiredAccuracy: LOW_CONFIDENCE_ACCURACY_M * 5,
  });
  if (last) {
    const sample = sampleFromPosition(last, coarsePermission);
    if (isFreshEnough(sample)) {
      return {
        sample,
        fromWatch: false,
        fromLastKnown: true,
        sampleCount: samples.length,
      };
    }
  }

  return null;
}

// Local alias so the helper file stays the source of truth for age policy.
const MAX_ACCEPTABLE_FIX_AGE_MS_LOCAL = 45_000;

async function buildGpsLocation(
  sample: GpsFixSample,
  options: { fromWatch: boolean; fromLastKnown: boolean },
): Promise<DeliveryLocation> {
  const classified = classifyGpsFix(sample, options);
  const reversed = await reverseGeocodeCoords(sample.latitude, sample.longitude, 'gps');
  const base =
    reversed.status === 'ready'
      ? reversed.location
      : withCoords(
          {
            label: 'Current location',
            addressLine1: `${sample.latitude.toFixed(5)}, ${sample.longitude.toFixed(5)}`,
          },
          sample.latitude,
          sample.longitude,
          'gps',
          true,
        );

  const webBrowser =
    Platform.OS === 'web'
      ? {
          // Browser Geolocation is often Wi‑Fi/IP — never present it as verified doorstep GPS.
          approximate: true as const,
          fixKind:
            classified.kind === 'fresh-gps' || classified.kind === 'watched-gps'
              ? ('network-or-coarse' as const)
              : classified.kind,
          fixNote:
            classified.reason ||
            'Browser geolocation can be 1–5 km off on Wi‑Fi/IP. Adjust the delivery pin before confirming.',
        }
      : null;

  return {
    ...base,
    id: 'gps',
    label: 'Current location',
    source: 'gps',
    // Always keep the raw GPS numbers — never replace with geocoded approximations.
    latitude: sample.latitude,
    longitude: sample.longitude,
    accuracyMeters: sample.accuracyMeters ?? undefined,
    fixAgeMs: fixAgeMs(sample.timestamp),
    fixKind: webBrowser?.fixKind ?? classified.kind,
    fixNote: webBrowser?.fixNote ?? classified.reason,
    approximate:
      webBrowser?.approximate ||
      classified.approximate ||
      base.approximate ||
      reversed.status !== 'ready',
  };
}

export async function readCurrentLocation(): Promise<CurrentLocationOutcome> {
  let servicesEnabled = false;
  try {
    servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      logLocationDiagnostics('services-off', {
        permission: 'unknown',
        precise: false,
        servicesEnabled: false,
        platform: Platform.OS,
        sampleCount: 0,
        bestAccuracyMeters: null,
        bestAgeMs: null,
        fixKind: null,
        note: 'Device location services are off.',
      });
      return { status: 'services-off' };
    }
  } catch {
    return { status: 'unavailable' };
  }

  if (Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      // User dismissed improved-accuracy dialog.
    }
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    logLocationDiagnostics('denied', {
      permission: 'denied',
      precise: false,
      servicesEnabled,
      platform: Platform.OS,
      sampleCount: 0,
      bestAccuracyMeters: null,
      bestAgeMs: null,
      fixKind: null,
      note: 'Foreground location permission denied.',
    });
    return { status: 'denied' };
  }

  const precise = isPreciseLocationGranted(permission);

  try {
    const acquired = await acquireBestPosition(!precise);
    if (!acquired) {
      logLocationDiagnostics('timeout', {
        permission: 'granted',
        precise,
        servicesEnabled,
        platform: Platform.OS,
        sampleCount: 0,
        bestAccuracyMeters: null,
        bestAgeMs: null,
        fixKind: null,
        note: 'No usable GPS sample within the acquisition window.',
      });
      return { status: 'timeout' };
    }

    const location = await buildGpsLocation(acquired.sample, {
      fromWatch: acquired.fromWatch,
      fromLastKnown: acquired.fromLastKnown,
    });

    logLocationDiagnostics('ready', {
      permission: 'granted',
      precise,
      servicesEnabled,
      platform: Platform.OS,
      sampleCount: acquired.sampleCount,
      bestAccuracyMeters: location.accuracyMeters ?? null,
      bestAgeMs: location.fixAgeMs ?? null,
      fixKind: location.fixKind ?? null,
      note: location.fixNote ?? '',
    });

    if (!precise || location.fixKind === 'network-or-coarse' || location.fixKind === 'last-known') {
      return { status: 'approximate-permission', location };
    }

    return { status: 'ready', location };
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      return { status: 'timeout' };
    }
    return { status: 'unavailable' };
  }
}

/**
 * Forward search using Expo Location geocoding (device/OS provider).
 * Also matches the local reference catalog. Does not invent a remote Places API.
 */
export async function searchDeliveryLocations(query: string): Promise<LocationSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const needle = trimmed.toLowerCase();
  const localHits: LocationSearchResult[] = referenceLocations
    .filter((place) => `${place.label} ${formatDeliveryAddress(place)}`.toLowerCase().includes(needle))
    .map((place) => ({
      id: `ref-${place.id}`,
      title: place.label,
      subtitle: formatDeliveryAddress(place),
      location: { ...place, source: 'search' as const, fixKind: 'search' as const, approximate: true },
    }));

  let remote: LocationSearchResult[] = [];
  try {
    const coords = await Promise.race([
      Location.geocodeAsync(trimmed),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), SEARCH_TIMEOUT_MS);
      }),
    ]);

    const limited = coords.slice(0, 6);
    const resolved: LocationSearchResult[] = [];
    for (let index = 0; index < limited.length; index += 1) {
      const point = limited[index]!;
      const reversed = await reverseGeocodeCoords(point.latitude, point.longitude, 'search');
      if (reversed.status !== 'ready') {
        continue;
      }
      const location = reversed.location;
      const title = location.locality || location.label || trimmed;
      const subtitle = formatDeliveryAddress(location);
      resolved.push({
        id: `geo-${index}-${point.latitude.toFixed(4)}-${point.longitude.toFixed(4)}`,
        title,
        subtitle,
        location: {
          ...location,
          id: `search-${point.latitude.toFixed(5)}-${point.longitude.toFixed(5)}`,
          label: title,
          source: 'search',
          fixKind: 'search',
          approximate: true,
          fixNote: 'Search/geocode result — adjust the map pin for doorstep accuracy.',
        },
      });
    }
    remote = resolved;
  } catch {
    // OS geocode unavailable (web / timeout / denied). Local catalog may still match.
  }

  const seen = new Set<string>();
  const merged: LocationSearchResult[] = [];
  for (const item of [...localHits, ...remote]) {
    const key = `${item.title}|${item.subtitle}`.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(item);
  }
  return merged;
}
