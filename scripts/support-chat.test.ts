/**
 * Demo Live Chat helpers and local store.
 * Run: npx --yes tsx scripts/support-chat.test.ts
 */

import {
  appendSupportChatMessage,
  installSupportChatStoreForTests,
  loadSupportChatThread,
  parseSupportChatMessage,
  supportChatOwnerKey,
} from '../src/services/supportChatStore';
import {
  buildSupportChatListItems,
  canSendChatText,
  formatChatDayLabel,
  supportChatHref,
  trimChatDraft,
} from '../src/utils/supportChat';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const memory = new Map<string, string>();
  installSupportChatStoreForTests({
    async read() {
      return memory.get('vault') ?? null;
    },
    async write(value) {
      memory.set('vault', value);
    },
    async remove() {
      memory.delete('vault');
    },
  });

  assert(supportChatOwnerKey({ mobile: '9876543210', kind: 'temporary-ui' }) === 'temporary-ui:9876543210', 'owner key');
  assert(supportChatOwnerKey({ mobile: null, kind: 'preview-guest' }) === 'preview-guest:local', 'guest owner');
  assert(supportChatOwnerKey(null) === 'preview-guest:local', 'null owner falls back to guest');

  assert(canSendChatText('hello') === true, 'valid text can send');
  assert(canSendChatText('   ') === false, 'whitespace-only rejected');
  assert(canSendChatText('') === false, 'empty rejected');
  assert(trimChatDraft('  hi   there ') === 'hi there', 'draft trim collapses spaces');

  assert(supportChatHref() === '/support/chat', 'chat href without faq');
  const withFaq = supportChatHref({ faqId: 'faq-refund' });
  assert(typeof withFaq === 'object' && withFaq.pathname === '/support/chat', 'chat href with faq path');
  assert(typeof withFaq === 'object' && withFaq.params.faqId === 'faq-refund', 'chat href with faq id');

  const now = new Date('2026-11-03T12:00:00').getTime();
  assert(formatChatDayLabel(now, now) === 'Today', 'today label');
  assert(formatChatDayLabel(now - 86_400_000, now) === 'Yesterday', 'yesterday label');

  const owner = 'temporary-ui:9876543210';
  const first = await appendSupportChatMessage(owner, {
    sender: 'customer',
    kind: 'text',
    text: 'Hello, wrong items arrived',
    createdAt: now,
  });
  assert(first.localOnly === true, 'messages are local-only');
  assert(first.ownerKey === owner, 'message scoped to owner');

  const second = await appendSupportChatMessage(owner, {
    sender: 'customer',
    kind: 'image',
    imageUri: 'file:///tmp/demo.jpg',
    createdAt: now + 1000,
  });
  assert(second.kind === 'image', 'image message stored');

  const otherOwner = await loadSupportChatThread('development-test:9999999999');
  assert(otherOwner.messages.length === 0, 'history isolated by owner');

  const thread = await loadSupportChatThread(owner);
  assert(thread.messages.length === 2, 'thread reloads persisted messages');

  const rows = buildSupportChatListItems(thread.messages, now);
  assert(rows[0]?.type === 'day', 'list starts with day divider');
  assert(rows.some((row) => row.type === 'message' && row.message.id === first.id), 'list includes text message');

  assert(parseSupportChatMessage({ ...first, localOnly: false }) === null, 'reject non-local messages');
  assert(parseSupportChatMessage({ id: 'x' }) === null, 'reject corrupt payloads');

  let emptyRejected = false;
  try {
    await appendSupportChatMessage(owner, { sender: 'customer', kind: 'text', text: '   ' });
  } catch {
    emptyRejected = true;
  }
  assert(emptyRejected, 'empty text append throws');

  console.log('support chat fixtures passed');
}

void main();
