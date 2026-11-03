import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { CatalogImage } from '@/components/home/CatalogImage';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { findDemoProduct } from '@/data/findDemoProduct';
import { findPastOrder } from '@/data/pastOrders';
import { profileRoutes } from '@/navigation/profileRoutes';
import { canUseDevelopmentHome } from '@/services/devOtp';
import type { SimulatedOrder } from '@/types/order';
import { formatRupee } from '@/utils/cartBill';
import { buildOrderTimeline, orderItemCount, orderStatusLabel } from '@/utils/orderListing';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { hydrated, session, devSession } = useAuthSession();
  const { findOrder } = usePreviewSession();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = firstParam(id)?.trim() ?? '';
  const previewOrder = findOrder(orderId);
  const liveOrder = orderId ? findPastOrder(orderId) : null;
  const order = (previewOrder ?? liveOrder) as SimulatedOrder | null;

  if (!hydrated) {
    return null;
  }

  if (!session && !canUseDevelopmentHome(devSession)) {
    return <Redirect href={profileRoutes.login} />;
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Order details" fallbackHref="/orders" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
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
            <View style={styles.card}>
              <Text style={styles.orderId}>Order ID: #{order.id}</Text>
              <Text style={styles.meta}>Placed on {order.placedAtLabel}</Text>
              <Text style={styles.status}>{orderStatusLabel[order.status]}</Text>
              {order.statusDetail ? <Text style={styles.body}>{order.statusDetail}</Text> : null}
            </View>

            <Text style={styles.section}>Items · {orderItemCount(order)}</Text>
            <View style={styles.card}>
              {order.items.length === 0 ? <Text style={styles.body}>No items were included with this order.</Text> : null}
              {order.items.map((item) => {
                const product = findDemoProduct(item.id);
                const lineTotal =
                  product && Number.isFinite(product.price) ? product.price * item.quantity : null;
                return (
                  <View key={`${item.id}-${item.name}`} style={styles.line}>
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
              <Text style={styles.heading}>{order.addressTitle || 'Delivery'}</Text>
              <Text style={styles.body}>{order.addressLine || 'Address was not included.'}</Text>
            </View>

            <Text style={styles.section}>Payment</Text>
            <View style={styles.card}>
              <Text style={styles.body}>
                {'paymentLabel' in order && order.paymentLabel
                  ? order.paymentLabel
                  : 'Payment method not published'}
              </Text>
              <View style={styles.billRow}>
                <Text style={styles.heading}>Order total</Text>
                <Text style={styles.heading}>
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
                <Text style={styles.trackLabel}>Track Order</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.softBackground,
  },
  content: {
    padding: homeLayout.gutter,
    gap: 12,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  orderId: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
  status: {
    alignSelf: 'flex-start',
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
    backgroundColor: colors.softYellow,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    paddingVertical: 6,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.softYellow,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: 48,
    height: 48,
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
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  trackButton: {
    minHeight: 52,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
});
