import { router } from 'expo-router';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts, radii, shadow, space } from '@/constants/theme';
import { findDemoProduct } from '@/data/findDemoProduct';
import type { CustomerOrder } from '@/types/order';
import { formatRupee } from '@/utils/cartBill';
import {
  buildOrderTimeline,
  isActiveOrder,
  orderItemCount,
  orderStatusIcon,
  orderStatusLabel,
  statusPillColors,
} from '@/utils/orderListing';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PREVIEW_THUMBS = 3;

type OrderCardProps = {
  order: CustomerOrder;
  expanded: boolean;
  onToggle: () => void;
};

export function OrderCard({ order, expanded, onToggle }: OrderCardProps) {
  const items = orderItemCount(order);
  const timeline = buildOrderTimeline(order);
  const pill = statusPillColors(order.status);
  const statusIcon = orderStatusIcon(order.status);
  const active = isActiveOrder(order);
  const previewItems = order.items.slice(0, PREVIEW_THUMBS);
  const extraItems = Math.max(0, order.items.length - PREVIEW_THUMBS);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  }

  function openDetails() {
    router.push({ pathname: '/order/[id]', params: { id: order.id } });
  }

  return (
    <View style={[styles.card, active && styles.cardActive]} testID={`order-card-${order.id}`}>
      <View style={[styles.accent, { backgroundColor: pill.border }]} />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Order ${order.id}, ${orderStatusLabel[order.status]}`}
        onPress={toggle}
        style={({ pressed }) => [styles.summary, pressed && styles.pressed]}>
        <View style={styles.topRow}>
          <View style={[styles.iconPlate, { backgroundColor: pill.background }]}>
            <AppIcon name={statusIcon} color={pill.text} size={20} />
          </View>

          <View style={styles.summaryCopy}>
            <View style={styles.idRow}>
              <Text style={styles.orderId} numberOfLines={1}>
                {formatOrderId(order.id)}
              </Text>
              <View style={[styles.statusPill, { backgroundColor: pill.background, borderColor: pill.border }]}>
                <Text style={[styles.statusLabel, { color: pill.text }]} numberOfLines={1}>
                  {orderStatusLabel[order.status]}
                </Text>
              </View>
            </View>

            <Text style={styles.placed} numberOfLines={1}>
              Placed {order.placedAtLabel || '—'}
            </Text>

            {order.statusDetail && active ? (
              <Text style={styles.detailLine} numberOfLines={1}>
                {order.statusDetail}
              </Text>
            ) : null}
          </View>

          <View style={[styles.chevronBtn, expanded && styles.chevronOpen]} accessibilityElementsHidden>
            <AppIcon name="chevronDown" color={colors.textSecondary} size={16} />
          </View>
        </View>

        <View style={styles.previewRow}>
          <View style={styles.thumbs}>
            {previewItems.length === 0 ? (
              <View style={styles.thumbEmpty}>
                <AppIcon name="bag" color={colors.primaryInk} size={16} />
              </View>
            ) : (
              previewItems.map((item, index) => {
                const product = findDemoProduct(item.id);
                return (
                  <View
                    key={`${item.id}-${index}`}
                    style={[styles.thumb, index > 0 ? styles.thumbOverlap : null]}>
                    {product ? (
                      <CatalogImage source={product.image} style={styles.thumbImage} contentFit="cover" />
                    ) : (
                      <Text style={styles.thumbFallback}>{item.name.slice(0, 1).toUpperCase()}</Text>
                    )}
                  </View>
                );
              })
            )}
            {extraItems > 0 ? (
              <View style={[styles.thumb, styles.thumbMore, styles.thumbOverlap]}>
                <Text style={styles.thumbMoreLabel}>+{extraItems}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.totals}>
            <Text style={styles.itemsLabel}>
              {items} {items === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.totalAmount}>
              {typeof order.totalAmount === 'number' && Number.isFinite(order.totalAmount)
                ? formatRupee(order.totalAmount)
                : '—'}
            </Text>
          </View>
        </View>

        {active && order.eta ? (
          <View style={styles.etaBanner}>
            <AppIcon name="clock" color={colors.primaryInk} size={14} />
            <Text style={styles.etaText} numberOfLines={1}>
              Arriving in {order.eta.value} {order.eta.unit}
            </Text>
          </View>
        ) : null}
      </Pressable>

      {expanded ? (
        <View style={styles.expanded}>
          <View style={styles.divider} />
          <Text style={styles.progressTitle}>Delivery progress</Text>
          <OrderTimeline steps={timeline} />
          <View style={styles.actions}>
            {active ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Track Order"
                onPress={() => router.push({ pathname: '/track', params: { id: order.id } })}
                style={({ pressed }) => [styles.trackButton, pressed && styles.pressed]}
                testID={`order-track-${order.id}`}>
                <AppIcon name="truck" color={colors.text} size={16} />
                <Text style={styles.trackLabel}>Track Order</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View Order Details"
              onPress={openDetails}
              style={({ pressed }) => [
                active ? styles.detailsButton : styles.trackButton,
                pressed && styles.pressed,
              ]}
              testID={`order-details-${order.id}`}>
              <Text style={active ? styles.detailsLabel : styles.trackLabel}>View Details</Text>
              <AppIcon name="chevron" color={active ? colors.primaryInk : colors.text} size={16} />
            </Pressable>
          </View>
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
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadow.card,
  },
  cardActive: {
    borderColor: '#FDE68A',
  },
  accent: {
    height: 4,
    width: '100%',
  },
  summary: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: space.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  iconPlate: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  orderId: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
  },
  placed: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  detailLine: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
  },
  chevronBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  thumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.softYellow,
    borderWidth: 2,
    borderColor: colors.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbOverlap: {
    marginLeft: -10,
  },
  thumbImage: {
    width: 40,
    height: 40,
  },
  thumbFallback: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  thumbEmpty: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbMore: {
    backgroundColor: colors.ink,
    borderColor: colors.white,
  },
  thumbMoreLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
  },
  totals: {
    alignItems: 'flex-end',
    gap: 2,
  },
  itemsLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    backgroundColor: colors.warmBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FDE68A',
  },
  etaText: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
  },
  expanded: {
    paddingHorizontal: space.md,
    paddingBottom: space.md,
    gap: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  progressTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.text,
  },
  actions: {
    gap: 8,
  },
  detailsButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: colors.cream,
    borderWidth: 1,
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
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  pressed: {
    opacity: 0.78,
  },
});
