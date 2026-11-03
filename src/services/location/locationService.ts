import * as Location from 'expo-location';

import { formatDeliveryAddress, referenceLocations } from '@/data/referenceLocations';
import type { DeliveryLocation, LocationSearchResult } from '@/types/location';

const LOCATE_TIMEOUT_MS = 12000;
const SEARCH_TIMEOUT_MS = 10000;

export type CurrentLocationOutcome =
  | { status: 'ready'; location: DeliveryLocation }
  | { status: 'denied' }
  | { status: 'services-off' }
  | { status: 'timeout' }
  | { status: 'unavailable' };

export type ReverseGeocodeOutcome =
  | { status: 'ready'; location: DeliveryLocation }
  | { status: 'unavailable' };

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
    Partial<Pick<DeliveryLocation, 'id' | 'source' | 'approximate'>>,
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
  };
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
      location: withCoords(address, latitude, longitude, source),
    };
  } catch {
    return { status: 'unavailable' };
  }
}

export async function readCurrentLocation(): Promise<CurrentLocationOutcome> {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      return { status: 'services-off' };
    }
  } catch {
    return { status: 'unavailable' };
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    return { status: 'denied' };
  }

  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), LOCATE_TIMEOUT_MS);
      }),
    ]);

    const { latitude, longitude, accuracy } = position.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { status: 'unavailable' };
    }

    // GPS and reverse-geocode are separate: keep valid coordinates even if address lookup fails.
    const reversed = await reverseGeocodeCoords(latitude, longitude, 'gps');
    const base =
      reversed.status === 'ready'
        ? reversed.location
        : withCoords(
            {
              label: 'Current location',
              addressLine1: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            },
            latitude,
            longitude,
            'gps',
            true,
          );

    return {
      status: 'ready',
      location: {
        ...base,
        id: 'gps',
        label: 'Current location',
        source: 'gps',
        approximate: (accuracy ?? 0) > 100 || base.approximate || reversed.status !== 'ready',
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'timeout') {
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
      location: { ...place, source: 'search' as const },
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
