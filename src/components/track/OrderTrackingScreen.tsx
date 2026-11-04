import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderCancelModal } from '@/components/orders/OrderCancelModal';
import { OrderReturnRefundModal } from '@/components/orders/OrderReturnRefundModal';
import { DemoTrackingMap } from '@/components/track/DemoTrackingMap';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { useMockCart } from '@/context/MockCartContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { readActiveOrder } from '@/data/activeOrder';
import { canCancelOrderStatus } from '@/data/orderCancelReasons';
import { canReturnOrderStatus } from '@/data/orderReturnReasons';
import { buildTrackPanelTimeline, getDemoOrderTracking } from '@/data/demoOrderTracking';
import type { CustomerOrder } from '@/types/order';
import type { TrackTimelineStep } from '@/types/orderTracking';
import { isActiveOrder } from '@/utils/orderListing';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { showToast } = useToast();
  const { totalCount } = useMockCart();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = firstParam(id);
  const { findOrder, orders, cancelOrder, requestReturn } = usePreviewSession();
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returning, setReturning] = useState(false);

  const previewOrder = UI_PREVIEW_MODE
    ? findOrder(orderId) ??
      orders.find((order) => isActiveOrder(order)) ??
      orders.find((order) => order.status === 'out_for_delivery') ??
      null
    : null;
  const liveState = previewOrder ? null : readActiveOrder();
  const order: CustomerOrder | null =
    previewOrder ?? (liveState?.kind === 'ready' ? liveState.order : null);
  const tracking = order ? getDemoOrderTracking(order) : null;
  const mapHeight = Math.max(280, Math.round(height * 0.58));
  const timeline = useMemo(() => (order ? buildTrackPanelTimeline(order) : []), [order]);
  const canCancel = Boolean(previewOrder && order && canCancelOrderStatus(order.status));
  const canReturn = Boolean(
    previewOrder && order && canReturnOrderStatus(order.status, previewOrder.returnRequested),
  );

  return (
    <View style={styles.screen} testID="track-order-screen">
      <AppScreenHeader
        title="Track Order"
        fallbackHref="/orders"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open cart"
            onPress={() => router.push('/cart')}
            style={({ pressed }) => [styles.headerCart, pressed && styles.pressed]}
            testID="track-header-cart">
            <AppIcon name="bag" color={colors.primaryInk} size={20} />
            {totalCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCount > 9 ? '9+' : totalCount}</Text>
              </View>
            ) : null}
          </Pressable>
        }
      />

      {!order || !tracking ? (
        <EmptyTracking
          previewMode={UI_PREVIEW_MODE}
          bottomInset={insets.bottom}
          reason={
            liveState?.kind === 'error'
              ? liveState.message
              : liveState?.kind === 'loading'
                ? 'Looking up the current order.'
                : undefined
          }
        />
      ) : (
        <View style={styles.body}>
          <View style={[styles.mapWrap, { height: mapHeight }]}>
            <DemoTrackingMap tracking={tracking} />
          </View>

          <View
            style={[
              styles.panel,
              panelExpanded ? styles.panelExpanded : styles.panelCollapsed,
            ]}
            testID="track-bottom-panel">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={panelExpanded ? 'Collapse delivery details' : 'Expand delivery details'}
              onPress={() => setPanelExpanded((open) => !open)}
              style={styles.handleHit}
              testID="track-panel-toggle">
              <View style={styles.handle} />
            </Pressable>

            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={[
                styles.panelContent,
                { paddingBottom: Math.max(insets.bottom, 8) + 76 },
              ]}>
              <PartnerRow
                order={order}
                onCallPreview={() =>
                  showToast('info', 'Preview only — partner call is not connected.')
                }
              />

              <DetailRow
                icon="stores"
                iconWash="#FEF3C7"
                iconColor={colors.primaryInk}
                title={order.addressTitle || 'Delivery address'}
                subtitle={order.addressLine || 'Address was not included.'}
              />

              <DetailRow
                icon="clock"
                iconWash="#FEF3C7"
                iconColor={colors.primaryInk}
                title={tracking.etaRangeLabel}
                subtitle="Estimated Delivery Time"
              />

              <DetailRow
                icon="truck"
                iconWash="#DCFCE7"
                iconColor="#15803D"
                title="Order Status"
                subtitle={order.statusDetail ?? 'Your groceries are on the way'}
                trailing={
                  <View style={styles.statusChip}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusChipText}>{tracking.statusChipLabel}</Text>
                  </View>
                }
              />

              <DetailRow
                icon="bag"
                iconWash="#FEF3C7"
                iconColor={colors.primaryInk}
                title="Order ID"
                subtitle={order.id}
                trailing={
                  <View style={styles.paidChip}>
                    <AppIcon name="check" color="#15803D" size={12} />
                    <Text style={styles.paidChipText}>{tracking.paymentChipLabel}</Text>
                  </View>
                }
              />

              {panelExpanded ? (
                <>
                  <Text style={styles.sectionLabel}>Delivery progress</Text>
                  <View style={styles.timelineCard}>
                    {timeline.map((step, index) => (
                      <TimelineRow key={step.id} step={step} last={index === timeline.length - 1} />
                    ))}
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="View order details"
                    onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
                    style={({ pressed }) => [styles.detailsBtn, pressed && styles.pressed]}
                    testID="track-view-order-details">
                    <Text style={styles.detailsBtnLabel}>View Order Details</Text>
                  </Pressable>

                  {canCancel ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Cancel order"
                      onPress={() => setCancelOpen(true)}
                      style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
                      testID="track-cancel-order">
                      <Text style={styles.cancelBtnLabel}>Cancel Order</Text>
                    </Pressable>
                  ) : null}

                  {order.status === 'delivered' ? (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Rate delivery"
                        onPress={() => router.push({ pathname: '/delivery-review', params: { id: order.id } })}
                        style={({ pressed }) => [styles.reviewBtn, pressed && styles.pressed]}
                        testID="track-rate-delivery">
                        <Text style={styles.reviewBtnLabel}>Rate Delivery</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Rate products"
                        onPress={() => router.push({ pathname: '/product-review', params: { id: order.id } })}
                        style={({ pressed }) => [styles.reviewBtn, pressed && styles.pressed]}
                        testID="track-rate-products">
                        <Text style={styles.reviewBtnLabel}>Rate Products</Text>
                      </Pressable>
                    </>
                  ) : null}

                  {canReturn ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Return and refund"
                      onPress={() => setReturnOpen(true)}
                      style={({ pressed }) => [styles.returnBtn, pressed && styles.pressed]}
                      testID="track-return-order">
                      <Text style={styles.returnBtnLabel}>Return & Refund</Text>
                    </Pressable>
                  ) : null}

                  <Text style={styles.demoFootnote}>{tracking.demoNotice}</Text>
                </>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Show more tracking details"
                  onPress={() => setPanelExpanded(true)}
                  style={styles.moreHit}>
                  <Text style={styles.moreLabel}>Show timeline & details</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {order && canCancel ? (
        <OrderCancelModal
          visible={cancelOpen}
          orderId={order.id}
          submitting={cancelling}
          onClose={() => {
            if (!cancelling) {
              setCancelOpen(false);
            }
          }}
          onConfirm={(reasonIds) => {
            setCancelling(true);
            const ok = cancelOrder(order.id, reasonIds);
            setCancelling(false);
            setCancelOpen(false);
            if (ok) {
              showToast('success', 'Order cancelled. Thanks for the feedback.');
              router.replace('/orders');
            } else {
              showToast('error', 'This order can no longer be cancelled.');
            }
          }}
        />
      ) : null}

      {order && (canReturn || returnOpen) ? (
        <OrderReturnRefundModal
          visible={returnOpen}
          orderId={order.id}
          submitting={returning}
          onClose={() => {
            if (!returning) {
              setReturnOpen(false);
            }
          }}
          onConfirm={(reasonIds) => {
            setReturning(true);
            const ok = requestReturn(order.id, reasonIds);
            setReturning(false);
            setReturnOpen(false);
            if (ok) {
              showToast('success', 'Return request submitted. We’ll review it shortly.');
            } else {
              showToast('error', 'A return cannot be requested for this order.');
            }
          }}
        />
      ) : null}
    </View>
  );
}

function PartnerRow({
  order,
  onCallPreview,
}: {
  order: CustomerOrder;
  onCallPreview: () => void;
}) {
  const name = order.partner?.name ?? 'Delivery Partner';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <View style={styles.partnerRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials || 'DP'}</Text>
      </View>
      <View style={styles.partnerCopy}>
        <Text style={styles.partnerName}>{name}</Text>
        <Text style={styles.partnerRole}>{order.partner?.status ?? 'Delivery Partner'}</Text>
        {order.partner?.ratingLabel ? (
          <View style={styles.ratingRow}>
            <AppIcon name="star" color={colors.primary} size={14} />
            <Text style={styles.ratingText}>{order.partner.ratingLabel}</Text>
          </View>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Preview call delivery partner"
        onPress={onCallPreview}
        style={({ pressed }) => [styles.callBtn, pressed && styles.pressed]}
        testID="track-call-preview">
        <AppIcon name="phone" color={colors.text} size={20} />
      </Pressable>
    </View>
  );
}

function DetailRow({
  icon,
  iconWash,
  iconColor,
  title,
  subtitle,
  trailing,
}: {
  icon: AppIconName;
  iconWash: string;
  iconColor: string;
  title: string;
  subtitle: string;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: iconWash }]}>
        <AppIcon name={icon} color={iconColor} size={18} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.detailSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      {trailing}
    </View>
  );
}

function TimelineRow({ step, last }: { step: TrackTimelineStep; last: boolean }) {
  const active = step.state === 'done' || step.state === 'current';
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View
          style={[
            styles.timelineDot,
            active && styles.timelineDotActive,
            step.state === 'current' && styles.timelineDotCurrent,
            step.state === 'pending' && styles.timelineDotPending,
          ]}
        />
        {!last ? <View style={[styles.timelineLine, active && styles.timelineLineActive]} /> : null}
      </View>
      <View style={[styles.timelineCopy, last && styles.timelineCopyLast]}>
        <Text style={[styles.timelineLabel, step.state === 'pending' && styles.timelineLabelPending]}>
          {step.label}
        </Text>
        <Text style={styles.timelineAt}>{step.at ?? (step.state === 'pending' ? 'Pending' : '—')}</Text>
      </View>
    </View>
  );
}

function EmptyTracking({
  previewMode,
  bottomInset,
  reason,
}: {
  previewMode: boolean;
  bottomInset: number;
  reason?: string;
}) {
  return (
    <View style={[styles.empty, { paddingBottom: Math.max(bottomInset, 24) }]} testID="track-empty">
      <View style={styles.emptyIcon}>
        <AppIcon name="truck" color={colors.textSecondary} size={36} />
      </View>
      <Text style={styles.emptyTitle}>No active deliveries</Text>
      <Text style={styles.emptyBody}>
        {reason ??
          (previewMode
            ? 'No active demo order is available to track right now.'
            : 'Your active grocery orders will appear here.')}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Explore Products"
        onPress={() => router.push('/shop')}
        style={({ pressed }) => [styles.exploreBtn, pressed && styles.pressed]}
        testID="track-explore-products">
        <Text style={styles.exploreLabel}>Explore Products</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.softBackground,
  },
  body: {
    flex: 1,
  },
  mapWrap: {
    width: '100%',
  },
  headerCart: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.white,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
    maxHeight: '58%',
  },
  panelExpanded: {
    maxHeight: '58%',
  },
  panelCollapsed: {
    maxHeight: 280,
  },
  handleHit: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
  },
  panelContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 14,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  partnerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  partnerName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  partnerRole: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  detailTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  detailSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  statusChipText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: '#15803D',
  },
  paidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  paidChipText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: '#15803D',
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  timelineCard: {
    backgroundColor: colors.softBackground,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 34,
  },
  timelineRail: {
    width: 16,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    backgroundColor: colors.primary,
  },
  timelineDotActive: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primary,
  },
  timelineDotCurrent: {
    borderColor: '#16A34A',
    backgroundColor: '#86EFAC',
  },
  timelineDotPending: {
    borderColor: '#CBD5E1',
    backgroundColor: colors.white,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 2,
    marginBottom: 2,
    backgroundColor: '#E2E8F0',
  },
  timelineLineActive: {
    backgroundColor: colors.primaryDark,
  },
  timelineCopy: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 10,
  },
  timelineCopyLast: {
    paddingBottom: 6,
  },
  timelineLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  timelineLabelPending: {
    color: colors.textSecondary,
  },
  timelineAt: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  detailsBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  detailsBtnLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  cancelBtn: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.danger,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelBtnLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.danger,
  },
  returnBtn: {
    backgroundColor: colors.softYellow,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    paddingVertical: 13,
    alignItems: 'center',
  },
  returnBtnLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  reviewBtn: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    paddingVertical: 13,
    alignItems: 'center',
  },
  reviewBtnLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  demoFootnote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  moreHit: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  moreLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
  exploreBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  exploreLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
