import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DemoBanner } from '@/components/preview/DemoBanner';
import { PreviewScaffold } from '@/components/preview/PreviewScaffold';
import { AppIcon } from '@/components/ui/AppIcon';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { formatRupee } from '@/utils/cartBill';
import { orderItemCount } from '@/utils/orderListing';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function OrderConfirmedScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = firstParam(id);
  const { findOrder, orders } = usePreviewSession();
  const order = findOrder(orderId) ?? orders[0] ?? null;

  if (!UI_PREVIEW_MODE) {
    return <PlaceholderScreen title="Order" message="Order confirmation is not connected yet." withHeader />;
  }

  return (
    <PreviewScaffold title="Order success" subtitle="Demo confirmation — no live order was created.">
      <DemoBanner message="This is a simulated order success screen for UI development." />

      <View style={styles.hero}>
        <View style={styles.badge}>
          <AppIcon name="check" color={colors.text} size={36} />
        </View>
        <Text style={styles.title}>Demo order placed</Text>
        <Text style={styles.body}>
          {order
            ? `Preview order #${order.id} is saved only in this app session.`
            : 'Place a simulated order from checkout to see details here.'}
        </Text>
      </View>

      {order ? (
        <View style={styles.card}>
          <Text style={styles.heading}>Order summary</Text>
          <Text style={styles.meta}>#{order.id}</Text>
          <Text style={styles.meta}>{order.paymentLabel}</Text>
          <Text style={styles.meta}>
            {orderItemCount(order)} items · {formatRupee(order.total)}
          </Text>
          <Text style={styles.meta}>{order.addressLine}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Track Order"
        disabled={!order}
        onPress={() => router.push({ pathname: '/track', params: { id: order?.id } })}
        style={[styles.primary, !order && styles.disabled]}>
        <Text style={styles.primaryLabel}>Track Order</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue Shopping"
        onPress={() => router.replace('/shop')}
        style={styles.secondary}>
        <Text style={styles.secondaryLabel}>Continue Shopping</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/orders')}>
        <Text style={styles.link}>View My Orders</Text>
      </Pressable>
    </PreviewScaffold>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  primary: {
    minHeight: 52,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  secondary: {
    minHeight: 48,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.primaryInk,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
