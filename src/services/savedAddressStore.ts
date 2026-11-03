/**
 * Local saved-address books, keyed by customer owner.
 * Ready to swap the store for a future C# / ASP.NET address API.
 */

import type { AddressLabel, SavedAddress, SavedAddressBook, SavedAddressDraft } from '@/types/savedAddress';
import { addressFingerprint, normalizePostalCode } from '@/utils/savedAddressValidation';

const STORAGE_KEY = 'groceryapp.saved-addresses';

type AddressStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: AddressStore = {
  async read() {
    return memory.get(STORAGE_KEY) ?? null;
  },
  async write(value) {
    memory.set(STORAGE_KEY, value);
  },
  async remove() {
    memory.delete(STORAGE_KEY);
  },
};

let store: AddressStore = memoryStore;

/** Tests replace the store so a restart can be simulated without a device. */
export function installSavedAddressStoreForTests(next: AddressStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function addressOwnerKey(input: { mobile?: string | null; kind: 'temporary-ui' | 'development-test' } | null): string | null {
  const mobile = input?.mobile?.trim() ?? '';
  if (!input || mobile.length !== 10) {
    return null;
  }
  return `${input.kind}:${mobile}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function parseLabel(value: unknown): AddressLabel | null {
  return value === 'Home' || value === 'Work' || value === 'Other' ? value : null;
}

function parseSource(value: unknown): SavedAddress['source'] {
  return value === 'gps' || value === 'manual' || value === 'saved' ? value : 'manual';
}

export function parseSavedAddress(value: unknown): SavedAddress | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const id = text(record.id);
  const label = parseLabel(record.label);
  const addressLine1 = text(record.addressLine1);
  const city = text(record.city);
  const state = text(record.state);
  const postalCode = normalizePostalCode(text(record.postalCode));
  if (!id || !label || addressLine1.length < 5 || city.length < 2 || state.length < 2 || postalCode.length !== 6) {
    return null;
  }
  const customLabel = text(record.customLabel);
  const houseNumber = text(record.houseNumber);
  const buildingStreet = text(record.buildingStreet);
  const area = text(record.area);
  const landmark = text(record.landmark);
  const instructions = text(record.instructions);
  const country = text(record.country) || 'India';
  const latitude = typeof record.latitude === 'number' && Number.isFinite(record.latitude) ? record.latitude : undefined;
  const longitude = typeof record.longitude === 'number' && Number.isFinite(record.longitude) ? record.longitude : undefined;
  const updatedAt = typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt) ? record.updatedAt : Date.now();
  return {
    id,
    label,
    customLabel: label === 'Other' && customLabel ? customLabel : undefined,
    houseNumber: houseNumber || undefined,
    buildingStreet: buildingStreet || undefined,
    area: area || undefined,
    addressLine1,
    landmark: landmark || undefined,
    city,
    state,
    postalCode,
    country,
    instructions: instructions || undefined,
    latitude,
    longitude,
    source: parseSource(record.source),
    isDefault: record.isDefault === true,
    updatedAt,
  };
}

export function normalizeAddressBook(ownerKey: string, addresses: readonly SavedAddress[]): SavedAddressBook {
  const seen = new Set<string>();
  const fingerprints = new Set<string>();
  const next: SavedAddress[] = [];
  for (const address of addresses) {
    if (seen.has(address.id)) {
      continue;
    }
    const fingerprint = addressFingerprint(address);
    if (fingerprints.has(fingerprint)) {
      continue;
    }
    seen.add(address.id);
    fingerprints.add(fingerprint);
    next.push(address);
  }
  next.sort((a, b) => {
    if (a.isDefault !== b.isDefault) {
      return a.isDefault ? -1 : 1;
    }
    return b.updatedAt - a.updatedAt;
  });
  if (next.length > 0 && !next.some((address) => address.isDefault)) {
    next[0] = { ...next[0], isDefault: true };
  }
  if (next.filter((address) => address.isDefault).length > 1) {
    let kept = false;
    for (let index = 0; index < next.length; index += 1) {
      if (!next[index].isDefault) {
        continue;
      }
      if (kept) {
        next[index] = { ...next[index], isDefault: false };
      } else {
        kept = true;
      }
    }
  }
  return { ownerKey, addresses: next };
}

export function parseAddressVault(raw: string | null): Record<string, SavedAddressBook> {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const root = asRecord(parsed);
    if (!root) {
      return {};
    }
    const books = asRecord(root.books) ?? root;
    const vault: Record<string, SavedAddressBook> = {};
    for (const [ownerKey, value] of Object.entries(books)) {
      const record = asRecord(value);
      const list = Array.isArray(record?.addresses) ? record.addresses : Array.isArray(value) ? value : null;
      if (!list) {
        continue;
      }
      const addresses = list.map(parseSavedAddress).filter((item): item is SavedAddress => item !== null);
      vault[ownerKey] = normalizeAddressBook(ownerKey, addresses);
    }
    return vault;
  } catch {
    return {};
  }
}

export function serializeAddressVault(vault: Record<string, SavedAddressBook>): string {
  return JSON.stringify({ books: vault });
}

export async function loadAddressVault(): Promise<Record<string, SavedAddressBook>> {
  return parseAddressVault(await store.read());
}

export async function saveAddressVault(vault: Record<string, SavedAddressBook>): Promise<void> {
  if (Object.keys(vault).length === 0) {
    await store.remove();
    return;
  }
  await store.write(serializeAddressVault(vault));
}

export async function loadAddressBook(ownerKey: string): Promise<SavedAddressBook> {
  const vault = await loadAddressVault();
  return vault[ownerKey] ?? { ownerKey, addresses: [] };
}

export async function saveAddressBook(book: SavedAddressBook): Promise<void> {
  const vault = await loadAddressVault();
  const normalized = normalizeAddressBook(book.ownerKey, book.addresses);
  if (normalized.addresses.length === 0) {
    delete vault[book.ownerKey];
  } else {
    vault[book.ownerKey] = normalized;
  }
  await saveAddressVault(vault);
}

export function createAddressId(): string {
  return `addr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function draftToSavedAddress(
  draft: SavedAddressDraft,
  options: { id?: string; isDefault: boolean; updatedAt?: number },
): SavedAddress {
  const houseNumber = draft.houseNumber.trim();
  const buildingStreet = draft.buildingStreet.trim();
  const area = draft.area.trim();
  const composed =
    [houseNumber, buildingStreet].filter((part) => part.length > 0).join(', ') || draft.addressLine1.trim();
  return {
    id: options.id ?? createAddressId(),
    label: draft.label,
    customLabel: draft.label === 'Other' ? draft.customLabel.trim() : undefined,
    houseNumber: houseNumber || undefined,
    buildingStreet: buildingStreet || undefined,
    area: area || undefined,
    addressLine1: composed,
    landmark: draft.landmark.trim() || undefined,
    city: draft.city.trim(),
    state: draft.state.trim(),
    postalCode: normalizePostalCode(draft.postalCode),
    country: 'India',
    instructions: draft.instructions.trim() || undefined,
    latitude: draft.latitude,
    longitude: draft.longitude,
    source: draft.source,
    isDefault: options.isDefault,
    updatedAt: options.updatedAt ?? Date.now(),
  };
}

export function withDefaultAddress(addresses: readonly SavedAddress[], addressId: string): SavedAddress[] {
  return addresses.map((address) => ({
    ...address,
    isDefault: address.id === addressId,
    updatedAt: address.id === addressId ? Date.now() : address.updatedAt,
  }));
}

export function removeAddressFromList(addresses: readonly SavedAddress[], addressId: string): SavedAddress[] {
  const next = addresses.filter((address) => address.id !== addressId);
  if (next.length > 0 && !next.some((address) => address.isDefault)) {
    next[0] = { ...next[0], isDefault: true, updatedAt: Date.now() };
  }
  return next;
}

export async function secureSavedAddressStore(): Promise<AddressStore> {
  try {
    const SecureStore = await import('expo-secure-store');
    return {
      async read() {
        return SecureStore.getItemAsync(STORAGE_KEY);
      },
      async write(value) {
        await SecureStore.setItemAsync(STORAGE_KEY, value);
      },
      async remove() {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
      },
    };
  } catch {
    return memoryStore;
  }
}

export async function activateDeviceSavedAddressStore(): Promise<void> {
  store = await secureSavedAddressStore();
}
