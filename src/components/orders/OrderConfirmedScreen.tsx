import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCustomerProfile } from '@/context/CustomerProfileContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { formatRupee } from '@/utils/cartBill';
import { orderItemCount } from '@/utils/orderListing';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type InfoRowProps = {
  icon: AppIconName;
  label: string;
  value: string;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <AppIcon name={icon} color={colors.text} size={18} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function OrderConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);

  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = firstParam(id)?.trim();
  const { findOrder } = usePreviewSession();
  const { profile } = useCustomerProfile();
  const { session } = useAuthSession();

  const order = orderId ? findOrder(orderId) : null;
  const customerName =
    profile?.name?.trim() || session?.name?.trim() || 'there';

  if (!UI_PREVIEW_MODE) {
    return <PlaceholderScreen title="Order" message="Order confirmation is not connected yet." withHeader />;
  }

  const itemCount = order ? orderItemCount(order) : 0;
  const canTrack = Boolean(order?.id);

  function goHome() {
    try {
      if (typeof router.canDismiss === 'function' && router.canDismiss()) {
        router.dismissAll();
      }
    } catch {
      // Fall through to replace — never leave the user on a broken stack.
    }
    router.replace('/home');
  }

  function trackOrder() {
    if (!order?.id) {
      return;
    }
    router.replace({ pathname: '/track', params: { id: order.id } });
  }

  function viewOrderDetails() {
    if (!order?.id) {
      return;
    }
    router.push({ pathname: '/order/[id]', params: { id: order.id } });
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FEF3C7', '#FFF9EC', colors.warmBackground]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            width: contentWidth,
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <DemoBanner message="Demo confirmation — this order was not sent to a store." />

        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.badgeOuter}>
            <View style={styles.badgeInner}>
              <AppIcon name="box" color={colors.primaryInk} size={36} />
            </View>
            <View style={styles.checkBadge}>
              <AppIcon name="check" color={colors.white} size={16} />
            </View>
          </View>

          <Text style={styles.title}>Congratulations!</Text>
          <Text style={styles.subtitle}>
            {order
              ? `Hi ${customerName} — thanks for your order. We hope you enjoyed shopping with Mayapur Bazaar.`
              : `Hi ${customerName} — we could not find that demo order. Place an order from checkout to see confirmation details.`}
          </Text>
        </View>

        <View style={styles.card}>
          {order ? (
            <>
              <InfoRow icon="tag" label="Order ID" value={`#${order.id}`} />
              <View style={styles.divider} />
              <InfoRow
                icon="box"
                label="Order items"
                value={`${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${formatRupee(order.total)}`}
              />
              <View style={styles.divider} />
              <InfoRow
                icon="phone"
                label="Confirmation will be sent to your App, SMS"
                value="Check your App or Phone SMS"
              />
              {order.paymentLabel ? (
                <>
                  <View style={styles.divider} />
                  <InfoRow icon="card" label="Payment" value={order.paymentLabel} />
                </>
              ) : null}
              {order.addressLine ? (
                <>
                  <View style={styles.divider} />
                  <InfoRow icon="stores" label="Delivering to" value={order.addressLine} />
                </>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View order details"
                onPress={viewOrderDetails}
                style={({ pressed }) => [styles.detailsLink, pressed && styles.pressed]}>
                <Text style={styles.detailsLinkLabel}>View order details</Text>
                <AppIcon name="chevron" color={colors.primaryInk} size={16} />
              </Pressable>
            </>
          ) : (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyTitle}>No order to show</Text>
              <Text style={styles.emptyBody}>
                {orderId
                  ? `Demo order ${orderId} is not in this session. It may have been cleared after restart.`
                  : 'Open this screen after placing a demo order from Payment.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/shop')}
                style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}>
                <Text style={styles.emptyActionLabel}>Continue shopping</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          onPress={goHome}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
          <Text style={styles.secondaryLabel}>Back to Home</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Track Order"
          disabled={!canTrack}
          onPress={trackOrder}
          style={({ pressed }) => [styles.primaryBtn, !canTrack && styles.disabled, pressed && canTrack && styles.pressed]}>
          <Text style={styles.primaryLabel}>Track Order</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    paddingHorizontal: homeLayout.gutter,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
  heroGlow: {
    position: 'absolute',
    top: 8,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
  },
  badgeOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  checkBadge: {
    position: 'absolute',
    right: 6,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
    maxWidth: 360,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...shadow.soft,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softBackground,
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  infoLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  infoValue: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 54,
  },
  detailsLink: {
    marginTop: 4,
    marginBottom: 8,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  detailsLinkLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  emptyBlock: {
    paddingVertical: 18,
    gap: 8,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActionLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 10,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...shadow.soft,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  secondaryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  primaryBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  primaryLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.82,
  },
});
