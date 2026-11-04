import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { AccountScreenShell } from '@/components/account/AccountScreenShell';
import { AccountSectionCard } from '@/components/account/AccountSectionCard';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { accountRoutes } from '@/navigation/accountRoutes';
import { activateDeviceComplaintStore, findComplaint } from '@/services/complaintStore';
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_STATUS_LABELS,
  type DeviceComplaint,
} from '@/types/complaints';

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const complaintId = firstParam(id);
  const [item, setItem] = useState<DeviceComplaint | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!UI_PREVIEW_MODE || !complaintId) {
        if (!cancelled) {
          setItem(null);
        }
        return;
      }
      if (Platform.OS !== 'web') {
        await activateDeviceComplaintStore();
      }
      const found = await findComplaint(complaintId);
      if (!cancelled) {
        setItem(found);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [complaintId]);

  if (!UI_PREVIEW_MODE) {
    return (
      <PlaceholderScreen
        title="Complaint"
        message="Complaint details require a live support API."
        withHeader
      />
    );
  }

  if (item === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  if (!item) {
    return <Redirect href={accountRoutes.complaints} />;
  }

  return (
    <AccountScreenShell title="Complaint details" fallbackHref={accountRoutes.complaints}>
      <DemoBanner message="Local device record — not a live support ticket." />

      <AccountSectionCard>
        <View style={styles.head}>
          <Text style={styles.id}>{item.id}</Text>
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>{COMPLAINT_STATUS_LABELS[item.status]}</Text>
          </View>
        </View>
        <Text style={styles.subject}>{item.subject}</Text>
        <Text style={styles.meta}>
          {COMPLAINT_CATEGORY_LABELS[item.category]}
          {item.orderId ? ` · Order #${item.orderId}` : ''}
        </Text>
        <Text style={styles.meta}>
          Created{' '}
          {new Date(item.createdAt).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      </AccountSectionCard>

      <AccountSectionCard title="Description">
        <Text style={styles.body}>{item.description}</Text>
      </AccountSectionCard>

      <AccountSectionCard title="Updates">
        <Text style={styles.body}>
          Conversation timelines appear here when a support backend is connected. This preview has no agent replies.
        </Text>
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  id: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  pill: {
    borderRadius: 999,
    backgroundColor: colors.softYellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryInk,
  },
  subject: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
