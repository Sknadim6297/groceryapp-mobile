/**
 * Local notification preference toggles for Settings.
 * Session-persisted on device; not synced to a server.
 */

export type AppSettingsPrefs = {
  orderAlerts: boolean;
  offerAlerts: boolean;
};

export const DEFAULT_APP_SETTINGS: AppSettingsPrefs = {
  orderAlerts: true,
  offerAlerts: false,
};

const STORAGE_KEY = 'groceryapp.app-settings';

type Store = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
};

const memory = new Map<string, string>();
const memoryStore: Store = {
  async read() {
    return memory.get(STORAGE_KEY) ?? null;
  },
  async write(value) {
    memory.set(STORAGE_KEY, value);
  },
};

let store: Store = memoryStore;

export function installAppSettingsStoreForTests(next: Store | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function parseAppSettings(value: unknown): AppSettingsPrefs {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_APP_SETTINGS };
  }
  const record = value as Record<string, unknown>;
  return {
    orderAlerts: typeof record.orderAlerts === 'boolean' ? record.orderAlerts : DEFAULT_APP_SETTINGS.orderAlerts,
    offerAlerts: typeof record.offerAlerts === 'boolean' ? record.offerAlerts : DEFAULT_APP_SETTINGS.offerAlerts,
  };
}

export async function loadAppSettings(): Promise<AppSettingsPrefs> {
  const raw = await store.read();
  if (!raw) {
    return { ...DEFAULT_APP_SETTINGS };
  }
  try {
    return parseAppSettings(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export async function saveAppSettings(prefs: AppSettingsPrefs): Promise<boolean> {
  try {
    await store.write(JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

export async function activateDeviceAppSettingsStore(): Promise<void> {
  try {
    const SecureStore = await import('expo-secure-store');
    store = {
      async read() {
        return SecureStore.getItemAsync(STORAGE_KEY);
      },
      async write(value) {
        await SecureStore.setItemAsync(STORAGE_KEY, value);
      },
    };
  } catch {
    store = memoryStore;
  }
}
