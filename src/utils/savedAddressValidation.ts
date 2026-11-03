import type { AddressLabel, SavedAddress, SavedAddressDraft } from '@/types/savedAddress';

export type AddressFieldErrors = {
  houseNumber?: string;
  buildingStreet?: string;
  area?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  label?: string;
  customLabel?: string;
};

export function emptyAddressDraft(): SavedAddressDraft {
  return {
    label: 'Home',
    customLabel: '',
    houseNumber: '',
    buildingStreet: '',
    area: '',
    addressLine1: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    instructions: '',
    source: 'manual',
  };
}

export function normalizePostalCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}

export function composeAddressLine1(draft: Pick<SavedAddressDraft, 'houseNumber' | 'buildingStreet' | 'addressLine1'>): string {
  const composed = [draft.houseNumber.trim(), draft.buildingStreet.trim()].filter((part) => part.length > 0).join(', ');
  return composed || draft.addressLine1.trim();
}

export function displayAddressLabel(address: Pick<SavedAddress, 'label' | 'customLabel'>): string {
  if (address.label === 'Other') {
    const custom = address.customLabel?.trim();
    return custom && custom.length > 0 ? custom : 'Other';
  }
  return address.label;
}

export function addressFingerprint(input: {
  addressLine1: string;
  city: string;
  postalCode: string;
  label: AddressLabel;
  customLabel?: string;
}): string {
  return [
    input.label,
    input.label === 'Other' ? (input.customLabel ?? '').trim().toLowerCase() : '',
    input.addressLine1.trim().toLowerCase(),
    input.city.trim().toLowerCase(),
    normalizePostalCode(input.postalCode),
  ].join('|');
}

export function validateAddressDraft(draft: SavedAddressDraft): AddressFieldErrors {
  const errors: AddressFieldErrors = {};
  if (draft.houseNumber.trim().length === 0) {
    errors.houseNumber = 'Enter house / flat number.';
  }
  if (draft.buildingStreet.trim().length < 2) {
    errors.buildingStreet = 'Enter building or street.';
  }
  if (draft.area.trim().length < 2) {
    errors.area = 'Enter area / locality.';
  }
  const line = composeAddressLine1(draft);
  if (line.length < 5) {
    errors.addressLine1 = 'Enter a full street address.';
  }
  if (draft.city.trim().length < 2) {
    errors.city = 'Enter the city.';
  }
  if (draft.state.trim().length < 2) {
    errors.state = 'Enter the state.';
  }
  const pin = normalizePostalCode(draft.postalCode);
  if (pin.length !== 6) {
    errors.postalCode = 'Enter a 6-digit PIN code.';
  }
  if (draft.label === 'Other' && draft.customLabel.trim().length < 2) {
    errors.customLabel = 'Enter a short label for this address.';
  }
  return errors;
}

export function isAddressDraftReady(draft: SavedAddressDraft): boolean {
  return Object.keys(validateAddressDraft(draft)).length === 0;
}

export function findDuplicateAddress(
  addresses: readonly SavedAddress[],
  draft: SavedAddressDraft,
  excludeId?: string,
): SavedAddress | undefined {
  const needle = addressFingerprint({
    addressLine1: composeAddressLine1(draft),
    city: draft.city,
    postalCode: draft.postalCode,
    label: draft.label,
    customLabel: draft.customLabel,
  });
  return addresses.find((address) => {
    if (excludeId && address.id === excludeId) {
      return false;
    }
    return (
      addressFingerprint({
        addressLine1: address.addressLine1,
        city: address.city,
        postalCode: address.postalCode,
        label: address.label,
        customLabel: address.customLabel,
      }) === needle
    );
  });
}
