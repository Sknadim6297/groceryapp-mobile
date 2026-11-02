const SESSION_KEY = /token|session|jwt|bearer/i;
const STORAGE_KEY = 'groceryapp.auth-session';

export type AuthCredential = {
  mobile: string;
  field: string;
  value: string;
};

type SessionStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: SessionStore = {
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

let store: SessionStore = memoryStore;

/** Tests replace the store so a restart can be simulated without a device. */
export function installSessionStoreForTests(next: SessionStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function firstRecord(body: unknown): Record<string, unknown> | null {
  if (Array.isArray(body)) {
    return asRecord(body[0]);
  }
  return asRecord(body);
}

function credentialValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return null;
}

/** The first non-empty token, session, jwt, or bearer field. CustomerId is not a credential. */
export function readSessionCredential(body: unknown): { field: string; value: string } | null {
  const record = firstRecord(body);
  if (!record) {
    return null;
  }
  for (const [key, value] of Object.entries(record)) {
    const text = credentialValue(value);
    if (SESSION_KEY.test(key) && text) {
      return { field: key, value: text };
    }
  }
  return null;
}

export function serializeSession(session: AuthCredential): string | null {
  if (!isUsableSession(session)) {
    return null;
  }
  return JSON.stringify({ mobile: session.mobile, field: session.field, value: session.value });
}

export function parseStoredSession(raw: string | null): AuthCredential | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const record = asRecord(parsed);
    if (!record) {
      return null;
    }
    const mobile = credentialValue(record.mobile);
    const field = credentialValue(record.field);
    const value = credentialValue(record.value);
    if (!mobile || !field || !value || !SESSION_KEY.test(field)) {
      return null;
    }
    return { mobile, field, value };
  } catch {
    return null;
  }
}

export function isUsableSession(session: AuthCredential | null): session is AuthCredential {
  return Boolean(
    session &&
      session.mobile.trim().length > 0 &&
      session.value.trim().length > 0 &&
      SESSION_KEY.test(session.field),
  );
}

/** Home opens only for a server credential. A customer id or a verified sentence is not enough. */
export function canEnterHome(session: AuthCredential | null): boolean {
  return isUsableSession(session);
}

export async function loadAuthSession(): Promise<AuthCredential | null> {
  const raw = await store.read();
  const session = parseStoredSession(raw);
  if (raw && !session) {
    await store.remove();
  }
  return session;
}

export async function saveAuthSession(session: AuthCredential): Promise<boolean> {
  const serialized = serializeSession(session);
  if (!serialized) {
    return false;
  }
  await store.write(serialized);
  return true;
}

export async function clearAuthSession(): Promise<void> {
  await store.remove();
}

export async function secureSessionStore(): Promise<SessionStore> {
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

export async function activateDeviceSessionStore(): Promise<void> {
  store = await secureSessionStore();
}
