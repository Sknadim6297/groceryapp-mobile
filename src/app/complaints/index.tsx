import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountScreenShell } from '@/components/account/AccountScreenShell';
import { AccountSectionCard } from '@/components/account/AccountSectionCard';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, radii, space } from '@/constants/theme';
import { accountRoutes, complaintDetailsHref } from '@/navigation/accountRoutes';
import { profileRoutes } from '@/navigation/profileRoutes';
import {
  activateDeviceComplaintStore,
  loadComplaints,
} from '@/services/complaintStore';
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_STATUS_LABELS,
  type DeviceComplaint,
} from '@/types/complaints';

export default function ComplaintsListScreen() {
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<DeviceComplaint[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (Platform.OS !== 'web') {
        await activateDeviceComplaintStore();
      }
      const next = await loadComplaints();
      if (cancelled) {
        return;
      }
      setItems(next);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!UI_PREVIEW_MODE) {
    return (
      <PlaceholderScreen
        title="Help & Support"
        message="Complaints are not connected to a live ticketing API yet."
        withHeader
      />
    );
  }

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  return (
    <AccountScreenShell
      title="Help & Support"
      fallbackHref={profileRoutes.help}
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Raise a complaint"
          onPress={() => router.push(accountRoutes.complaintNew)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          testID="complaints-raise">
          <Text style={styles.primaryLabel}>Raise a Complaint</Text>
        </Pressable>
      }>
      <DemoBanner message="Demo complaints stay on this device — ticket IDs are local, not from a support backend." />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <AppIcon name="headset" color={colors.primaryInk} size={28} />
        </View>
        <Text style={styles.heroTitle}>We’re here to help</Text>
        <Text style={styles.heroBody}>
          Browse FAQs, chat in preview, or file a local complaint record when something goes wrong with an order.
        </Text>
      </View>

      <AccountSectionCard title="Quick help">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open FAQs"
          onPress={() => router.push(accountRoutes.help)}
          style={({ pressed }) => [styles.quick, pressed && styles.pressed]}>
          <AppIcon name="help" color={colors.primaryInk} size={18} />
          <Text style={styles.quickLabel}>Help topics & FAQs</Text>
          <AppIcon name="chevron" color={colors.textSecondary} size={18} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open live chat preview"
          onPress={() => router.push('/support/chat')}
          style={({ pressed }) => [styles.quick, pressed && styles.pressed]}>
          <AppIcon name="chat" color={colors.primaryInk} size={18} />
          <Text style={styles.quickLabel}>Live chat (preview)</Text>
          <AppIcon name="chevron" color={colors.textSecondary} size={18} />
        </Pressable>
      </AccountSectionCard>

      <AccountSectionCard title="My complaints">
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No complaints yet</Text>
            <Text style={styles.emptyBody}>When you raise a complaint, it will appear here with a local reference ID.</Text>
          </View>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Complaint ${item.subject}`}
              onPress={() => router.push(complaintDetailsHref(item.id))}
              style={({ pressed }) => [styles.ticket, pressed && styles.pressed]}
              testID={`complaint-row-${item.id}`}>
              <View style={styles.ticketTop}>
                <Text style={styles.ticketId}>{item.id}</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusLabel}>{COMPLAINT_STATUS_LABELS[item.status]}</Text>
                </View>
              </View>
              <Text style={styles.ticketSubject} numberOfLines={1}>
                {item.subject}
              </Text>
              <Text style={styles.ticketMeta}>
                {COMPLAINT_CATEGORY_LABELS[item.category]} ·{' '}
                {new Date(item.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </Pressable>
          ))
        )}
      </AccountSectionCard>
    </AccountScreenShell>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warmBackground,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  heroBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
  },
  quickLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  empty: {
    gap: 6,
    paddingVertical: 4,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  ticket: {
    borderRadius: radii.md,
    backgroundColor: colors.warmBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
    gap: 4,
  },
  ticketTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ticketId: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: colors.softYellow,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryInk,
  },
  ticketSubject: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  ticketMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
});
