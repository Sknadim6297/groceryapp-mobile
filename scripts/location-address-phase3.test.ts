/**
 * Phase 3 regression: pin confirmation, coordinate persistence, address restore,
 * default/delete selection, owner isolation, GPS fallback, map→form handoff.
 * Run: npx --yes tsx scripts/location-address-phase3.test.ts
 */

import {
  addressOwnerKey,
  draftToSavedAddress,
  installSavedAddressStoreForTests,
  loadAddressBook,
  removeAddressFromList,
  saveAddressBook,
  withDefaultAddress,
} from '../src/services/savedAddressStore';
import {
  asManualMapPin,
  describeDeliveryLocationOrigin,
  draftSourceFromDeliveryLocation,
  resolveConfirmedAfterDelete,
  shouldUpdateConfirmedAfterSave,
} from '../src/utils/addressSelectionRules';
import {
  deliveryLocationToDraft,
  finalizeAddressDraft,
  savedAddressToDeliveryLocation,
  savedAddressToDraft,
} from '../src/utils/savedAddressMapping';
import {
  emptyAddressDraft,
  isAddressDraftReady,
  validateAddressDraft,
} from '../src/utils/savedAddressValidation';
import { pickBestGpsSample, type GpsFixSample } from '../src/utils/gpsFixQuality';
import type { DeliveryLocation } from '../src/types/location';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  // --- Manual pin confirmation + GPS metadata strip ---
  const gpsSeed: DeliveryLocation = {
    id: 'gps',
    label: 'Current location',
    addressLine1: 'Near temple',
    city: 'Mayapur',
    source: 'gps',
    latitude: 23.4241,
    longitude: 88.3915,
    accuracyMeters: 1200,
    approximate: true,
    fixKind: 'network-or-coarse',
    fixNote: 'Browser geolocation approximate',
  };
  const pin = asManualMapPin(gpsSeed, { latitude: 23.4255, longitude: 88.3922 });
  assert(pin.source === 'map' && pin.fixKind === 'map-pin', 'manual confirm must mark map-pin');
  assert(pin.latitude === 23.4255 && pin.longitude === 88.3922, 'confirmed pin must keep customer coords');
  assert(pin.accuracyMeters == null && pin.approximate == null, 'map pin must drop stale GPS accuracy');
  assert(describeDeliveryLocationOrigin(pin) === 'Map pin', 'origin label must distinguish map pin');
  assert(describeDeliveryLocationOrigin(gpsSeed) === 'GPS', 'origin label must distinguish GPS');

  // --- Map → address form handoff preserves coordinates + source ---
  const houseDetails = {
    ...emptyAddressDraft(),
    houseNumber: '12B',
    buildingStreet: 'Temple Road',
    area: 'Mayapur',
    city: 'Nadia',
    state: 'West Bengal',
    postalCode: '741313',
  };
  const handedOff = deliveryLocationToDraft(pin, houseDetails);
  assert(handedOff.latitude === 23.4255 && handedOff.longitude === 88.3922, 'handoff must keep pin coords');
  assert(handedOff.houseNumber === '12B', 'handoff must preserve house number while pin updates');
  assert(handedOff.source === 'map', 'map source must not collapse to manual');
  assert(draftSourceFromDeliveryLocation('search', 'manual') === 'search', 'search source must persist');
  assert(draftSourceFromDeliveryLocation('gps', 'manual') === 'gps', 'gps source must persist');

  const finalized = finalizeAddressDraft(handedOff);
  assert(isAddressDraftReady(finalized), `handoff draft should validate: ${JSON.stringify(validateAddressDraft(finalized))}`);

  // --- Coordinate persistence on saved address ---
  const saved = draftToSavedAddress(finalized, { isDefault: true });
  assert(saved.latitude === 23.4255 && saved.longitude === 88.3922, 'saved address must persist pin');
  assert(saved.source === 'map', 'saved address must keep map source');

  const restoredDraft = savedAddressToDraft(saved);
  assert(
    restoredDraft.latitude === saved.latitude && restoredDraft.longitude === saved.longitude,
    'editing must restore saved coordinates',
  );

  const restoredDelivery = savedAddressToDeliveryLocation(saved);
  assert(restoredDelivery.source === 'saved' && restoredDelivery.fixKind === 'saved', 'checkout uses saved origin');
  assert(
    restoredDelivery.latitude === saved.latitude && restoredDelivery.longitude === saved.longitude,
    'checkout selection must use confirmed saved coords',
  );

  // --- Default address changes ---
  const work = draftToSavedAddress(
    {
      ...finalized,
      label: 'Work',
      houseNumber: '1',
      buildingStreet: 'Market Lane',
      addressLine1: '1, Market Lane',
      latitude: 23.43,
      longitude: 88.4,
      source: 'manual',
    },
    { isDefault: false },
  );
  const withDefaultWork = withDefaultAddress([saved, work], work.id);
  assert(withDefaultWork.find((a) => a.id === work.id)?.isDefault === true, 'set default must flip Work');
  assert(withDefaultWork.filter((a) => a.isDefault).length === 1, 'only one default allowed');
  assert(
    shouldUpdateConfirmedAfterSave({ saved: withDefaultWork.find((a) => a.id === work.id)!, confirmedId: saved.id }),
    'new default must update confirmed delivery',
  );
  assert(
    shouldUpdateConfirmedAfterSave({ saved: work, confirmedId: work.id }),
    'editing the currently selected address must update confirmed',
  );
  assert(
    !shouldUpdateConfirmedAfterSave({ saved: work, confirmedId: saved.id }),
    'editing a non-selected non-default must not hijack confirmed',
  );

  // --- Address deletion must not overwrite unrelated confirmed picks ---
  const afterDeleteWork = removeAddressFromList(withDefaultWork, work.id);
  assert(
    resolveConfirmedAfterDelete({
      confirmedId: saved.id,
      deletedId: work.id,
      nextAddresses: afterDeleteWork,
    }) === 'keep',
    'deleting a non-confirmed address must keep current delivery pick',
  );
  assert(
    resolveConfirmedAfterDelete({
      confirmedId: 'gps',
      deletedId: work.id,
      nextAddresses: afterDeleteWork,
    }) === 'keep',
    'deleting a saved address must not replace a GPS/map confirmed pin',
  );
  const deleteConfirmed = resolveConfirmedAfterDelete({
    confirmedId: work.id,
    deletedId: work.id,
    nextAddresses: afterDeleteWork,
  });
  assert(
    typeof deleteConfirmed === 'object' && deleteConfirmed.applyId === saved.id,
    'deleting the confirmed address must fall back to the next default',
  );
  assert(
    resolveConfirmedAfterDelete({
      confirmedId: saved.id,
      deletedId: saved.id,
      nextAddresses: [],
    }) === 'clear',
    'deleting the last address must clear delivery',
  );

  // --- Owner isolation ---
  assert(addressOwnerKey({ kind: 'temporary-ui', mobile: '9000000001' }) === 'temporary-ui:9000000001', 'owner key');
  const memory = new Map<string, string>();
  installSavedAddressStoreForTests({
    async read() {
      return memory.get('groceryapp.saved-addresses') ?? null;
    },
    async write(value) {
      memory.set('groceryapp.saved-addresses', value);
    },
    async remove() {
      memory.delete('groceryapp.saved-addresses');
    },
  });

  const ownerA = 'temporary-ui:9000000001';
  const ownerB = 'temporary-ui:9000000002';
  await saveAddressBook({ ownerKey: ownerA, addresses: [saved] });
  await saveAddressBook({
    ownerKey: ownerB,
    addresses: [
      draftToSavedAddress(
        {
          ...finalized,
          houseNumber: '99',
          buildingStreet: 'Other Street',
          addressLine1: '99, Other Street',
          latitude: 22.5,
          longitude: 88.3,
        },
        { isDefault: true },
      ),
    ],
  });
  const loadedA = await loadAddressBook(ownerA);
  const loadedB = await loadAddressBook(ownerB);
  assert(loadedA.addresses[0]?.latitude === 23.4255, 'owner A keeps own pin');
  assert(loadedB.addresses[0]?.latitude === 22.5, 'owner B keeps separate pin');
  assert(loadedA.addresses[0]?.addressLine1 !== loadedB.addresses[0]?.addressLine1, 'books must not leak');

  // --- GPS fallback: stale samples rejected; better sample wins ---
  const now = Date.now();
  const stale: GpsFixSample = {
    latitude: 23.42,
    longitude: 88.39,
    accuracyMeters: 8,
    timestamp: now - 120_000,
  };
  const coarse: GpsFixSample = {
    latitude: 23.424,
    longitude: 88.391,
    accuracyMeters: 1800,
    timestamp: now - 1500,
  };
  const fresh: GpsFixSample = {
    latitude: 23.4242,
    longitude: 88.3916,
    accuracyMeters: 40,
    timestamp: now - 800,
  };
  assert(pickBestGpsSample([stale], now) == null, 'stale GPS must not replace a confirmed pin seed');
  const best = pickBestGpsSample([stale, coarse, fresh], now);
  assert(best?.accuracyMeters === 40, 'GPS fallback must prefer fresh accurate fix');

  // eslint-disable-next-line no-console
  console.log('location-address-phase3 fixtures passed');
}

void main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
