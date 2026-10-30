import * as Location from 'expo-location';

import { UI_PREVIEW_MODE } from '@/constants/preview';
import type { DeliveryLocation } from '@/types/location';

const LOCATE_TIMEOUT_MS = 12000;

export type CurrentLocationOutcome =
  | { status: 'ready'; location: DeliveryLocation }
  | { status: 'denied' }
  | { status: 'services-off' }
  | { status: 'timeout' }
  | { status: 'unavailable' };

function addressFromPlace(place: Location.LocationGeocodedAddress): Pick<
  DeliveryLocation,
  'addressLine1' | 'city' | 'state' | 'postalCode' | 'country'
> | null {
  const street = [place.streetNumber, place.street].filter(Boolean).join(' ');
  const addressLine1 = street || place.name || place.district || '';
  const city = place.city || place.subregion || '';

  if (!addressLine1 && !city) {
    return null;
  }

  return {
    addressLine1: addressLine1 || city,
    city: city || undefined,
    state: place.region || undefined,
    postalCode: place.postalCode || undefined,
    country: place.country || undefined,
  };
}

export async function readCurrentLocation(): Promise<CurrentLocationOutcome> {
  if (UI_PREVIEW_MODE) {
    return { status: 'unavailable' };
  }

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
    const places = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    const address = places[0] ? addressFromPlace(places[0]) : null;

    if (!address) {
      return { status: 'unavailable' };
    }

    return {
      status: 'ready',
      location: {
        id: 'gps',
        label: 'Current location',
        ...address,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        source: 'gps',
        approximate: (position.coords.accuracy ?? 0) > 100,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'timeout') {
      return { status: 'timeout' };
    }
    return { status: 'unavailable' };
  }
}
