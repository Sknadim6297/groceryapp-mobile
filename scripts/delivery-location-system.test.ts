/**
 * Delivery location architecture + completeness + distance helpers.
 * Run: npx --yes tsx scripts/delivery-location-system.test.ts
 */

import { locationContinueTarget } from '../src/navigation/locationFlow';
import { formatDeliveryAddress, referenceLocations } from '../src/data/referenceLocations';
import {
  distanceKmBetween,
  formatDistanceKm,
  isCompleteDeliveryLocation,
} from '../src/utils/deliveryAddress';
import {
  composeAddressLine1,
  emptyAddressDraft,
  isAddressDraftReady,
  validateAddressDraft,
} from '../src/utils/savedAddressValidation';
import { deliveryLocationToDraft, finalizeAddressDraft } from '../src/utils/savedAddressMapping';
import type { DeliveryLocation } from '../src/types/location';

const pinOnly: DeliveryLocation = {
  id: 'pin',
  label: 'Rajarhat',
  addressLine1: 'Rajarhat',
  city: 'Kolkata',
  source: 'map',
  latitude: 22.62,
  longitude: 88.44,
};

if (isCompleteDeliveryLocation(pinOnly)) {
  throw new Error('locality-only map pin must not count as a complete checkout address');
}

const complete: DeliveryLocation = {
  id: 'home',
  label: 'Home',
  addressLine1: '12B, Kestopur Main Road',
  locality: 'Kestopur',
  city: 'Kolkata',
  state: 'West Bengal',
  postalCode: '700102',
  source: 'saved',
  latitude: 22.59,
  longitude: 88.43,
};

if (!isCompleteDeliveryLocation(complete)) {
  throw new Error('house-level address with city and PIN must be complete');
}

const km = distanceKmBetween(pinOnly, complete);
if (km == null || km <= 0) {
  throw new Error('distance must compute when both coordinate pairs exist');
}
if (!formatDistanceKm(km).includes('kms') && !formatDistanceKm(km).includes('m')) {
  throw new Error('distance formatter must return human units');
}
if (distanceKmBetween(pinOnly, { latitude: undefined, longitude: 1 }) !== null) {
  throw new Error('distance must be null when a coordinate is missing');
}

const draft = deliveryLocationToDraft(complete);
const finalized = finalizeAddressDraft({
  ...emptyAddressDraft(),
  ...draft,
  houseNumber: '12B',
  buildingStreet: 'Kestopur Main Road',
  area: 'Kestopur',
  city: 'Kolkata',
  state: 'West Bengal',
  postalCode: '700102',
});
if (!isAddressDraftReady(finalized)) {
  throw new Error(`save form draft should be ready: ${JSON.stringify(validateAddressDraft(finalized))}`);
}
if (composeAddressLine1(finalized) !== '12B, Kestopur Main Road') {
  throw new Error('composed address line must join house and street');
}

const afterLocation = locationContinueTarget({
  intent: 'registration',
  canGoBack: true,
  signedIn: false,
  onboarding: true,
  profileNameReady: true,
});
if (afterLocation !== 'submit-registration') {
  throw new Error('registration with ready name must submit after Set Location');
}

if (referenceLocations.length < 2) {
  throw new Error('offline catalog must provide searchable localities');
}
for (const place of referenceLocations) {
  if (!place.latitude || !place.longitude) {
    throw new Error(`catalog entry ${place.id} needs coordinates for map centering`);
  }
  if (!formatDeliveryAddress(place).includes(place.city ?? '')) {
    throw new Error(`catalog formatting failed for ${place.id}`);
  }
}

console.log('delivery location system fixtures passed');
