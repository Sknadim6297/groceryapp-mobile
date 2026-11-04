/**
 * Device-local complaint inbox for Help & Support preview.
 * Ready to swap for a future ticketing API — never invents server ticket IDs.
 */

import type { ComplaintCategory, ComplaintDraft, ComplaintStatus, DeviceComplaint } from '@/types/complaints';

const STORAGE_KEY = 'groceryapp.device-complaints';

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

export function installComplaintStoreForTests(next: Store | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

const categories = new Set(['order', 'delivery', 'product', 'payment', 'app', 'other']);
const statuses = new Set(['open', 'in_progress', 'resolved', 'closed']);

export function parseComplaint(value: unknown): DeviceComplaint | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const id = text(record.id);
  const category = text(record.category);
  const subject = text(record.subject);
  const description = text(record.description);
  const status = text(record.status);
  const createdAt = Number(record.createdAt);
  const updatedAt = Number(record.updatedAt);
  if (!id || !categories.has(category) || subject.length < 3 || description.length < 8) {
    return null;
  }
  if (!statuses.has(status) || !Number.isFinite(createdAt) || !Number.isFinite(updatedAt)) {
    return null;
  }
  const orderId = text(record.orderId) || undefined;
  return {
    id,
    category: category as ComplaintCategory,
    subject,
    description,
    orderId,
    status: status as ComplaintStatus,
    createdAt,
    updatedAt,
  };
}

export async function loadComplaints(): Promise<DeviceComplaint[]> {
  const raw = await store.read();
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(parseComplaint)
      .filter((item): item is DeviceComplaint => item != null)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function saveComplaints(items: DeviceComplaint[]): Promise<boolean> {
  try {
    await store.write(JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function buildLocalComplaintId(now = Date.now()): string {
  return `LOCAL-${now.toString(36).toUpperCase()}`;
}

export async function createComplaint(draft: ComplaintDraft): Promise<DeviceComplaint | null> {
  const subject = draft.subject.trim();
  const description = draft.description.trim();
  if (subject.length < 3 || description.length < 8 || !categories.has(draft.category)) {
    return null;
  }
  const now = Date.now();
  const next: DeviceComplaint = {
    id: buildLocalComplaintId(now),
    category: draft.category,
    subject,
    description,
    orderId: draft.orderId?.trim() || undefined,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
  const current = await loadComplaints();
  const ok = await saveComplaints([next, ...current]);
  return ok ? next : null;
}

export async function findComplaint(id: string): Promise<DeviceComplaint | null> {
  const items = await loadComplaints();
  return items.find((item) => item.id === id) ?? null;
}

export async function activateDeviceComplaintStore(): Promise<void> {
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
