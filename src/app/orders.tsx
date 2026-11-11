import { LinearGradient } from 'expo-linear-gradient';
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
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { profileRoutes } from '@/navigation/profileRoutes';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { filterOrders, isActiveOrder, type OrdersFilterId } from '@/utils/orderListing';

export default function OrdersScreen() {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { hydrated, session, devSession } = useAuthSession();
  const { orders } = usePreviewSession();
  const [filter, setFilter] = useState<OrdersFilterId>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: orders.length,
      active: orders.filter(isActiveOrder).length,
      delivered: orders.filter((order) => order.status === 'delivered').length,
    }),
    [orders],
  );

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
          { paddingBottom: Math.max(insets.bottom, 28) },
          visible.length === 0 ? styles.listGrow : null,
        ]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <LinearGradient
              colors={['#FFF7CC', '#FFE566', '#FACC15']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}>
              <View style={styles.heroGlow} />
              <View style={styles.heroTop}>
                <View style={styles.heroBadge}>
                  <AppIcon name="bag" color={colors.text} size={18} />
                </View>
                <Text style={styles.heroEyebrow}>Mayapur Bazaar</Text>
              </View>
              <Text style={styles.heroTitle}>Your orders</Text>
              <Text style={styles.heroSubtitle}>
                Track groceries from checkout to your door — fresh, fast, and local.
              </Text>

              <View style={styles.statRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{counts.active}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{counts.delivered}</Text>
                  <Text style={styles.statLabel}>Delivered</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{counts.all}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
            </LinearGradient>

            {UI_PREVIEW_MODE ? (
              <DemoBanner message="Demo orders for UI preview — nothing was placed at a store." />
            ) : null}

            <OrdersFilterChips value={filter} onChange={setFilter} counts={counts} />
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
      <LinearGradient colors={['#FEF9C3', '#FDE68A']} style={styles.emptyIcon}>
        <AppIcon name="basket" color={colors.text} size={30} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>{UI_PREVIEW_MODE ? 'No demo orders yet' : 'Order history unavailable'}</Text>
      <Text style={styles.emptyBody}>
        {UI_PREVIEW_MODE
          ? 'Demo orders will appear here after a simulated checkout, or from seeded preview fixtures.'
          : 'Live order history is not connected yet. No sample orders were invented for this account.'}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Start Shopping"
        onPress={() => router.push('/shop')}
        style={({ pressed }) => [styles.shopButton, pressed && styles.pressed]}
        testID="orders-start-shopping">
        <AppIcon name="bag" color={colors.text} size={18} />
        <Text style={styles.shopLabel}>Start Shopping</Text>
      </Pressable>
    </View>
  );
}

function FilterEmptyState({ filter }: { filter: OrdersFilterId }) {
  const copy =
    filter === 'active'
      ? 'No active orders right now.'
      : filter === 'delivered'
        ? 'No delivered orders in this filter.'
        : 'No orders in this list.';
  return (
    <View style={styles.empty}>
      <View style={styles.filterEmptyIcon}>
        <AppIcon name="box" color={colors.primaryInk} size={26} />
      </View>
      <Text style={styles.emptyTitle}>{copy}</Text>
      <Text style={styles.emptyBody}>Try another filter, or browse Shop for fresh groceries.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Browse Shop"
        onPress={() => router.push('/shop')}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
        <Text style={styles.secondaryLabel}>Browse Shop</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: space.sm,
    paddingHorizontal: homeLayout.gutter,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  listGrow: {
    flexGrow: 1,
  },
  headerBlock: {
    gap: space.md,
    marginBottom: space.md,
  },
  hero: {
    borderRadius: radii.sheet,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FDE68A',
    ...shadow.soft,
  },
  heroGlow: {
    position: 'absolute',
    top: -36,
    right: -28,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  heroBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
  },
  heroSubtitle: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(17, 24, 39, 0.72)',
    maxWidth: 320,
  },
  statRow: {
    marginTop: space.lg,
    flexDirection: 'row',
    gap: space.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  separator: {
    height: 14,
  },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
    gap: 10,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  filterEmptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
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
    minHeight: 50,
    minWidth: 188,
    paddingHorizontal: 22,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...shadow.soft,
  },
  shopLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  secondaryButton: {
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  pressed: {
    opacity: 0.78,
  },
});
