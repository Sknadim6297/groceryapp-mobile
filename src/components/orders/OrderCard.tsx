import { router } from 'expo-router';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts, radii, shadow, space } from '@/constants/theme';
import type { CustomerOrder } from '@/types/order';
import { formatRupee } from '@/utils/cartBill';
import {
  buildOrderTimeline,
  isActiveOrder,
  orderItemCount,
  orderStatusLabel,
  statusDotColor,
} from '@/utils/orderListing';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type OrderCardProps = {
  order: CustomerOrder;
  expanded: boolean;
  onToggle: () => void;
};

export function OrderCard({ order, expanded, onToggle }: OrderCardProps) {
  const items = orderItemCount(order);
  const timeline = buildOrderTimeline(order);
  const statusColor = statusDotColor(order.status);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  }

  function openDetails() {
    router.push({ pathname: '/order/[id]', params: { id: order.id } });
  }

  return (
    <View style={styles.card} testID={`order-card-${order.id}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Order ${order.id}, ${orderStatusLabel[order.status]}`}
        onPress={toggle}
        style={({ pressed }) => [styles.summary, pressed && styles.pressed]}>
        <View style={styles.iconPlate}>
          <AppIcon name="bag" color={colors.text} size={20} />
        </View>

        <View style={styles.summaryCopy}>
          <Text style={styles.orderId} numberOfLines={1}>
            Order ID: {formatOrderId(order.id)}
          </Text>
          <Text style={styles.placed} numberOfLines={1}>
            Placed on {order.placedAtLabel || '—'}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            Items: {items}
            {typeof order.totalAmount === 'number' && Number.isFinite(order.totalAmount)
              ? `  ·  Total: ${formatRupee(order.totalAmount)}`
              : ''}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.statusLabel}>{orderStatusLabel[order.status]}</Text>
          </View>
        </View>

        <View style={[styles.chevronBtn, expanded && styles.chevronOpen]} accessibilityElementsHidden>
          <AppIcon name="chevronDown" color={colors.textSecondary} size={18} />
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.expanded}>
          <View style={styles.divider} />
          <OrderTimeline steps={timeline} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View Order Details"
            onPress={openDetails}
            style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}
            testID={`order-details-${order.id}`}>
            <Text style={styles.detailsLabel}>View Order Details</Text>
            <AppIcon name="chevron" color={colors.primaryInk} size={16} />
          </Pressable>
          {isActiveOrder(order) ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Track Order"
              onPress={() => router.push({ pathname: '/track', params: { id: order.id } })}
              style={({ pressed }) => [styles.trackButton, pressed && styles.pressed]}
              testID={`order-track-${order.id}`}>
              <Text style={styles.trackLabel}>Track Order</Text>
              <AppIcon name="truck" color={colors.text} size={16} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function formatOrderId(id: string): string {
  const trimmed = id.trim();
  if (!trimmed) {
    return '—';
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  iconPlate: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  orderId: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  placed: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  meta: {
    marginTop: 2,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.text,
  },
  statusRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  expanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  detailsButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.cream,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryDark,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.primaryInk,
  },
  trackButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  pressed: {
    opacity: 0.78,
  },
});
