import type { DemoNotification, NotificationInboxState, NotificationListItem } from '@/types/notifications';

/** Pure inbox helpers — safe to import from Node tests without image assets. */
export function applyInboxState(
  notifications: readonly DemoNotification[],
  inbox: NotificationInboxState,
): NotificationListItem[] {
  if (inbox.cleared) {
    return [];
  }
  const read = new Set(inbox.readIds);
  return notifications.map((item) => ({
    ...item,
    isUnread: item.unread && !read.has(item.id),
  }));
}

export function countUnread(items: readonly NotificationListItem[]): number {
  return items.reduce((sum, item) => sum + (item.isUnread ? 1 : 0), 0);
}
