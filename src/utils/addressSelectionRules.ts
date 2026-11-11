import type { DeliveryLocation, LocationSource } from '@/types/location';
import type { SavedAddress } from '@/types/savedAddress';

/**
 * After deleting a saved address, only rewrite the active delivery pick when
 * that pick was the deleted address. Never replace a GPS/map/manual pin (or a
 * different saved selection) with the next default.
 */
export function resolveConfirmedAfterDelete(options: {
  confirmedId: string | null | undefined;
  deletedId: string;
  nextAddresses: readonly SavedAddress[];
}): 'keep' | 'clear' | { applyId: string } {
  if (options.confirmedId !== options.deletedId) {
    return 'keep';
  }
  const nextDefault =
    options.nextAddresses.find((address) => address.isDefault) ?? options.nextAddresses[0] ?? null;
  if (nextDefault) {
    return { applyId: nextDefault.id };
  }
  return 'clear';
}

/** Keep confirmed delivery in sync when the selected/default saved address is edited. */
export function shouldUpdateConfirmedAfterSave(options: {
  saved: Pick<SavedAddress, 'id' | 'isDefault'>;
  confirmedId: string | null | undefined;
}): boolean {
  return options.saved.isDefault || options.saved.id === options.confirmedId;
}

/**
 * Preserve map/search/gps/manual sources when baking a picker result into the
 * address form. Do not collapse map/search into "manual".
 */
export function draftSourceFromDeliveryLocation(
  locationSource: LocationSource,
  currentSource: LocationSource,
): LocationSource {
  if (locationSource === 'saved') {
    return currentSource === 'saved' ? 'manual' : currentSource;
  }
  return locationSource;
}

/** Human-readable origin for GPS vs map pin vs saved address. */
export function describeDeliveryLocationOrigin(location: Pick<DeliveryLocation, 'source' | 'fixKind'>): string {
  if (location.source === 'map' || location.fixKind === 'map-pin') {
    return 'Map pin';
  }
  if (location.source === 'gps') {
    return 'GPS';
  }
  if (location.source === 'search') {
    return 'Search';
  }
  if (location.source === 'saved' || location.fixKind === 'saved') {
    return 'Saved address';
  }
  return 'Entered address';
}

/**
 * When the customer manually adjusts the pin, drop GPS accuracy metadata so the
 * UI does not keep advertising a stale GPS radius for a map-confirmed point.
 */
export function asManualMapPin(
  location: DeliveryLocation,
  coords: { latitude: number; longitude: number },
): DeliveryLocation {
  return {
    ...location,
    latitude: coords.latitude,
    longitude: coords.longitude,
    source: 'map',
    fixKind: 'map-pin',
    accuracyMeters: undefined,
    approximate: undefined,
    fixAgeMs: undefined,
    fixNote: undefined,
  };
}
