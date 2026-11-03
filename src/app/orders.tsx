import { Redirect, router, useIsFocused } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderCard } from '@/components/orders/OrderCard';
import { OrdersFilterChips } from '@/components/orders/OrdersFilterChips';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { profileRoutes } from '@/navigation/profileRoutes';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { filterOrders, type OrdersFilterId } from '@/utils/orderListing';

export default function OrdersScreen() {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { hydrated, session, devSession } = useAuthSession();
  const { orders } = usePreviewSession();
  const [filter, setFilter] = useState<OrdersFilterId>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visible = useMemo(() => filterOrders(orders, filter), [filter, orders]);

  if (!hydrated) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  if (!session && !canUseDevelopmentHome(devSession)) {
    if (!focused) {
      return null;
    }
    return <Redirect href={profileRoutes.login} />;
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="My Orders" fallbackHref={profileRoutes.profile} />

      <FlatList
        data={visible}
        keyExtractor={(order) => order.id}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
          visible.length === 0 ? styles.listGrow : null,
        ]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.heroTitleRow}>
              <Text style={styles.heroTitle}>Your orders</Text>
              <AppIcon name="star" color={colors.primaryDark} size={18} />
            </View>
            <Text style={styles.heroSubtitle}>Track your groceries, from checkout to doorstep.</Text>
            {UI_PREVIEW_MODE ? <DemoBanner message="Demo orders for UI preview — nothing was placed at a store." /> : null}
            <OrdersFilterChips value={filter} onChange={setFilter} />
          </View>
        }
        ListEmptyComponent={
          !UI_PREVIEW_MODE || orders.length === 0 ? (
            <EmptyOrdersState />
          ) : (
            <FilterEmptyState filter={filter} />
          )
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId((current) => (current === item.id ? null : item.id))}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        testID="orders-list"
      />
    </View>
  );
}

function EmptyOrdersState() {
  return (
    <View style={styles.empty} testID="orders-empty">
      <View style={styles.emptyIcon}>
        <AppIcon name="bag" color={colors.text} size={28} />
      </View>
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptyBody}>
        {UI_PREVIEW_MODE
          ? 'Demo orders will appear here after a simulated checkout, or from seeded preview fixtures.'
          : 'Your grocery orders will appear here once you place your first order.'}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start Shopping"
        onPress={() => router.push('/shop')}
        style={({ pressed }) => [styles.shopButton, pressed && styles.pressed]}
        testID="orders-start-shopping">
        <Text style={styles.shopLabel}>Start Shopping</Text>
      </Pressable>
    </View>
  );
}

function FilterEmptyState({ filter }: { filter: OrdersFilterId }) {
  const copy =
    filter === 'active'
      ? 'No active demo orders right now.'
      : filter === 'delivered'
        ? 'No delivered demo orders in this filter.'
        : 'No orders in this list.';
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{copy}</Text>
      <Text style={styles.emptyBody}>Try another filter, or browse Shop.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.softBackground,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: homeLayout.gutter,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  listGrow: {
    flexGrow: 1,
  },
  headerBlock: {
    gap: 8,
    marginBottom: 14,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
  },
  heroSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  separator: {
    height: 12,
  },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  shopButton: {
    minHeight: 48,
    minWidth: 180,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  pressed: {
    opacity: 0.78,
  },
});
