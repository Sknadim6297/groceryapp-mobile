import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PreviewScaffold } from '@/components/preview/PreviewScaffold';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { formatRupee } from '@/utils/cartBill';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function OrderConfirmedScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = firstParam(id);
  const { orders } = usePreviewSession();
  const order = orders.find((item) => item.id === orderId) ?? orders[0];

  if (!UI_PREVIEW_MODE) {
    return <PlaceholderScreen title="Order" message="Order confirmation is not connected yet." withHeader />;
  }

  return (
    <PreviewScaffold title="Order received" subtitle="Simulated confirmation. No order was placed.">
      <View style={styles.card}>
        <Text style={styles.title}>{order ? `Preview ${order.id}` : 'No simulated order'}</Text>
        <Text style={styles.body}>
          {order
            ? `${order.paymentLabel}. Preview total ${formatRupee(order.total)}. This was not submitted to a store.`
            : 'Place a simulated order from the cart to see it here.'}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Track this preview order" onPress={() => router.push('/track')}>
          <Text style={styles.link}>Track preview order</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="View preview orders" onPress={() => router.push('/orders')}>
          <Text style={styles.link}>View preview orders</Text>
        </Pressable>
      </View>
    </PreviewScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.primaryInk,
  },
});
