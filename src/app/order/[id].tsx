import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogImage } from '@/components/home/CatalogImage';
import { OrderCancelModal } from '@/components/orders/OrderCancelModal';
import { OrderReturnRefundModal } from '@/components/orders/OrderReturnRefundModal';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { canCancelOrderStatus } from '@/data/orderCancelReasons';
import { canReturnOrderStatus } from '@/data/orderReturnReasons';
import { useCatalog } from '@/context/CatalogContext';
import { findPastOrder } from '@/data/pastOrders';
import { profileRoutes } from '@/navigation/profileRoutes';
import { canUseDevelopmentHome } from '@/services/devOtp';
import type { SimulatedOrder } from '@/types/order';
import { formatRupee } from '@/utils/cartBill';
import {
  buildOrderTimeline,
  isActiveOrder,
  orderItemCount,
  orderStatusIcon,
  orderStatusLabel,
  statusPillColors,
} from '@/utils/orderListing';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { hydrated, session, devSession } = useAuthSession();
  const { findProduct } = useCatalog();
  const { findOrder, cancelOrder, requestReturn } = usePreviewSession();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = firstParam(id)?.trim() ?? '';
  const previewOrder = findOrder(orderId);
  const liveOrder = orderId ? findPastOrder(orderId) : null;
  const order = (previewOrder ?? liveOrder) as SimulatedOrder | null;
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returning, setReturning] = useState(false);
  const canCancel = Boolean(order && canCancelOrderStatus(order.status) && previewOrder);
  const canReturn = Boolean(
    order && previewOrder && canReturnOrderStatus(order.status, previewOrder.returnRequested),
  );

  if (!hydrated) {
    return null;
  }

  if (!session && !canUseDevelopmentHome(devSession)) {
    return <Redirect href={profileRoutes.login} />;
  }

  const pill = order ? statusPillColors(order.status) : null;
  const statusIcon = order ? orderStatusIcon(order.status) : 'box';
  const active = order ? isActiveOrder(order) : false;

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Order details" fallbackHref="/orders" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 28) }]}
        showsVerticalScrollIndicator={false}>
        {!order ? (
          <View style={styles.card}>
            <Text style={styles.heading}>Order not available</Text>
            <Text style={styles.body}>
              {UI_PREVIEW_MODE
                ? 'This demo order id was not found in the preview session.'
                : 'This order is not in the store service yet. No sample order was added.'}
            </Text>
          </View>
        ) : (
          <>
            {UI_PREVIEW_MODE ? <DemoBanner /> : null}

            <LinearGradient
              colors={['#FFFBEB', '#FEF3C7', '#FDE68A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={[styles.heroIcon, pill ? { backgroundColor: pill.background } : null]}>
                  <AppIcon name={statusIcon} color={pill?.text ?? colors.primaryInk} size={22} />
                </View>
                <View style={styles.heroCopy}>
                  <Text style={styles.orderId}>#{order.id}</Text>
                  <Text style={styles.meta}>Placed on {order.placedAtLabel}</Text>
                </View>
              </View>

              {pill ? (
                <View style={[styles.statusPill, { backgroundColor: pill.background, borderColor: pill.border }]}>
                  <Text style={[styles.statusPillLabel, { color: pill.text }]}>
                    {orderStatusLabel[order.status]}
                  </Text>
                </View>
              ) : null}

              {order.statusDetail ? <Text style={styles.statusDetail}>{order.statusDetail}</Text> : null}

              {active && order.eta ? (
                <View style={styles.etaRow}>
                  <AppIcon name="clock" color={colors.primaryInk} size={16} />
                  <Text style={styles.etaText}>
                    Arriving in {order.eta.value} {order.eta.unit}
                  </Text>
                </View>
              ) : null}

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{orderItemCount(order)}</Text>
                  <Text style={styles.heroStatLabel}>Items</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>
                    {typeof order.totalAmount === 'number'
                      ? formatRupee(order.totalAmount)
                      : 'total' in order && typeof order.total === 'number'
                        ? formatRupee(order.total)
                        : '—'}
                  </Text>
                  <Text style={styles.heroStatLabel}>Total</Text>
                </View>
              </View>
            </LinearGradient>

            <Text style={styles.section}>Items</Text>
            <View style={styles.card}>
              {order.items.length === 0 ? <Text style={styles.body}>No items were included with this order.</Text> : null}
              {order.items.map((item, index) => {
                const product = findProduct(item.id);
                const lineTotal =
                  product && Number.isFinite(product.price) ? product.price * item.quantity : null;
                return (
                  <View
                    key={`${item.id}-${item.name}`}
                    style={[styles.line, index > 0 ? styles.lineBorder : null]}>
                    <View style={styles.thumb}>
                      {product ? (
                        <CatalogImage source={product.image} style={styles.thumbImage} contentFit="cover" />
                      ) : (
                        <Text style={styles.thumbFallback}>?</Text>
                      )}
                    </View>
                    <View style={styles.lineCopy}>
                      <Text style={styles.lineName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.meta}>
                        Qty {item.quantity}
                        {item.unit ? ` · ${item.unit}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.linePrice}>
                      {lineTotal != null ? formatRupee(lineTotal) : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.section}>Delivery address</Text>
            <View style={styles.card}>
              <View style={styles.addressRow}>
                <View style={styles.addressIcon}>
                  <AppIcon name="stores" color={colors.primaryInk} size={18} />
                </View>
                <View style={styles.addressCopy}>
                  <Text style={styles.heading}>{order.addressTitle || 'Delivery'}</Text>
                  <Text style={styles.body}>{order.addressLine || 'Address was not included.'}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.section}>Payment</Text>
            <View style={styles.card}>
              <View style={styles.paymentRow}>
                <AppIcon name="card" color={colors.primaryInk} size={18} />
                <Text style={styles.body}>
                  {'paymentLabel' in order && order.paymentLabel
                    ? order.paymentLabel
                    : 'Payment method not published'}
                </Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.heading}>Order total</Text>
                <Text style={styles.totalValue}>
                  {typeof order.totalAmount === 'number'
                    ? formatRupee(order.totalAmount)
                    : 'total' in order && typeof order.total === 'number'
                      ? formatRupee(order.total)
                      : '—'}
                </Text>
              </View>
              <Text style={styles.note}>Bill figures are demo display values until a live order API exists.</Text>
            </View>

            <Text style={styles.section}>Delivery progress</Text>
            <View style={styles.card}>
              <OrderTimeline steps={buildOrderTimeline(order)} />
            </View>

            {order.status !== 'cancelled' && order.status !== 'delivered' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Track Order"
                onPress={() => router.push({ pathname: '/track', params: { id: order.id } })}
                style={({ pressed }) => [styles.trackButton, pressed && styles.pressed]}>
                <AppIcon name="truck" color={colors.text} size={18} />
                <Text style={styles.trackLabel}>Track Order</Text>
              </Pressable>
            ) : null}

            {canCancel ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel order"
                onPress={() => setCancelOpen(true)}
                style={({ pressed }) => [styles.cancelOutline, pressed && styles.pressed]}
                testID="order-cancel-open">
                <Text style={styles.cancelOutlineLabel}>Cancel Order</Text>
              </Pressable>
            ) : null}

            {order.status === 'delivered' ? (
              <View style={styles.reviewActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Rate delivery"
                  onPress={() => router.push({ pathname: '/delivery-review', params: { id: order.id } })}
                  style={({ pressed }) => [styles.trackButton, styles.reviewActionHalf, pressed && styles.pressed]}>
                  <Text style={styles.trackLabel}>Rate Delivery</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Rate products"
                  onPress={() => router.push({ pathname: '/product-review', params: { id: order.id } })}
                  style={({ pressed }) => [styles.secondaryButton, styles.reviewActionHalf, pressed && styles.pressed]}>
                  <Text style={styles.secondaryLabel}>Rate Products</Text>
                </Pressable>
              </View>
            ) : null}

            {canReturn ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Return and refund"
                onPress={() => setReturnOpen(true)}
                style={({ pressed }) => [styles.returnOutline, pressed && styles.pressed]}
                testID="order-return-open">
                <AppIcon name="returns" color={colors.primaryInk} size={18} />
                <Text style={styles.returnOutlineLabel}>Return & Refund</Text>
              </Pressable>
            ) : null}

            {previewOrder?.returnRequested ? (
              <View style={styles.returnNote}>
                <AppIcon name="check" color={colors.success} size={16} />
                <Text style={styles.returnNoteText}>Return request submitted for this order.</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  content: {
    padding: homeLayout.gutter,
    gap: 12,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  heroCard: {
    borderRadius: radii.sheet,
    padding: space.lg,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    overflow: 'hidden',
    ...shadow.soft,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softYellow,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  orderId: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusPillLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  statusDetail: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryInk,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  etaText: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryInk,
  },
  heroStats: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
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
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  heroStatValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  heroStatLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: space.md,
    gap: 8,
    ...shadow.soft,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  lineBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.softYellow,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: 52,
    height: 52,
  },
  thumbFallback: {
    fontFamily: fonts.bold,
    color: colors.primaryInk,
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
  linePrice: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalValue: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
  trackButton: {
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...shadow.soft,
  },
  trackLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 10,
  },
  reviewActionHalf: {
    flex: 1,
    paddingHorizontal: 8,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primaryInk,
    textAlign: 'center',
  },
  cancelOutline: {
    minHeight: 52,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOutlineLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.danger,
    textAlign: 'center',
  },
  returnOutline: {
    minHeight: 52,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  returnOutlineLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primaryInk,
    textAlign: 'center',
  },
  returnNote: {
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#86EFAC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  returnNoteText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#166534',
  },
  pressed: {
    opacity: 0.8,
  },
});
