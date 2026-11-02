import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { findPastOrder, readPastOrders } from '@/data/pastOrders';
import { profileRoutes } from '@/navigation/profileRoutes';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { hydrated, session, devSession } = useAuthSession();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = firstParam(id)?.trim() ?? '';
  const order = orderId ? findPastOrder(orderId) : null;
  const orders = readPastOrders();

  if (!hydrated) {
    return null;
  }

  if (!session && !canUseDevelopmentHome(devSession)) {
    return <Redirect href={profileRoutes.login} />;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace(profileRoutes.profile))}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <AppIcon name="back" color={colors.text} size={24} />
        </Pressable>
        <Text style={styles.title}>Order details</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {order ? (
          <View style={styles.card}>
            <Text style={styles.heading}>{order.addressTitle || `Order ${order.id}`}</Text>
            <Text style={styles.body}>{order.id}</Text>
            <Text style={styles.body}>{order.placedAtLabel}</Text>
            {order.addressLine ? <Text style={styles.body}>{order.addressLine}</Text> : null}
            {order.items.length === 0 ? <Text style={styles.body}>No items were included with this order.</Text> : null}
            {order.items.map((item) => (
              <Text key={item.id} style={styles.body}>
                {item.name} x {item.quantity}
                {item.unit ? ` · ${item.unit}` : ''}
              </Text>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.heading}>{orders.kind === 'error' ? 'Orders are unavailable' : 'Order not available'}</Text>
            <Text style={styles.body}>
              {orders.kind === 'error'
                ? orders.message
                : 'This order is not in the store service yet. No sample order was added.'}
            </Text>
          </View>
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
  header: {
    backgroundColor: colors.brightYellow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
  },
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
    gap: 8,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.75,
  },
});
