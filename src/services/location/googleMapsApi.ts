import type { DeliveryLocation, LocationSearchResult } from '@/types/location';
import { formatDeliveryAddress } from '@/data/referenceLocations';

/**
 * Client-side Google Geocoding + Places Autocomplete (New).
 * Uses EXPO_PUBLIC_GOOGLE_MAPS_API_KEY — restrict that key in Cloud Console
 * (HTTP referrers for web, Android/iOS app restrictions for native where possible,
 * and API restrictions: Geocoding + Places).
 */

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';

const REQUEST_TIMEOUT_MS = 10_000;

type GeocodeResult = {
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry?: {
    location?: { lat: number; lng: number };
  };
};

type GeocodeResponse = {
  status: string;
  results?: GeocodeResult[];
  error_message?: string;
};

function googleMapsApiKey(): string {
  return (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();
}

export function isGoogleMapsApiConfigured(): boolean {
  return googleMapsApiKey().length > 8;
}

function component(
  parts: GeocodeResult['address_components'],
  type: string,
): string {
  const hit = parts?.find((part) => part.types.includes(type));
  return hit?.long_name?.trim() ?? '';
}

function addressFromGeocode(
  result: GeocodeResult,
  latitude: number,
  longitude: number,
  source: DeliveryLocation['source'],
): DeliveryLocation {
  const parts = result.address_components ?? [];
  const streetNumber = component(parts, 'street_number');
  const route = component(parts, 'route');
  const premise = component(parts, 'premise');
  const sublocality =
    component(parts, 'sublocality_level_1') ||
    component(parts, 'sublocality') ||
    component(parts, 'neighborhood');
  const locality =
    component(parts, 'locality') ||
    component(parts, 'administrative_area_level_2') ||
    sublocality;
  const street = [streetNumber, route].filter(Boolean).join(' ');
  const addressLine1 = street || premise || sublocality || result.formatted_address || locality;
  const city = component(parts, 'locality') || component(parts, 'administrative_area_level_2');
  const state = component(parts, 'administrative_area_level_1');
  const postalCode = component(parts, 'postal_code');
  const country = component(parts, 'country');
  const label = sublocality || locality || city || 'Selected location';

  return {
    id: `${source}-${latitude.toFixed(5)}-${longitude.toFixed(5)}`,
    label,
    addressLine1: addressLine1 || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    locality: sublocality || undefined,
    city: city || undefined,
    state: state || undefined,
    postalCode: postalCode || undefined,
    country: country || undefined,
    latitude,
    longitude,
    source,
    approximate: source === 'search',
    fixKind: source === 'map' ? 'map-pin' : source === 'search' ? 'search' : undefined,
    fixNote:
      source === 'search'
        ? 'Google Places result — adjust the map pin for doorstep accuracy.'
        : undefined,
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function googleReverseGeocode(
  latitude: number,
  longitude: number,
  source: DeliveryLocation['source'] = 'map',
): Promise<DeliveryLocation | null> {
  const key = googleMapsApiKey();
  if (!key) {
    return null;
  }
  const url =
    `${GEOCODE_URL}?latlng=${encodeURIComponent(`${latitude},${longitude}`)}` +
    `&key=${encodeURIComponent(key)}&language=en&region=in`;
  try {
    const data = await fetchJson<GeocodeResponse>(url);
    if (data.status !== 'OK' || !data.results?.[0]) {
      if (__DEV__ && data.status !== 'ZERO_RESULTS') {
        console.warn('[google-geocode:reverse]', data.status, data.error_message ?? '');
      }
      return null;
    }
    return addressFromGeocode(data.results[0], latitude, longitude, source);
  } catch (error) {
    if (__DEV__) {
      console.warn('[google-geocode:reverse]', error);
    }
    return null;
  }
}

export async function googleForwardGeocode(query: string): Promise<LocationSearchResult[]> {
  const key = googleMapsApiKey();
  const trimmed = query.trim();
  if (!key || trimmed.length < 2) {
    return [];
  }
  const url =
    `${GEOCODE_URL}?address=${encodeURIComponent(trimmed)}` +
    `&key=${encodeURIComponent(key)}&language=en&region=in&components=country:IN`;
  try {
    const data = await fetchJson<GeocodeResponse>(url);
    if (data.status !== 'OK' || !data.results?.length) {
      return [];
    }
    return data.results.slice(0, 6).map((result, index) => {
      const lat = result.geometry?.location?.lat ?? 0;
      const lng = result.geometry?.location?.lng ?? 0;
      const location = addressFromGeocode(result, lat, lng, 'search');
      return {
        id: `ggeo-${index}-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        title: location.locality || location.label || trimmed,
        subtitle: result.formatted_address || formatDeliveryAddress(location),
        location,
      };
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[google-geocode:forward]', error);
    }
    return [];
  }
}

type PlacesAutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
  error?: { message?: string; status?: string };
};

type PlaceDetailsResponse = {
  id?: string;
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
  displayName?: { text?: string };
};

/**
 * Places Autocomplete (New) — preferred search UX when the key has Places API enabled.
 * Falls back to empty so callers can use Geocoding.
 */
export async function googlePlacesAutocomplete(
  query: string,
  bias?: { latitude: number; longitude: number },
): Promise<LocationSearchResult[]> {
  const key = googleMapsApiKey();
  const trimmed = query.trim();
  if (!key || trimmed.length < 2) {
    return [];
  }

  const body: Record<string, unknown> = {
    input: trimmed,
    languageCode: 'en',
    regionCode: 'IN',
    includedRegionCodes: ['IN'],
  };
  if (bias && Number.isFinite(bias.latitude) && Number.isFinite(bias.longitude)) {
    body.locationBias = {
      circle: {
        center: { latitude: bias.latitude, longitude: bias.longitude },
        radius: 40_000,
      },
    };
  }

  try {
    const data = await fetchJson<PlacesAutocompleteResponse>(PLACES_AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
      },
      body: JSON.stringify(body),
    });

    const predictions = (data.suggestions ?? [])
      .map((row) => row.placePrediction)
      .filter((row): row is NonNullable<typeof row> => Boolean(row?.placeId))
      .slice(0, 6);

    const resolved: LocationSearchResult[] = [];
    for (const prediction of predictions) {
      const placeId = prediction.placeId!;
      const details = await googlePlaceDetails(placeId);
      if (!details) {
        continue;
      }
      resolved.push(details);
    }
    return resolved;
  } catch (error) {
    if (__DEV__) {
      console.warn('[google-places:autocomplete]', error);
    }
    return [];
  }
}

async function googlePlaceDetails(placeId: string): Promise<LocationSearchResult | null> {
  const key = googleMapsApiKey();
  if (!key) {
    return null;
  }
  const fieldMask = 'id,formattedAddress,location,addressComponents,displayName';
  const resource = placeId.startsWith('places/') ? placeId : `places/${placeId}`;
  const url = `https://places.googleapis.com/v1/${resource}`;
  try {
    const data = await fetchJson<PlaceDetailsResponse>(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': fieldMask,
      },
    });
    const latitude = data.location?.latitude;
    const longitude = data.location?.longitude;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    const asGeocode: GeocodeResult = {
      formatted_address: data.formattedAddress,
      address_components: (data.addressComponents ?? []).map((part) => ({
        long_name: part.longText ?? '',
        short_name: part.shortText ?? part.longText ?? '',
        types: part.types ?? [],
      })),
      geometry: { location: { lat: latitude!, lng: longitude! } },
    };
    const location = addressFromGeocode(asGeocode, latitude!, longitude!, 'search');
    const title =
      data.displayName?.text || location.locality || location.label || 'Selected place';
    return {
      id: `gplace-${placeId}`,
      title,
      subtitle: data.formattedAddress || formatDeliveryAddress(location),
      location: { ...location, label: title },
    };
  } catch (error) {
    if (__DEV__) {
      console.warn('[google-places:details]', error);
    }
    return null;
  }
}
