import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountScreenShell } from '@/components/account/AccountScreenShell';
import { CatalogImage } from '@/components/home/CatalogImage';
import { OrderReturnRefundModal } from '@/components/orders/OrderReturnRefundModal';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { useToast } from '@/components/ui/AppToast';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, radii, shadow, space } from '@/constants/theme';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { canReturnOrderStatus } from '@/data/orderReturnReasons';
import { findDemoProduct } from '@/data/findDemoProduct';
import { accountRoutes } from '@/navigation/accountRoutes';
import { profileRoutes } from '@/navigation/profileRoutes';
import type { SimulatedOrder } from '@/types/order';
import { formatRupee } from '@/utils/cartBill';
import { orderItemCount, orderStatusLabel } from '@/utils/orderListing';

const POLICY_POINTS = [
  'Returns apply to delivered preview orders only on this device.',
  'Product photos are required so the refund team can review the item condition.',
  'Refund timing depends on a future payments API — nothing is paid out here.',
  'Duplicate return requests for the same order are blocked.',
] as const;

const TRACK_STEPS = ['Requested', 'Under Review', 'Approved', 'Refunded'] as const;

export default function ReturnsRefundsScreen() {
  const { showToast } = useToast();
  const { orders, requestReturn } = usePreviewSession();
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requested = useMemo(() => orders.filter((order) => order.returnRequested), [orders]);
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

      <LinearGradient
        colors={['#FFF7CC', '#FFE566', '#FACC15']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <View style={styles.heroIcon}>
          <AppIcon name="returns" color={colors.text} size={22} />
        </View>
        <Text style={styles.heroTitle}>Need a return?</Text>
        <Text style={styles.heroBody}>
          Pick products, share clear photos, and submit a refund review — all in a few taps.
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{eligible.length}</Text>
            <Text style={styles.heroStatLabel}>Eligible</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{requested.length}</Text>
            <Text style={styles.heroStatLabel}>Requested</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your return requests</Text>
        {requested.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <AppIcon name="box" color={colors.primaryInk} size={26} />
            </View>
            <Text style={styles.emptyTitle}>No returns yet</Text>
            <Text style={styles.emptyBody}>
              Delivered orders with product photos will appear here after you request a return.
            </Text>
          </View>
        ) : (
          requested.map((order) => <ReturnRequestCard key={order.id} order={order} />)
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Eligible for return</Text>
        {eligible.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyBody}>No delivered preview orders are eligible right now.</Text>
          </View>
        ) : (
          eligible.map((order) => (
            <Pressable
              key={order.id}
              accessibilityRole="button"
              accessibilityLabel={`Request return for order ${order.id}`}
              onPress={() => setReturnOrderId(order.id)}
              style={({ pressed }) => [styles.eligibleCard, pressed && styles.pressed]}
              testID={`returns-eligible-${order.id}`}>
              <ProductThumbStack order={order} />
              <View style={styles.eligibleCopy}>
                <Text style={styles.orderId}>#{order.id}</Text>
                <Text style={styles.meta}>
                  {orderStatusLabel[order.status]} · {orderItemCount(order)} items · {formatRupee(order.total)}
                </Text>
                <Text style={styles.eligibleHint}>Photos required for refund review</Text>
              </View>
              <View style={styles.requestPill}>
                <Text style={styles.requestPillLabel}>Return</Text>
                <AppIcon name="chevron" color={colors.primaryInk} size={16} />
              </View>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How refunds work</Text>
        <View style={styles.policyCard}>
          {POLICY_POINTS.map((point) => (
            <View key={point} style={styles.policyRow}>
              <View style={styles.policyCheck}>
                <AppIcon name="check" color={colors.text} size={12} />
              </View>
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
        </View>
      </View>

      {activeReturn ? (
        <OrderReturnRefundModal
          visible
          orderId={activeReturn.id}
          items={activeReturn.items}
          submitting={submitting}
          onClose={() => {
            if (!submitting) {
              setReturnOrderId(null);
            }
          }}
          onConfirm={(payload) => {
            setSubmitting(true);
            const ok = requestReturn(activeReturn.id, payload);
            setSubmitting(false);
            setReturnOrderId(null);
            if (ok) {
              showToast('success', 'Return request saved with product photos.');
            } else {
              showToast('error', 'A return cannot be requested for this order.');
            }
          }}
        />
      ) : null}
    </AccountScreenShell>
  );
}

function ProductThumbStack({ order }: { order: SimulatedOrder }) {
  const preview = order.items.slice(0, 3);
  const extra = Math.max(0, order.items.length - preview.length);
  return (
    <View style={styles.thumbs}>
      {preview.map((item, index) => {
        const product = findDemoProduct(item.id);
        return (
          <View key={`${item.id}-${index}`} style={[styles.thumb, index > 0 ? styles.thumbOverlap : null]}>
            {product ? (
              <CatalogImage source={product.image} style={styles.thumbImage} contentFit="cover" />
            ) : (
              <AppIcon name="bag" color={colors.primaryInk} size={14} />
            )}
          </View>
        );
      })}
      {extra > 0 ? (
        <View style={[styles.thumb, styles.thumbMore, styles.thumbOverlap]}>
          <Text style={styles.thumbMoreLabel}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ReturnRequestCard({ order }: { order: SimulatedOrder }) {
  const returnedItems = order.items.filter((item) =>
    order.returnItemIds?.length ? order.returnItemIds.includes(item.id) : true,
  );
  const photos = order.returnPhotoUris ?? [];

  return (
    <View style={styles.statusCard}>
      <View style={styles.statusHead}>
        <Text style={styles.orderId}>#{order.id}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Under Review</Text>
        </View>
      </View>

      <View style={styles.returnedProducts}>
        {returnedItems.slice(0, 4).map((item) => {
          const product = findDemoProduct(item.id);
          return (
            <View key={`${order.id}-${item.id}`} style={styles.returnedRow}>
              <View style={styles.returnedThumb}>
                {product ? (
                  <CatalogImage source={product.image} style={styles.returnedThumbImage} contentFit="cover" />
                ) : (
                  <AppIcon name="bag" color={colors.primaryInk} size={16} />
                )}
              </View>
              <View style={styles.returnedCopy}>
                <Text style={styles.returnedName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>
                  Qty {item.quantity}
                  {item.unit ? ` · ${item.unit}` : ''}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {photos.length > 0 ? (
        <View style={styles.photoStrip}>
          {photos.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.photoThumb} contentFit="cover" />
          ))}
        </View>
      ) : null}

      <Text style={styles.meta}>
        {returnedItems.length} item{returnedItems.length === 1 ? '' : 's'} · {formatRupee(order.total)}
      </Text>
      <Text style={styles.progressNote}>
        Requested on this device. Approved / Refunded appear only when a live refunds API confirms them.
      </Text>

      <View style={styles.track}>
        {TRACK_STEPS.map((step, index) => (
          <View key={step} style={styles.trackStep}>
            <View style={[styles.dot, index <= 1 && styles.dotOn]} />
            <Text style={[styles.trackLabel, index <= 1 && styles.trackLabelOn]}>{step}</Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open order ${order.id}`}
        onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
        style={({ pressed }) => [styles.viewOrder, pressed && styles.pressed]}>
        <Text style={styles.viewOrderLabel}>View order</Text>
        <AppIcon name="chevron" color={colors.primaryInk} size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.sheet,
    padding: space.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    overflow: 'hidden',
    ...shadow.soft,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  heroBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(17,24,39,0.72)',
  },
  heroStats: {
    marginTop: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: radii.md,
    paddingVertical: 12,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  heroStatValue: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
  },
  heroStatLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  emptyCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space.lg,
    alignItems: 'center',
    gap: 8,
    ...shadow.soft,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
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
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space.md,
    gap: 10,
    ...shadow.soft,
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
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primaryInk,
  },
  returnedProducts: {
    gap: 8,
  },
  returnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  returnedThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.softYellow,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnedThumbImage: {
    width: 44,
    height: 44,
  },
  returnedCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  returnedName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  photoStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.softBackground,
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
  viewOrder: {
    minHeight: 42,
    borderRadius: radii.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewOrderLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  eligibleCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow.soft,
  },
  eligibleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eligibleHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.primaryInk,
  },
  requestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.softYellow,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  requestPillLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryInk,
  },
  thumbs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.softYellow,
    borderWidth: 2,
    borderColor: colors.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbOverlap: {
    marginLeft: -10,
  },
  thumbImage: {
    width: 40,
    height: 40,
  },
  thumbMore: {
    backgroundColor: colors.ink,
  },
  thumbMoreLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.white,
  },
  policyCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space.md,
    gap: 12,
    ...shadow.soft,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  policyCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  policyText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  faqLink: {
    minHeight: 46,
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
