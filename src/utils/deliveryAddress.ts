import type { DeliveryLocation } from '@/types/location';
import type { SavedAddress } from '@/types/savedAddress';
import { normalizePostalCode } from '@/utils/savedAddressValidation';

/**
 * A map pin / GPS locality alone is not enough for doorstep grocery delivery.
 * Complete means enough structured fields to hand to a rider (street + city + PIN).
 */
export function isCompleteDeliveryLocation(location: DeliveryLocation | null | undefined): boolean {
  if (!location) {
    return false;
  }
  const street = location.addressLine1.trim();
  const city = (location.city ?? '').trim();
  const pin = normalizePostalCode(location.postalCode ?? '');
  return street.length >= 5 && city.length >= 2 && pin.length === 6;
}

export function isCompleteSavedAddress(address: SavedAddress | null | undefined): boolean {
  if (!address) {
    return false;
  }
  return (
    address.addressLine1.trim().length >= 5 &&
    address.city.trim().length >= 2 &&
    address.state.trim().length >= 2 &&
    normalizePostalCode(address.postalCode).length === 6
  );
}

/** Great-circle distance in km when both coordinate pairs are present. */
export function distanceKmBetween(
  a: { latitude?: number; longitude?: number } | null | undefined,
  b: { latitude?: number; longitude?: number } | null | undefined,
): number | null {
  if (
    a?.latitude == null ||
    a.longitude == null ||
    b?.latitude == null ||
    b.longitude == null ||
    !Number.isFinite(a.latitude) ||
    !Number.isFinite(a.longitude) ||
    !Number.isFinite(b.latitude) ||
    !Number.isFinite(b.longitude)
  ) {
    return null;
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return earthKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistanceKm(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} kms`;
}
