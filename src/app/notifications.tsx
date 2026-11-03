import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationCard } from '@/components/notifications/NotificationCard';
import { NotificationDetailsSheet } from '@/components/notifications/NotificationDetailsSheet';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';
import {
  applyInboxState,
  countUnread,
  DEMO_NOTIFICATIONS,
} from '@/data/demoNotifications';
import {
  activateDeviceNotificationInboxStore,
  clearNotificationInbox,
  loadNotificationInbox,
  markAllNotificationsRead,
  markNotificationRead,
  resetNotificationInboxDemo,
} from '@/services/notificationInboxStore';
import type { NotificationInboxState, NotificationListItem } from '@/types/notifications';
import { resolveNotificationRoute } from '@/utils/notificationNavigation';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const [inbox, setInbox] = useState<NotificationInboxState>({ cleared: false, readIds: [] });
  const [clearOpen, setClearOpen] = useState(false);
  const [details, setDetails] = useState<NotificationListItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (Platform.OS !== 'web') {
        await activateDeviceNotificationInboxStore();
      }
      const state = await loadNotificationInbox();
      if (cancelled) {
        return;
      }
      setInbox(state);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => applyInboxState(DEMO_NOTIFICATIONS, inbox), [inbox]);
  const unreadCount = useMemo(() => countUnread(items), [items]);

  const handleOpen = useCallback(
    async (item: NotificationListItem) => {
      if (item.isUnread) {
        const next = await markNotificationRead(item.id);
        setInbox(next);
      }
      const resolved = resolveNotificationRoute(item);
      if (resolved.kind === 'href') {
        router.push(resolved.href);
        return;
      }
      setDetails({ ...item, isUnread: false });
    },
    [],
  );

  const handleMarkAll = useCallback(async () => {
    if (items.length === 0) {
      return;
    }
    const next = await markAllNotificationsRead(items.map((item) => item.id));
    setInbox(next);
    showToast('success', 'All demo notifications marked as read.');
  }, [items, showToast]);

  const handleClearConfirm = useCallback(async () => {
    setClearOpen(false);
    const next = await clearNotificationInbox();
    setInbox(next);
    setDetails(null);
    showToast('success', 'Demo notifications cleared locally.');
  }, [showToast]);

  const handleResetDemo = useCallback(async () => {
    const next = await resetNotificationInboxDemo();
    setInbox(next);
    showToast('info', 'Demo notification inbox restored.');
  }, [showToast]);

  if (!UI_PREVIEW_MODE) {
    return (
      <PlaceholderScreen title="Notification" message="Notifications are not connected yet." withHeader />
    );
  }

  if (!ready) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="notifications-screen">
      <AppScreenHeader
        title="Notification"
        fallbackHref="/profile"
        right={
          <View style={styles.headerBell} accessibilityElementsHidden>
            <AppIcon name="bell" color={colors.text} size={22} />
            {unreadCount > 0 ? <View style={styles.headerDot} /> : null}
          </View>
        }
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        testID="notifications-list"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) },
          items.length === 0 ? styles.grow : null,
        ]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <DemoBanner message="Demo inbox — alerts are fictional. Nothing is pushed to a device." />
            <View style={styles.actionsRow}>
              <Text style={styles.unreadLabel}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </Text>
              <View style={styles.actions}>
                {unreadCount > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Mark all as read"
                    onPress={() => {
                      void handleMarkAll();
                    }}
                    hitSlop={8}
                    testID="notifications-mark-all">
                    <Text style={styles.actionLink}>Mark all read</Text>
                  </Pressable>
                ) : null}
                {items.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Clear all notifications"
                    onPress={() => setClearOpen(true)}
                    hitSlop={8}
                    testID="notifications-clear-all">
                    <Text style={styles.clearLink}>Clear All</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        renderItem={({ item }) => (
          <NotificationCard
            item={item}
            onPress={() => {
              void handleOpen(item);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty} testID="notifications-empty">
            <View style={styles.emptyIcon}>
              <AppIcon name="bell" color={colors.textSecondary} size={36} />
            </View>
            <Text style={styles.emptyTitle}>{"You're all caught up!"}</Text>
            <Text style={styles.emptyBody}>No new notifications right now.</Text>
            {__DEV__ || UI_PREVIEW_MODE ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset demo notifications"
                onPress={() => {
                  void handleResetDemo();
                }}
                style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
                testID="notifications-reset-demo">
                <Text style={styles.resetLabel}>Reset demo inbox</Text>
              </Pressable>
            ) : null}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <NotificationDetailsSheet item={details} onClose={() => setDetails(null)} />

      <Modal visible={clearOpen} transparent animationType="fade" onRequestClose={() => setClearOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setClearOpen(false)}>
          <Pressable style={styles.confirmCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.confirmTitle}>Clear all notifications?</Text>
            <Text style={styles.confirmBody}>
              This only clears the local demo inbox. No live alerts are deleted.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={() => setClearOpen(false)}
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}>
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirm clear all"
                onPress={() => {
                  void handleClearConfirm();
                }}
                style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
                testID="notifications-clear-confirm">
                <Text style={styles.confirmLabel}>Clear All</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.softBackground,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1,
    borderColor: colors.white,
  },
  content: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 12,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  grow: {
    flexGrow: 1,
  },
  headerBlock: {
    gap: 12,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  unreadLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionLink: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  clearLink: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  gap: {
    height: 10,
  },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.softYellow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryDark,
  },
  resetLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  confirmTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
  confirmBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.softBackground,
  },
  cancelLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  confirmLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
