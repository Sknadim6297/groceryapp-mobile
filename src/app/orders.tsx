import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { PreviewScaffold } from '@/components/preview/PreviewScaffold';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { formatRupee } from '@/utils/cartBill';

export default function OrdersScreen() {
  const { orders } = usePreviewSession();

  if (!UI_PREVIEW_MODE) {
    return <PlaceholderScreen title="Orders" message="Orders are not connected yet." withHeader />;
  }

  return (
    <PreviewScaffold title="Orders" subtitle="Simulated orders from this preview session.">
      {orders.length === 0 ? (
        <Text style={styles.empty}>No simulated orders yet. They stay on this device only until you leave the app.</Text>
      ) : null}
      {orders.map((order) => (
        <Pressable
          key={order.id}
          accessibilityRole="button"
          accessibilityLabel={`Open simulated order ${order.id}`}
          onPress={() => router.push({ pathname: '/order-confirmed', params: { id: order.id } })}
          style={styles.card}>
          <Text style={styles.title}>{order.id}</Text>
          <Text style={styles.body}>{order.placedAtLabel}</Text>
          <Text style={styles.body}>
            {order.items.length} {order.items.length === 1 ? 'line' : 'lines'} · {formatRupee(order.total)}
          </Text>
        </Pressable>
      ))}
    </PreviewScaffold>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
