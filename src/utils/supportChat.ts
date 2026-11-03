import { SUPPORT_CHAT_MAX_TEXT, type SupportChatMessage } from '@/types/supportChat';

export function trimChatDraft(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function canSendChatText(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= SUPPORT_CHAT_MAX_TEXT;
}

export function formatChatClock(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const sameDay =
    date.getFullYear() === new Date(now).getFullYear() &&
    date.getMonth() === new Date(now).getMonth() &&
    date.getDate() === new Date(now).getDate();
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (sameDay) {
    return time;
  }
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

export function formatChatDayLabel(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp);
  const today = new Date(now);
  if (Number.isNaN(date.getTime())) {
    return 'Earlier';
  }
  const startOf = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const dayDiff = Math.round((startOf(today) - startOf(date)) / 86_400_000);
  if (dayDiff === 0) {
    return 'Today';
  }
  if (dayDiff === 1) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export type SupportChatListItem =
  | { type: 'day'; id: string; label: string }
  | { type: 'message'; id: string; message: SupportChatMessage };

/** Build FlatList rows with day separators derived from message timestamps. */
export function buildSupportChatListItems(
  messages: readonly SupportChatMessage[],
  now = Date.now(),
): SupportChatListItem[] {
  const rows: SupportChatListItem[] = [];
  let lastDayKey = '';
  for (const message of messages) {
    const day = new Date(message.createdAt);
    const dayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
    if (dayKey !== lastDayKey) {
      rows.push({
        type: 'day',
        id: `day-${dayKey}`,
        label: formatChatDayLabel(message.createdAt, now),
      });
      lastDayKey = dayKey;
    }
    rows.push({ type: 'message', id: message.id, message });
  }
  return rows;
}

export function supportChatHref(options?: { faqId?: string }) {
  if (options?.faqId) {
    return {
      pathname: '/support/chat' as const,
      params: { faqId: options.faqId },
    };
  }
  return '/support/chat' as const;
}
