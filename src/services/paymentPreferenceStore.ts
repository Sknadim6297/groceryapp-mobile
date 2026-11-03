/**
 * Local demo preference for My Payment primary method.
 * Stores only a method id + preview visibility — never PAN, CVV, or tokens.
 */

import type { PaymentMethodId, PaymentPreferenceState } from '@/types/paymentPreferences';
import { paymentMethodIds } from '@/types/paymentPreferences';

const STORAGE_KEY = 'groceryapp.payment-preference.v1';

const DEFAULT_STATE: PaymentPreferenceState = {
  primaryMethodId: 'card',
  cardPreviewHidden: false,
};

type PreferenceStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: PreferenceStore = {
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

let store: PreferenceStore = memoryStore;

export function installPaymentPreferenceStoreForTests(next: PreferenceStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

function isMethodId(value: unknown): value is PaymentMethodId {
  return typeof value === 'string' && (paymentMethodIds as readonly string[]).includes(value);
}

export function parsePaymentPreference(raw: string | null): PaymentPreferenceState {
  if (!raw) {
    return { ...DEFAULT_STATE };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_STATE };
    }
    const record = parsed as Record<string, unknown>;
    return {
      primaryMethodId: isMethodId(record.primaryMethodId) ? record.primaryMethodId : DEFAULT_STATE.primaryMethodId,
      cardPreviewHidden: record.cardPreviewHidden === true,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function loadPaymentPreference(): Promise<PaymentPreferenceState> {
  return parsePaymentPreference(await store.read());
}

export async function savePaymentPreference(state: PaymentPreferenceState): Promise<boolean> {
  if (!isMethodId(state.primaryMethodId)) {
    return false;
  }
  await store.write(
    JSON.stringify({
      primaryMethodId: state.primaryMethodId,
      cardPreviewHidden: state.cardPreviewHidden === true,
    }),
  );
  return true;
}

export async function activateDevicePaymentPreferenceStore(): Promise<void> {
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
