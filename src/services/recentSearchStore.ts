/**
 * Owner-scoped recent committed search queries (not keystrokes).
 */

import { addressOwnerKey } from '@/services/savedAddressStore';

const STORAGE_KEY = 'groceryapp.recent-searches';
export const GUEST_RECENT_SEARCH_OWNER = 'guest';
export const MAX_RECENT_SEARCHES = 12;

type SearchStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();
const memoryStore: SearchStore = {
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

let store: SearchStore = memoryStore;

export function installRecentSearchStoreForTests(next: SearchStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function recentSearchOwnerKey(
  input: { mobile?: string | null; kind: 'temporary-ui' | 'development-test' } | null,
): string {
  return addressOwnerKey(input) ?? GUEST_RECENT_SEARCH_OWNER;
}

export function normalizeRecentSearches(raw: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const q = typeof entry === 'string' ? entry.trim() : '';
    if (!q || q.length > 80) {
      continue;
    }
    const key = q.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(q);
    if (out.length >= MAX_RECENT_SEARCHES) {
      break;
    }
  }
  return out;
}

/** MRU insert — newest first, case-insensitive dedupe. */
export function recordRecentSearch(history: readonly string[], query: string): string[] {
  const q = query.trim();
  if (!q) {
    return normalizeRecentSearches(history);
  }
  const without = history.filter((item) => item.trim().toLowerCase() !== q.toLowerCase());
  return normalizeRecentSearches([q, ...without]);
}

type Vault = Record<string, string[]>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function parseRecentSearchVault(raw: string | null): Vault {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return {
        [GUEST_RECENT_SEARCH_OWNER]: normalizeRecentSearches(
          parsed.filter((item): item is string => typeof item === 'string'),
        ),
      };
    }
    const root = asRecord(parsed);
    if (!root) {
      return {};
    }
    const vault: Vault = {};
    for (const [owner, value] of Object.entries(root)) {
      if (!Array.isArray(value)) {
        continue;
      }
      const next = normalizeRecentSearches(value.filter((item): item is string => typeof item === 'string'));
      if (next.length > 0) {
        vault[owner] = next;
      }
    }
    return vault;
  } catch {
    return {};
  }
}

export function serializeRecentSearchVault(vault: Vault): string {
  const next: Vault = {};
  for (const [owner, queries] of Object.entries(vault)) {
    const normalized = normalizeRecentSearches(queries);
    if (normalized.length > 0) {
      next[owner] = normalized;
    }
  }
  return JSON.stringify(next);
}

export async function loadRecentSearches(ownerKey: string): Promise<string[]> {
  const vault = parseRecentSearchVault(await store.read());
  return vault[ownerKey] ?? [];
}

export async function saveRecentSearches(ownerKey: string, queries: readonly string[]): Promise<void> {
  const vault = parseRecentSearchVault(await store.read());
  const next = normalizeRecentSearches(queries);
  if (next.length === 0) {
    delete vault[ownerKey];
  } else {
    vault[ownerKey] = next;
  }
  if (Object.keys(vault).length === 0) {
    await store.remove();
    return;
  }
  await store.write(serializeRecentSearchVault(vault));
}

export async function activateDeviceRecentSearchStore(): Promise<void> {
  try {
    const SecureStore = await import('expo-secure-store');
    store = {
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
    store = memoryStore;
  }
}
