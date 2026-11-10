import assert from 'node:assert/strict';

import {
  buildUpdateAddressRequest,
  mergeRemoteAddressesIntoBook,
  remoteAddressesToSaved,
  savedAddressToRemoteBlock,
} from '../src/services/customerAddressApi';
import type { SavedAddress } from '../src/types/savedAddress';

const sampleHome: SavedAddress = {
  id: 'local-1',
  label: 'Home',
  addressLine1: '12, Temple Road, Mayapur',
  city: 'Mayapur',
  state: 'West Bengal',
  postalCode: '741313',
  country: 'India',
  source: 'manual',
  isDefault: true,
  updatedAt: 1,
};

const sampleWork: SavedAddress = {
  id: 'local-2',
  label: 'Work',
  addressLine1: 'Office Block A, ISKCON Campus',
  city: 'Mayapur',
  state: 'West Bengal',
  postalCode: '741313',
  country: 'India',
  source: 'manual',
  isDefault: false,
  updatedAt: 2,
};

function main() {
  const block = savedAddressToRemoteBlock(sampleHome);
  assert.equal(block.Address.includes('Temple Road'), true);
  assert.equal(block.City, 'Mayapur');
  assert.equal(block.Pincode, '741313');

  const built = buildUpdateAddressRequest('9876543210', [sampleHome, sampleWork]);
  assert.equal(built.ok, true);
  if (!built.ok) {
    throw new Error('expected ok body');
  }
  assert.equal(built.body.Mobile, '9876543210');
  assert.ok(built.body.HomeAddress);
  assert.ok(built.body.BillingAddress);

  const incomplete = remoteAddressesToSaved([
    {
      slot: 'home',
      addressLine1: 'Only a street line without city',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    },
  ]);
  assert.equal(incomplete.length, 0);

  const remoteSaved = remoteAddressesToSaved([
    {
      slot: 'home',
      addressLine1: 'Server Home Lane',
      city: 'Mayapur',
      state: 'West Bengal',
      postalCode: '741313',
      country: 'India',
    },
    {
      slot: 'billing',
      addressLine1: 'Server Billing Lane',
      city: 'Mayapur',
      state: 'West Bengal',
      postalCode: '741313',
      country: 'India',
    },
  ]);
  assert.equal(remoteSaved.length, 2);
  assert.equal(remoteSaved[0]?.id, 'server-home');
  assert.equal(remoteSaved[1]?.id, 'server-billing');

  const merged = mergeRemoteAddressesIntoBook([sampleWork], [
    {
      slot: 'home',
      addressLine1: 'Server Home Lane',
      city: 'Mayapur',
      state: 'West Bengal',
      postalCode: '741313',
      country: 'India',
    },
  ]);
  assert.equal(merged.some((address) => address.id === 'local-2'), true);
  assert.equal(merged.some((address) => address.id === 'server-home'), true);

  const invalidMobile = buildUpdateAddressRequest('123', [sampleHome]);
  assert.equal(invalidMobile.ok, false);

  console.log('customer-address-api.test.ts: ok');
}

main();
