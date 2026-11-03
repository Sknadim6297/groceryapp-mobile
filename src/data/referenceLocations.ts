import type { DeliveryLocation } from '@/types/location';

/**
 * Offline catalog suggestions for Select Delivery Location.
 * Not customer saved addresses. Used when device geocoding is empty or as supplemental matches.
 * Coordinates are approximate city/locality centers — not doorstep accuracy.
 */
export const referenceLocations: readonly DeliveryLocation[] = [
  {
    id: 'mayapur',
    label: 'Mayapur',
    addressLine1: 'Mayapur',
    locality: 'Mayapur',
    city: 'Nadia',
    state: 'West Bengal',
    postalCode: '741313',
    country: 'India',
    latitude: 23.4241,
    longitude: 88.3915,
    source: 'search',
  },
  {
    id: 'kestopur',
    label: 'Kestopur',
    addressLine1: 'Kestopur',
    locality: 'Kestopur',
    city: 'Kolkata',
    state: 'West Bengal',
    postalCode: '700102',
    country: 'India',
    latitude: 22.5958,
    longitude: 88.4332,
    source: 'search',
  },
  {
    id: 'rajarhat',
    label: 'Rajarhat',
    addressLine1: 'Rajarhat',
    locality: 'Rajarhat',
    city: 'Kolkata',
    state: 'West Bengal',
    postalCode: '700135',
    country: 'India',
    latitude: 22.6231,
    longitude: 88.4471,
    source: 'search',
  },
  {
    id: 'charbagh',
    label: 'Charbagh',
    addressLine1: 'Charbagh',
    locality: 'Charbagh',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    postalCode: '226004',
    country: 'India',
    latitude: 26.8322,
    longitude: 80.9214,
    source: 'search',
  },
];

export function formatDeliveryAddress(location: DeliveryLocation): string {
  return [
    location.addressLine1,
    location.locality && location.locality !== location.addressLine1 ? location.locality : null,
    location.landmark,
    location.city,
    location.state,
    location.postalCode,
  ]
    .filter((part) => part && part.trim().length > 0)
    .join(', ');
}
