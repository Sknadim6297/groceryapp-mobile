import type { DeliveryLocation } from '@/types/location';
import type { SavedAddress, SavedAddressDraft } from '@/types/savedAddress';
import { draftSourceFromDeliveryLocation } from '@/utils/addressSelectionRules';
import { composeAddressLine1, displayAddressLabel, emptyAddressDraft } from '@/utils/savedAddressValidation';

function splitLegacyLine(addressLine1: string): { houseNumber: string; buildingStreet: string } {
  const trimmed = addressLine1.trim();
  if (!trimmed) {
    return { houseNumber: '', buildingStreet: '' };
  }
  const comma = trimmed.indexOf(',');
  if (comma > 0 && comma < trimmed.length - 1) {
    return {
      houseNumber: trimmed.slice(0, comma).trim(),
      buildingStreet: trimmed.slice(comma + 1).trim(),
    };
  }
  return { houseNumber: '', buildingStreet: trimmed };
}

export function savedAddressToDeliveryLocation(address: SavedAddress): DeliveryLocation {
  return {
    id: address.id,
    label: displayAddressLabel(address),
    addressLine1: address.addressLine1,
    landmark: address.landmark,
    locality: address.area,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    latitude: address.latitude,
    longitude: address.longitude,
    source: 'saved',
    fixKind: 'saved',
  };
}

export function savedAddressToDraft(address: SavedAddress): SavedAddressDraft {
  const split = splitLegacyLine(address.addressLine1);
  return {
    label: address.label,
    customLabel: address.customLabel ?? '',
    houseNumber: address.houseNumber ?? split.houseNumber,
    buildingStreet: address.buildingStreet ?? split.buildingStreet,
    area: address.area ?? '',
    addressLine1: address.addressLine1,
    landmark: address.landmark ?? '',
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    instructions: address.instructions ?? '',
    latitude: address.latitude,
    longitude: address.longitude,
    source: address.source,
  };
}

export function deliveryLocationToDraft(location: DeliveryLocation, base?: SavedAddressDraft): SavedAddressDraft {
  const current = base ?? emptyAddressDraft();
  const label =
    location.label === 'Home' || location.label === 'Work'
      ? location.label
      : current.label === 'Home' || current.label === 'Work'
        ? current.label
        : 'Other';
  const split = splitLegacyLine(location.addressLine1 || current.buildingStreet);
  return {
    ...current,
    label,
    customLabel: label === 'Other' ? (location.label !== 'Other' ? location.label : current.customLabel) : '',
    houseNumber: current.houseNumber || split.houseNumber,
    buildingStreet: current.buildingStreet || split.buildingStreet || location.addressLine1 || '',
    area: location.locality || current.area,
    addressLine1: location.addressLine1 || composeAddressLine1(current),
    landmark: location.landmark ?? current.landmark,
    city: location.city ?? current.city,
    state: location.state ?? current.state,
    postalCode: location.postalCode ?? current.postalCode,
    latitude: location.latitude ?? current.latitude,
    longitude: location.longitude ?? current.longitude,
    source: draftSourceFromDeliveryLocation(location.source, current.source),
  };
}

export function formatSavedAddressLines(address: SavedAddress): string {
  return [
    address.houseNumber,
    address.buildingStreet || address.addressLine1,
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.postalCode,
  ]
    .filter((part) => part && part.trim().length > 0)
    .join(', ');
}

/** Normalize draft before persist — compose addressLine1 from structured fields. */
export function finalizeAddressDraft(draft: SavedAddressDraft): SavedAddressDraft {
  return {
    ...draft,
    addressLine1: composeAddressLine1(draft),
    postalCode: draft.postalCode,
  };
}
