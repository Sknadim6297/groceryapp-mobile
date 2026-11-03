import {
  addressOwnerKey,
  draftToSavedAddress,
  installSavedAddressStoreForTests,
  loadAddressBook,
  normalizeAddressBook,
  parseAddressVault,
  removeAddressFromList,
  saveAddressBook,
  serializeAddressVault,
  withDefaultAddress,
} from '../src/services/savedAddressStore';
import { savedAddressToDeliveryLocation } from '../src/utils/savedAddressMapping';
import {
  emptyAddressDraft,
  findDuplicateAddress,
  isAddressDraftReady,
  validateAddressDraft,
} from '../src/utils/savedAddressValidation';

async function main() {
  installSavedAddressStoreForTests(null);

  if (addressOwnerKey({ kind: 'temporary-ui', mobile: '9000000001' }) !== 'temporary-ui:9000000001') {
    throw new Error('owner key must scope addresses to the signed-in mobile');
  }
  if (addressOwnerKey({ kind: 'temporary-ui', mobile: '123' }) !== null) {
    throw new Error('invalid mobiles must not own an address book');
  }

  const draft = {
    ...emptyAddressDraft(),
    houseNumber: '12',
    buildingStreet: 'Park Street',
    area: 'Hazratganj',
    addressLine1: '12, Park Street',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    postalCode: '226001',
    landmark: 'Near metro',
    instructions: 'Call on arrival',
    label: 'Home' as const,
  };

  if (!isAddressDraftReady(draft)) {
    throw new Error('valid draft should be ready');
  }
  if (Object.keys(validateAddressDraft({ ...draft, postalCode: '12' })).length === 0) {
    throw new Error('short PIN must fail validation');
  }

  const first = draftToSavedAddress(draft, { isDefault: true });
  const second = draftToSavedAddress(
    {
      ...draft,
      label: 'Work',
      houseNumber: 'Cyber Tower',
      buildingStreet: 'Vibhuti Khand',
      addressLine1: 'Cyber Tower, Vibhuti Khand',
    },
    { isDefault: false },
  );

  if (findDuplicateAddress([first], draft)) {
    // same fingerprint
  } else {
    throw new Error('duplicate detection should match an equivalent draft');
  }
  if (
    findDuplicateAddress([first], {
      ...draft,
      houseNumber: '99',
      buildingStreet: 'Different street',
      addressLine1: '99, Different street',
    })
  ) {
    throw new Error('different street must not be treated as duplicate');
  }

  let book = normalizeAddressBook('temporary-ui:9000000001', [second, first, first]);
  if (book.addresses.length !== 2 || !book.addresses[0].isDefault) {
    throw new Error('normalize must dedupe and keep a single default first');
  }

  book = {
    ownerKey: book.ownerKey,
    addresses: withDefaultAddress(book.addresses, second.id),
  };
  if (!book.addresses.find((address) => address.id === second.id)?.isDefault) {
    throw new Error('set default failed');
  }
  if (book.addresses.filter((address) => address.isDefault).length !== 1) {
    throw new Error('only one default is allowed');
  }

  const afterDelete = removeAddressFromList(book.addresses, second.id);
  if (afterDelete.length !== 1 || !afterDelete[0].isDefault) {
    throw new Error('deleting the default must promote another address');
  }

  const mapped = savedAddressToDeliveryLocation(first);
  if (mapped.source !== 'saved' || mapped.city !== 'Lucknow' || mapped.label !== 'Home') {
    throw new Error('saved address must map into DeliveryLocation');
  }

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
  await saveAddressBook({ ownerKey: ownerA, addresses: [first] });
  await saveAddressBook({
    ownerKey: ownerB,
    addresses: [
      draftToSavedAddress(
        {
          ...draft,
          houseNumber: '55',
          buildingStreet: 'Other home',
          addressLine1: '55, Other home',
        },
        { isDefault: true },
      ),
    ],
  });

  const loadedA = await loadAddressBook(ownerA);
  const loadedB = await loadAddressBook(ownerB);
  if (loadedA.addresses.length !== 1 || loadedA.addresses[0].addressLine1 !== first.addressLine1) {
    throw new Error('owner A must only see their addresses after restart');
  }
  if (loadedB.addresses[0].addressLine1 !== '55, Other home') {
    throw new Error('owner B must keep a separate address book');
  }

  const vault = parseAddressVault(serializeAddressVault({ [ownerA]: loadedA, [ownerB]: loadedB }));
  if (!vault[ownerA] || !vault[ownerB]) {
    throw new Error('vault serialize/parse must keep both owners');
  }

  console.log('saved addresses fixtures passed');
}

void main();
