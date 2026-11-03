import type { MapRegion } from '@/components/location/mapRegion';

/** Degrees — roughly 5–8 m near the equator; used to ignore floating noise. */
export const REGION_EPSILON_DEG = 0.00005;

export function regionDistanceDeg(a: Pick<MapRegion, 'latitude' | 'longitude'>, b: Pick<MapRegion, 'latitude' | 'longitude'>): number {
  return Math.max(Math.abs(a.latitude - b.latitude), Math.abs(a.longitude - b.longitude));
}

export function regionsNearlyEqual(
  a: Pick<MapRegion, 'latitude' | 'longitude'>,
  b: Pick<MapRegion, 'latitude' | 'longitude'>,
  epsilon = REGION_EPSILON_DEG,
): boolean {
  return regionDistanceDeg(a, b) < epsilon;
}

export function isValidMapCoordinate(latitude: number | undefined, longitude: number | undefined): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}
