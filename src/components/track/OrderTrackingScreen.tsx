import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogImage } from '@/components/home/CatalogImage';
import { OrderCancelModal } from '@/components/orders/OrderCancelModal';
import { OrderReturnRefundModal } from '@/components/orders/OrderReturnRefundModal';
import { DemoTrackingMap } from '@/components/track/DemoTrackingMap';
import { AppIcon } from '@/components/ui/AppIcon';
import { useToast } from '@/components/ui/AppToast';
import { BRAND_NAME } from '@/constants/brand';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, radii } from '@/constants/theme';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { readActiveOrder } from '@/data/activeOrder';
import { buildTrackPanelTimeline, getDemoOrderTracking, shouldShowRiderMarker } from '@/data/demoOrderTracking';
import { findDemoProduct } from '@/data/findDemoProduct';
import { canCancelOrderStatus } from '@/data/orderCancelReasons';
import { canReturnOrderStatus } from '@/data/orderReturnReasons';
import type { CustomerOrder, OrderLine, SimulatedOrder } from '@/types/order';
import type { TrackTimelineStep } from '@/types/orderTracking';
import { formatRupee } from '@/utils/cartBill';
import { isActiveOrder } from '@/utils/orderListing';
import { formatTrackingEtaLabel, trackingEtaFallbackLabel } from '@/utils/trackingEta';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function goBackToOrders() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/orders');
}

export function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const compact = width < 360;
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = firstParam(id);
  const { findOrder, orders, cancelOrder, requestReturn } = usePreviewSession();
  const [panelExpanded, setPanelExpanded] = useState(false);
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
  const timeline = useMemo(() => (order ? buildTrackPanelTimeline(order) : []), [order]);
  const canCancel = Boolean(previewOrder && order && canCancelOrderStatus(order.status));
  const canReturn = Boolean(
    previewOrder && order && canReturnOrderStatus(order.status, previewOrder.returnRequested),
  );

  // Tab scene already lays out above FloatingTabBar — do not reserve tab height again
  // inside the sheet (that created the empty white band under Order Details).
  const sheetRatio = panelExpanded ? 0.78 : width < 360 ? 0.56 : 0.52;
  const sheetHeight = Math.round(Math.min(height * sheetRatio, height - insets.top - 88));
  const mapBottomClearance = sheetHeight + 12;

  return (
    <View style={styles.screen} testID="track-order-screen">
      <StatusBar style="dark" />

      {!order || !tracking ? (
        <>
          <FloatingTrackHeader topInset={insets.top} />
          <EmptyTracking
            previewMode={UI_PREVIEW_MODE}
            bottomInset={Math.max(insets.bottom, 16)}
            reason={
              liveState?.kind === 'error'
                ? liveState.message
                : liveState?.kind === 'loading'
                  ? 'Looking up the current order.'
                  : undefined
            }
          />
        </>
      ) : (
        <View style={styles.body}>
          <View style={StyleSheet.absoluteFill}>
            <DemoTrackingMap
              tracking={tracking}
              showRider={shouldShowRiderMarker(order.status)}
              topClearance={insets.top + 56}
              bottomClearance={mapBottomClearance}
            />
          </View>

          <FloatingTrackHeader topInset={insets.top} />

          <View
            style={[styles.sheet, { height: sheetHeight }]}
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
              style={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
              nestedScrollEnabled
              contentContainerStyle={styles.sheetContent}>
              <EtaBlock order={order} compact={compact} />

              <PartnerRow
                order={order}
                onChat={() => router.push('/support/chat')}
                onCall={() => {
                  const phone = order.partner?.phone?.trim();
                  if (!phone) {
                    showToast('info', 'Delivery partner phone is not available for this order.');
                    return;
                  }
                  void Linking.openURL(`tel:${phone}`).catch(() => {
                    showToast('error', 'Could not open the phone dialer.');
                  });
                }}
              />

              <RouteCard order={order} />

              <OrderDetailsBlock order={order} compact={compact} />

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
                    <Text style={styles.detailsBtnLabel}>View full order details</Text>
                    <AppIcon name="chevron" color={colors.primaryInk} size={16} />
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
                  <Text style={styles.moreLabel}>Show timeline & more</Text>
                  <AppIcon name="chevronDown" color={colors.primaryInk} size={16} />
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
          items={order.items}
          submitting={returning}
          onClose={() => {
            if (!returning) {
              setReturnOpen(false);
            }
          }}
          onConfirm={(payload) => {
            setReturning(true);
            const ok = requestReturn(order.id, payload);
            setReturning(false);
            setReturnOpen(false);
            if (ok) {
              showToast('success', 'Return request submitted with product photos.');
            } else {
              showToast('error', 'A return cannot be requested for this order.');
            }
          }}
        />
      ) : null}
    </View>
  );
}

function FloatingTrackHeader({ topInset }: { topInset: number }) {
  return (
    <View style={[styles.header, { paddingTop: topInset + 8 }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={goBackToOrders}
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        testID="track-header-back">
        <AppIcon name="back" color={colors.text} size={22} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle} numberOfLines={1}>
        Track Live Location
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function EtaBlock({ order, compact }: { order: CustomerOrder; compact: boolean }) {
  const eta = formatTrackingEtaLabel(order);
  return (
    <View style={styles.etaBlock} accessibilityRole="summary">
      <Text style={styles.etaLabel}>Estimated Arrival Time</Text>
      <View style={[styles.etaValueRow, compact && styles.etaValueRowCompact]}>
        <View style={styles.etaClockWash}>
          <AppIcon name="clock" color={colors.primaryInk} size={16} />
        </View>
        <Text style={[styles.etaValue, compact && styles.etaValueCompact]} numberOfLines={2}>
          {eta ?? trackingEtaFallbackLabel()}
        </Text>
      </View>
    </View>
  );
}

function PartnerRow({
  order,
  onChat,
  onCall,
}: {
  order: CustomerOrder;
  onChat: () => void;
  onCall: () => void;
}) {
  const name = order.partner?.name?.trim();
  const hasPartner = Boolean(name);
  const displayName = name || 'Delivery partner updating';
  const initials = hasPartner
    ? name!
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
    : '?';
  const phoneReady = Boolean(order.partner?.phone?.trim());

  return (
    <View style={styles.partnerRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.partnerCopy}>
        <Text style={styles.partnerName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.partnerRole} numberOfLines={1}>
          {order.partner?.status?.trim() || 'Delivery Partner'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Chat with support about this order"
        onPress={onChat}
        style={({ pressed }) => [styles.actionBtn, styles.chatBtn, pressed && styles.pressed]}
        testID="track-chat">
        <AppIcon name="chat" color={colors.white} size={18} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={phoneReady ? 'Call delivery partner' : 'Delivery partner phone unavailable'}
        accessibilityState={{ disabled: !phoneReady }}
        onPress={onCall}
        style={({ pressed }) => [
          styles.actionBtn,
          styles.callBtn,
          !phoneReady && styles.actionBtnDisabled,
          pressed && styles.pressed,
        ]}
        testID="track-call">
        <AppIcon name="phone" color={phoneReady ? colors.success : colors.textSecondary} size={18} />
      </Pressable>
    </View>
  );
}

function RouteCard({ order }: { order: CustomerOrder }) {
  const dropOff = [order.addressTitle, order.addressLine].filter(Boolean).join(', ');
  return (
    <View style={styles.routeCard}>
      <View style={styles.routeRow}>
        <View style={styles.routeIconCol}>
          <View style={styles.pickupDotOuter}>
            <View style={styles.pickupDotInner} />
          </View>
          <View style={styles.routeDash} />
          <View style={styles.dropPin}>
            <AppIcon name="stores" color={colors.white} size={12} />
          </View>
        </View>
        <View style={styles.routeCopyCol}>
          <View style={styles.routeTextBlock}>
            <Text style={styles.routeEyebrow}>Pickup</Text>
            <Text style={styles.routeTitle} numberOfLines={1}>
              {BRAND_NAME}
            </Text>
          </View>
          <View style={styles.routeTextBlock}>
            <Text style={styles.routeEyebrow}>Drop-off</Text>
            <Text style={styles.routeTitle} numberOfLines={2}>
              {dropOff || 'Delivery address updating'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function OrderDetailsBlock({ order, compact }: { order: CustomerOrder; compact: boolean }) {
  const total =
    typeof order.totalAmount === 'number'
      ? order.totalAmount
      : 'total' in order && typeof (order as SimulatedOrder).total === 'number'
        ? (order as SimulatedOrder).total
        : null;
  const lines = order.items.slice(0, compact ? 2 : 3);

  return (
    <View style={styles.orderDetails}>
      <View style={styles.orderDetailsHeader}>
        <Text style={styles.sectionLabel}>Order Details</Text>
        {total != null ? <Text style={styles.orderTotal}>{formatRupee(total)}</Text> : null}
      </View>

      {lines.length === 0 ? (
        <Text style={styles.emptyLines}>No items were included with this order.</Text>
      ) : (
        lines.map((item) => <OrderLineCard key={`${item.id}-${item.name}`} item={item} />)
      )}

      {order.items.length > lines.length ? (
        <Text style={styles.moreItems}>+{order.items.length - lines.length} more items</Text>
      ) : null}

      {order.offer?.title ? (
        <Text style={styles.offerNote} numberOfLines={2}>
          {order.offer.title}
          {order.offer.detail ? ` · ${order.offer.detail}` : ''}
        </Text>
      ) : null}
    </View>
  );
}

function OrderLineCard({ item }: { item: OrderLine }) {
  const product = findDemoProduct(item.id);
  const discount =
    product?.discountLabel?.trim() ||
    (product?.compareAt && product.compareAt > product.price
      ? `${Math.round(((product.compareAt - product.price) / product.compareAt) * 100)}% OFF`
      : null);

  return (
    <View style={styles.lineCard}>
      <View style={styles.lineThumb}>
        {product ? (
          <CatalogImage source={product.image} style={styles.lineThumbImage} contentFit="cover" />
        ) : (
          <View style={styles.lineThumbFallback}>
            <AppIcon name="bag" color={colors.textSecondary} size={18} />
          </View>
        )}
        {discount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.lineCopy}>
        <Text style={styles.lineName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.lineMeta} numberOfLines={1}>
          Qty {item.quantity}
          {item.unit ? ` · ${item.unit}` : ''}
        </Text>
      </View>
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
    backgroundColor: '#F3F4F6',
  },
  body: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 44,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 14,
    overflow: 'hidden',
  },
  handleHit: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 16,
    flexGrow: 1,
  },
  etaBlock: {
    alignItems: 'center',
    gap: 8,
  },
  etaLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  etaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.softYellow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    maxWidth: '100%',
  },
  etaValueRowCompact: {
    paddingHorizontal: 10,
  },
  etaClockWash: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    flexShrink: 1,
  },
  etaValueCompact: {
    fontSize: 18,
    lineHeight: 24,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.softYellow,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primaryInk,
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
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtn: {
    backgroundColor: colors.success,
  },
  callBtn: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  actionBtnDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.softBackground,
  },
  routeCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  routeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  routeIconCol: {
    width: 28,
    alignItems: 'center',
    paddingTop: 4,
    alignSelf: 'stretch',
  },
  pickupDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupDotInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.ink,
  },
  routeDash: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginVertical: 4,
    backgroundColor: '#D1D5DB',
    opacity: 0.9,
  },
  dropPin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCopyCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    gap: 16,
  },
  routeTextBlock: {
    gap: 2,
  },
  routeEyebrow: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  routeTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  orderDetails: {
    gap: 10,
  },
  orderDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderTotal: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  emptyLines: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  moreItems: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  offerNote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
  },
  lineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.warmBackground,
    borderRadius: 16,
    padding: 10,
  },
  lineThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  lineThumbImage: {
    width: '100%',
    height: '100%',
  },
  lineThumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: colors.success,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  discountText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: colors.white,
  },
  lineCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  lineName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  lineMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.softYellow,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  detailsBtnLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
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
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
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
