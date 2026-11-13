/**
 * Pure helpers for GPS fix selection / confidence labeling.
 * Kept free of expo-location so scripts can unit-test without native modules.
 */

export type GpsFixSample = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  timestamp: number;
  /** True when OS permission is coarse/reduced (not precise). */
  coarsePermission?: boolean;
};

export type GpsFixKind = 'watched-gps' | 'fresh-gps' | 'last-known' | 'network-or-coarse';

export const MAX_ACCEPTABLE_FIX_AGE_MS = 45_000;
export const TARGET_ACCURACY_M = 50;
export const LOW_CONFIDENCE_ACCURACY_M = 100;
/** Samples worse than this are treated as network/coarse noise, not doorstep GPS. */
export const NETWORK_LIKE_ACCURACY_M = 500;

export function fixAgeMs(timestamp: number, now = Date.now()): number {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, now - timestamp);
}

export function isValidLatLng(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

export function isFreshEnough(sample: GpsFixSample, now = Date.now()): boolean {
  return isValidLatLng(sample.latitude, sample.longitude) && fixAgeMs(sample.timestamp, now) <= MAX_ACCEPTABLE_FIX_AGE_MS;
}

/**
 * Prefer lower accuracy radius, then fresher timestamp.
 * Returns null when no usable sample exists.
 */
export function pickBestGpsSample(samples: readonly GpsFixSample[], now = Date.now()): GpsFixSample | null {
  let best: GpsFixSample | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const sample of samples) {
    if (!isFreshEnough(sample, now)) {
      continue;
    }
    const accuracy =
      typeof sample.accuracyMeters === 'number' && Number.isFinite(sample.accuracyMeters)
        ? Math.max(0, sample.accuracyMeters)
        : NETWORK_LIKE_ACCURACY_M;
    const age = fixAgeMs(sample.timestamp, now);
    // Weight accuracy heavily; age breaks ties (newer is better).
    const score = accuracy * 1000 + age;
    if (score < bestScore) {
      bestScore = score;
      best = sample;
    }
  }
  return best;
}

export function classifyGpsFix(sample: GpsFixSample, options?: { fromWatch?: boolean; fromLastKnown?: boolean }): {
  kind: GpsFixKind;
  approximate: boolean;
  reason: string;
} {
  const accuracy =
    typeof sample.accuracyMeters === 'number' && Number.isFinite(sample.accuracyMeters)
      ? sample.accuracyMeters
      : null;
  const age = fixAgeMs(sample.timestamp);

  if (options?.fromLastKnown) {
    return {
      kind: 'last-known',
      approximate: true,
      reason: 'Cached last-known position — not a verified fresh GPS fix.',
    };
  }

  if (sample.coarsePermission) {
    return {
      kind: 'network-or-coarse',
      approximate: true,
      reason: 'Precise/Fine location permission is not granted.',
    };
  }

  if (accuracy != null && accuracy >= NETWORK_LIKE_ACCURACY_M) {
    return {
      kind: 'network-or-coarse',
      approximate: true,
      reason: `Reported accuracy ±${Math.round(accuracy)} m looks like network/Wi‑Fi location.`,
    };
  }

  if (accuracy != null && accuracy > LOW_CONFIDENCE_ACCURACY_M) {
    return {
      kind: options?.fromWatch ? 'watched-gps' : 'fresh-gps',
      approximate: true,
      reason: `GPS accuracy is low (±${Math.round(accuracy)} m). Move outdoors or adjust the pin.`,
    };
  }

  if (age > 30_000) {
    return {
      kind: options?.fromWatch ? 'watched-gps' : 'fresh-gps',
      approximate: true,
      reason: `Fix is ${Math.round(age / 1000)}s old.`,
    };
  }

  return {
    kind: options?.fromWatch ? 'watched-gps' : 'fresh-gps',
    approximate: accuracy != null ? accuracy > TARGET_ACCURACY_M : false,
    reason:
      accuracy != null
        ? `Accepted GPS fix (±${Math.round(accuracy)} m).`
        : 'Accepted GPS fix (accuracy not reported).',
  };
}

/** GeoJSON / some map SDKs use [longitude, latitude] — never swap. */
export function mapLibreCenterFromLatLng(latitude: number, longitude: number): [number, number] {
  return [longitude, latitude];
}

export function latLngFromMapLibreCenter(center: readonly [number, number] | number[]): {
  latitude: number;
  longitude: number;
} {
  return { longitude: Number(center[0]), latitude: Number(center[1]) };
}

/** Alias: Google Maps JS and most app code use { latitude, longitude }. */
export const lngLatPairFromLatLng = mapLibreCenterFromLatLng;
export const latLngFromLngLatPair = latLngFromMapLibreCenter;
