import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountScreenShell } from '@/components/account/AccountScreenShell';
import { AccountSectionCard } from '@/components/account/AccountSectionCard';
import { OrderReturnRefundModal } from '@/components/orders/OrderReturnRefundModal';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { useToast } from '@/components/ui/AppToast';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, radii, shadow, space } from '@/constants/theme';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { canReturnOrderStatus } from '@/data/orderReturnReasons';
import { accountRoutes } from '@/navigation/accountRoutes';
import { profileRoutes } from '@/navigation/profileRoutes';
import { formatRupee } from '@/utils/cartBill';
import { orderItemCount, orderStatusLabel } from '@/utils/orderListing';

const POLICY_POINTS = [
  'Returns apply to delivered preview orders only on this device.',
  'Refund timing depends on a future payments API — nothing is paid out here.',
  'Duplicate return requests for the same order are blocked.',
] as const;

export default function ReturnsRefundsScreen() {
  const { showToast } = useToast();
  const { orders, requestReturn } = usePreviewSession();
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requested = useMemo(
    () => orders.filter((order) => order.returnRequested),
    [orders],
  );
  const eligible = useMemo(
    () => orders.filter((order) => canReturnOrderStatus(order.status, order.returnRequested)),
    [orders],
  );

  if (!UI_PREVIEW_MODE) {
    return (
      <PlaceholderScreen
        title="Returns & Refunds"
        message="Returns and refunds are not connected yet. A live returns API is required before requests can be submitted."
        withHeader
      />
    );
  }

  const activeReturn = returnOrderId ? orders.find((order) => order.id === returnOrderId) : null;

  return (
    <AccountScreenShell title="Returns & Refunds" fallbackHref={profileRoutes.profile}>
      <DemoBanner message="Demo returns only — requests stay on this device and never trigger a bank refund." />

      <AccountSectionCard>
        <Text style={styles.introTitle}>Need to send something back?</Text>
        <Text style={styles.introBody}>
          Start a return from a delivered order. Status updates below are local preview states until a returns service
          exists.
        </Text>
      </AccountSectionCard>

      <AccountSectionCard title="Your return requests">
        {requested.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <AppIcon name="returns" color={colors.primaryInk} size={26} />
            </View>
            <Text style={styles.emptyTitle}>No returns yet</Text>
            <Text style={styles.emptyBody}>Eligible delivered orders will appear below when you can request a return.</Text>
          </View>
        ) : (
          requested.map((order) => (
            <View key={order.id} style={styles.statusCard}>
              <View style={styles.statusHead}>
                <Text style={styles.orderId}>#{order.id}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeLabel}>Under Review</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {orderItemCount(order)} items · {formatRupee(order.total)}
              </Text>
              <Text style={styles.progressNote}>
                Requested on this device. Approved / Refunded will appear only when a live refunds API confirms them.
              </Text>
              <View style={styles.track}>
                {['Requested', 'Under Review', 'Approved', 'Refunded'].map((step, index) => (
                  <View key={step} style={styles.trackStep}>
                    <View style={[styles.dot, index <= 1 && styles.dotOn]} />
                    <Text style={[styles.trackLabel, index <= 1 && styles.trackLabelOn]}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </AccountSectionCard>

      <AccountSectionCard title="Eligible orders">
        {eligible.length === 0 ? (
          <Text style={styles.emptyBody}>No delivered preview orders are eligible right now.</Text>
        ) : (
          eligible.map((order) => (
            <Pressable
              key={order.id}
              accessibilityRole="button"
              accessibilityLabel={`Request return for order ${order.id}`}
              onPress={() => setReturnOrderId(order.id)}
              style={({ pressed }) => [styles.eligibleRow, pressed && styles.pressed]}
              testID={`returns-eligible-${order.id}`}>
              <View style={styles.eligibleCopy}>
                <Text style={styles.orderId}>#{order.id}</Text>
                <Text style={styles.meta}>
                  {orderStatusLabel[order.status]} · {orderItemCount(order)} items · {formatRupee(order.total)}
                </Text>
              </View>
              <Text style={styles.requestLink}>Request</Text>
            </Pressable>
          ))
        )}
      </AccountSectionCard>

      <AccountSectionCard title="Returns policy">
        {POLICY_POINTS.map((point) => (
          <View key={point} style={styles.policyRow}>
            <AppIcon name="check" color={colors.success} size={16} />
            <Text style={styles.policyText}>{point}</Text>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open help FAQs"
          onPress={() => router.push(accountRoutes.help)}
          style={({ pressed }) => [styles.faqLink, pressed && styles.pressed]}>
          <Text style={styles.faqLinkLabel}>Browse Help FAQs</Text>
          <AppIcon name="chevron" color={colors.primaryInk} size={18} />
        </Pressable>
      </AccountSectionCard>

      {activeReturn ? (
        <OrderReturnRefundModal
          visible
          orderId={activeReturn.id}
          submitting={submitting}
          onClose={() => {
            if (!submitting) {
              setReturnOrderId(null);
            }
          }}
          onConfirm={(reasonIds) => {
            setSubmitting(true);
            const ok = requestReturn(activeReturn.id, reasonIds);
            setSubmitting(false);
            setReturnOrderId(null);
            if (ok) {
              showToast('success', 'Return request saved on this device.');
            } else {
              showToast('error', 'A return cannot be requested for this order.');
            }
          }}
        />
      ) : null}
    </AccountScreenShell>
  );
}

const styles = StyleSheet.create({
  introTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
  introBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  statusCard: {
    borderRadius: radii.md,
    backgroundColor: colors.warmBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
    gap: 8,
  },
  statusHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderId: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: colors.softYellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryInk,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  progressNote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  track: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  trackStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotOn: {
    backgroundColor: colors.primaryDark,
  },
  trackLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  trackLabelOn: {
    color: colors.primaryInk,
  },
  eligibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  eligibleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  requestLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  policyText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  faqLink: {
    marginTop: 4,
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.softYellow,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqLinkLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  pressed: {
    opacity: 0.8,
  },
});
