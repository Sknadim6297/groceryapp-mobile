/**
 * Local demo Live Chat transcripts, keyed by customer owner.
 * Not connected to a live support backend.
 */

import {
  SUPPORT_CHAT_HISTORY_LIMIT,
  type SupportChatKind,
  type SupportChatMessage,
  type SupportChatSender,
  type SupportChatThread,
} from '@/types/supportChat';

const STORAGE_KEY = 'groceryapp.support-chat-demo';

type ChatStore = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  remove: () => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: ChatStore = {
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

let store: ChatStore = memoryStore;

/** Tests replace the store so a restart can be simulated without a device. */
export function installSupportChatStoreForTests(next: ChatStore | null): void {
  memory.clear();
  store = next ?? memoryStore;
}

export function supportChatOwnerKey(input: {
  mobile?: string | null;
  kind: 'temporary-ui' | 'development-test' | 'preview-guest';
} | null): string {
  if (!input) {
    return 'preview-guest:local';
  }
  if (input.kind === 'preview-guest') {
    return 'preview-guest:local';
  }
  const mobile = input.mobile?.trim() ?? '';
  if (mobile.length !== 10) {
    return 'preview-guest:local';
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
  return typeof value === 'string'
    ? value.trim()
    : typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : '';
}

function parseSender(value: unknown): SupportChatSender | null {
  return value === 'customer' || value === 'demo_assistant' ? value : null;
}

function parseKind(value: unknown): SupportChatKind | null {
  return value === 'text' || value === 'image' ? value : null;
}

export function parseSupportChatMessage(value: unknown): SupportChatMessage | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const id = text(record.id);
  const ownerKey = text(record.ownerKey);
  const sender = parseSender(record.sender);
  const kind = parseKind(record.kind);
  const createdAt =
    typeof record.createdAt === 'number' && Number.isFinite(record.createdAt) ? record.createdAt : NaN;
  if (!id || !ownerKey || !sender || !kind || !Number.isFinite(createdAt)) {
    return null;
  }
  if (record.localOnly !== true) {
    return null;
  }
  const body = text(record.text);
  const imageUri = text(record.imageUri);
  if (kind === 'text' && body.length === 0) {
    return null;
  }
  if (kind === 'image' && imageUri.length === 0) {
    return null;
  }
  return {
    id,
    ownerKey,
    sender,
    kind,
    text: kind === 'text' ? body : body || undefined,
    imageUri: kind === 'image' ? imageUri : undefined,
    createdAt,
    localOnly: true,
  };
}

export function parseSupportChatThread(value: unknown): SupportChatThread | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const ownerKey = text(record.ownerKey);
  if (!ownerKey) {
    return null;
  }
  const rawMessages = Array.isArray(record.messages) ? record.messages : [];
  const messages = rawMessages
    .map(parseSupportChatMessage)
    .filter((item): item is SupportChatMessage => item != null && item.ownerKey === ownerKey)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-SUPPORT_CHAT_HISTORY_LIMIT);
  const updatedAt =
    typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt)
      ? record.updatedAt
      : messages[messages.length - 1]?.createdAt ?? Date.now();
  return { ownerKey, messages, updatedAt };
}

type ChatVault = Record<string, SupportChatThread>;

export function parseSupportChatVault(raw: string | null): ChatVault {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const record = asRecord(parsed);
    if (!record) {
      return {};
    }
    const vault: ChatVault = {};
    for (const [key, value] of Object.entries(record)) {
      const thread = parseSupportChatThread(value);
      if (thread && thread.ownerKey === key) {
        vault[key] = thread;
      }
    }
    return vault;
  } catch {
    return {};
  }
}

async function readVault(): Promise<ChatVault> {
  return parseSupportChatVault(await store.read());
}

async function writeVault(vault: ChatVault): Promise<void> {
  await store.write(JSON.stringify(vault));
}

export async function loadSupportChatThread(ownerKey: string): Promise<SupportChatThread> {
  const vault = await readVault();
  return vault[ownerKey] ?? { ownerKey, messages: [], updatedAt: Date.now() };
}

export async function appendSupportChatMessage(
  ownerKey: string,
  input: {
    sender: SupportChatSender;
    kind: SupportChatKind;
    text?: string;
    imageUri?: string;
    createdAt?: number;
  },
): Promise<SupportChatMessage> {
  const vault = await readVault();
  const current = vault[ownerKey] ?? { ownerKey, messages: [], updatedAt: Date.now() };
  const message: SupportChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ownerKey,
    sender: input.sender,
    kind: input.kind,
    text: input.kind === 'text' ? input.text?.trim() : input.text?.trim() || undefined,
    imageUri: input.kind === 'image' ? input.imageUri?.trim() : undefined,
    createdAt: input.createdAt ?? Date.now(),
    localOnly: true,
  };
  if (message.kind === 'text' && !message.text) {
    throw new Error('Empty text message');
  }
  if (message.kind === 'image' && !message.imageUri) {
    throw new Error('Missing image uri');
  }
  const messages = [...current.messages, message].slice(-SUPPORT_CHAT_HISTORY_LIMIT);
  vault[ownerKey] = { ownerKey, messages, updatedAt: message.createdAt };
  await writeVault(vault);
  return message;
}

export async function clearSupportChatThread(ownerKey: string): Promise<void> {
  const vault = await readVault();
  if (!(ownerKey in vault)) {
    return;
  }
  delete vault[ownerKey];
  await writeVault(vault);
}

export async function secureSupportChatStore(): Promise<ChatStore> {
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

export async function activateDeviceSupportChatStore(): Promise<void> {
  store = await secureSupportChatStore();
}
