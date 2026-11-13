/**
 * Local pending Cashfree payment snapshot for resume / retry.
 * Stores OrderId + redacted session metadata — never Cashfree secrets.
 */

import type { PendingPaymentSnapshot } from '@/types/cashfreePayment';

const STORAGE_KEY = 'groceryapp.pending-cashfree-payment.v1';

type PendingStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: PendingStore = {
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

let store: PendingStore = memoryStore;

export function installPendingPaymentStoreForTests(next: PendingStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export async function activateDevicePendingPaymentStore(): Promise<void> {
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function parsePendingPaymentSnapshot(raw: string | null): PendingPaymentSnapshot | null {
  if (!raw) {
    return null;
  }
  try {
    const record = asRecord(JSON.parse(raw) as unknown);
    if (!record) {
      return null;
    }
    const orderId = typeof record.orderId === 'string' ? record.orderId.trim() : '';
    const paymentSessionId =
      typeof record.paymentSessionId === 'string' ? record.paymentSessionId.trim() : '';
    const amount = typeof record.amount === 'number' ? record.amount : Number(record.amount);
    const currency = typeof record.currency === 'string' ? record.currency.trim() : 'INR';
    const createdAt = typeof record.createdAt === 'number' ? record.createdAt : 0;
    const customerPhone = typeof record.customerPhone === 'string' ? record.customerPhone.trim() : '';
    const addressTitle = typeof record.addressTitle === 'string' ? record.addressTitle : 'Delivery address';
    const addressLine = typeof record.addressLine === 'string' ? record.addressLine : '';
    const submitToken = typeof record.submitToken === 'string' ? record.submitToken : '';
    if (!orderId || !paymentSessionId || !Number.isFinite(amount) || amount <= 0) {
      return null;
    }
    const itemSummary: PendingPaymentSnapshot['itemSummary'] = [];
    if (Array.isArray(record.itemSummary)) {
      for (const item of record.itemSummary) {
        const row = asRecord(item);
        if (!row) {
          continue;
        }
        const id = typeof row.id === 'string' ? row.id : '';
        const name = typeof row.name === 'string' ? row.name : '';
        const quantity = typeof row.quantity === 'number' ? row.quantity : Number(row.quantity);
        const unit = typeof row.unit === 'string' ? row.unit : undefined;
        if (!id || !name || !Number.isFinite(quantity) || quantity <= 0) {
          continue;
        }
        itemSummary.push(unit ? { id, name, quantity, unit } : { id, name, quantity });
      }
    }

    return {
      orderId,
      paymentSessionId,
      amount,
      currency: currency || 'INR',
      createdAt,
      customerPhone,
      addressTitle,
      addressLine,
      itemSummary,
      submitToken,
    };
  } catch {
    return null;
  }
}

export async function loadPendingPayment(): Promise<PendingPaymentSnapshot | null> {
  return parsePendingPaymentSnapshot(await store.read());
}

export async function savePendingPayment(snapshot: PendingPaymentSnapshot): Promise<boolean> {
  if (!snapshot.orderId.trim() || !snapshot.paymentSessionId.trim()) {
    return false;
  }
  try {
    await store.write(JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export async function clearPendingPayment(orderId?: string): Promise<void> {
  if (orderId) {
    const current = await loadPendingPayment();
    if (current && current.orderId !== orderId) {
      return;
    }
  }
  await store.remove();
}
