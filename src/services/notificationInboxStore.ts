/**
 * Local demo notification inbox overrides (read + cleared).
 * Never syncs to a push or C# notification API.
 */

import type { NotificationInboxState } from '@/types/notifications';

const STORAGE_KEY = 'groceryapp.demo-notification-inbox.v1';

const DEFAULT_STATE: NotificationInboxState = {
  cleared: false,
  readIds: [],
};

type InboxStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: InboxStore = {
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

let store: InboxStore = memoryStore;

export function installNotificationInboxStoreForTests(next: InboxStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function parseNotificationInbox(raw: string | null): NotificationInboxState {
  if (!raw) {
    return { ...DEFAULT_STATE, readIds: [] };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_STATE, readIds: [] };
    }
    const record = parsed as Record<string, unknown>;
    const readIds = Array.isArray(record.readIds)
      ? record.readIds.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      : [];
    return {
      cleared: record.cleared === true,
      readIds: [...new Set(readIds)],
    };
  } catch {
    return { ...DEFAULT_STATE, readIds: [] };
  }
}

export async function loadNotificationInbox(): Promise<NotificationInboxState> {
  return parseNotificationInbox(await store.read());
}

export async function saveNotificationInbox(state: NotificationInboxState): Promise<boolean> {
  await store.write(
    JSON.stringify({
      cleared: state.cleared === true,
      readIds: [...new Set(state.readIds.map((id) => id.trim()).filter(Boolean))],
    }),
  );
  return true;
}

export async function markNotificationRead(id: string): Promise<NotificationInboxState> {
  const current = await loadNotificationInbox();
  if (current.cleared) {
    return current;
  }
  const next: NotificationInboxState = {
    cleared: false,
    readIds: [...new Set([...current.readIds, id.trim()].filter(Boolean))],
  };
  await saveNotificationInbox(next);
  return next;
}

export async function markAllNotificationsRead(ids: readonly string[]): Promise<NotificationInboxState> {
  const current = await loadNotificationInbox();
  if (current.cleared) {
    return current;
  }
  const next: NotificationInboxState = {
    cleared: false,
    readIds: [...new Set([...current.readIds, ...ids.map((id) => id.trim()).filter(Boolean)])],
  };
  await saveNotificationInbox(next);
  return next;
}

export async function clearNotificationInbox(): Promise<NotificationInboxState> {
  const next: NotificationInboxState = { cleared: true, readIds: [] };
  await saveNotificationInbox(next);
  return next;
}

export async function resetNotificationInboxDemo(): Promise<NotificationInboxState> {
  const next: NotificationInboxState = { cleared: false, readIds: [] };
  await saveNotificationInbox(next);
  return next;
}

export async function activateDeviceNotificationInboxStore(): Promise<void> {
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
