import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COUPON_ILLUSTRATIONS, COUPON_TONE_COLORS } from '@/components/coupons/couponArt';
import { colors, fonts } from '@/constants/theme';
import { formatDiscountBadge } from '@/data/demoCoupons';
import type { DemoCoupon } from '@/types/coupons';

const LEFT_WIDTH = 92;
const NOTCH = 9;
const EDGE_NOTCH = 12;

type CouponTicketCardProps = {
  coupon: DemoCoupon;
  collected: boolean;
  expired: boolean;
  applied?: boolean;
  onPress: () => void;
  onCollect: () => void;
};

export function CouponTicketCard({
  coupon,
  collected,
  expired,
  applied = false,
  onPress,
  onCollect,
}: CouponTicketCardProps) {
  const tone = COUPON_TONE_COLORS[coupon.tone];
  const art = COUPON_ILLUSTRATIONS[coupon.illustration];
  const collectDisabled = expired || collected;
  const collectLabel = expired ? 'Expired' : collected ? 'Collected' : 'Collect';

  return (
    <View style={[styles.ticket, expired && styles.ticketExpired]} testID={`coupon-card-${coupon.id}`}>
      <LinearGradient
        colors={[tone.start, tone.end]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${coupon.title}, ${formatDiscountBadge(coupon).replace('\n', ' ')}. Open details.`}
          onPress={onPress}
          style={({ pressed }) => [styles.bodyPress, pressed && styles.pressed]}>
          <View style={styles.left}>
            <Text style={styles.discount}>{formatDiscountBadge(coupon)}</Text>
          </View>

          <View style={styles.perforationColumn} pointerEvents="none">
            <View style={[styles.notch, styles.notchTop]} />
            <View style={styles.dashTrack}>
              {Array.from({ length: 9 }).map((_, index) => (
                <View key={index} style={styles.dash} />
              ))}
            </View>
            <View style={[styles.notch, styles.notchBottom]} />
          </View>

          <View style={styles.right}>
            <View style={styles.copy}>
              <Text style={styles.title} numberOfLines={1}>
                {coupon.title}
              </Text>
              <Text style={styles.detail} numberOfLines={2}>
                {coupon.detail}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {coupon.expiresAtLabel}
              </Text>
              {applied ? <Text style={styles.applied}>Applied in preview</Text> : null}
            </View>
            <Image source={art} style={styles.art} contentFit="contain" pointerEvents="none" />
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={collectLabel}
          accessibilityState={{ disabled: collectDisabled }}
          disabled={collectDisabled}
          hitSlop={6}
          onPress={onCollect}
          style={({ pressed }) => [
            styles.collect,
            collectDisabled && styles.collectDisabled,
            pressed && !collectDisabled && styles.collectPressed,
          ]}
          testID={`coupon-collect-${coupon.id}`}>
          <Text style={[styles.collectLabel, collectDisabled && styles.collectLabelDisabled]}>{collectLabel}</Text>
        </Pressable>

        <View style={styles.edgeNotch} pointerEvents="none" />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
  },
  ticket: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  ticketExpired: {
    opacity: 0.55,
  },
  gradient: {
    minHeight: 118,
    position: 'relative',
  },
  bodyPress: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 118,
    paddingRight: 88,
  },
  left: {
    width: LEFT_WIDTH,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discount: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
  },
  perforationColumn: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: -7,
    zIndex: 2,
  },
  notch: {
    width: NOTCH * 2,
    height: NOTCH,
    backgroundColor: colors.softBackground,
  },
  notchTop: {
    borderBottomLeftRadius: NOTCH,
    borderBottomRightRadius: NOTCH,
  },
  notchBottom: {
    borderTopLeftRadius: NOTCH,
    borderTopRightRadius: NOTCH,
  },
  dashTrack: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dash: {
    width: 2,
    height: 5,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  right: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 10,
    paddingLeft: 4,
    minWidth: 0,
  },
  copy: {
    minWidth: 0,
    gap: 2,
    paddingRight: 8,
    maxWidth: '100%',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  detail: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.primaryInk,
    marginTop: 2,
  },
  applied: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.success,
    marginTop: 2,
  },
  collect: {
    position: 'absolute',
    top: 12,
    right: 14,
    zIndex: 3,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(23,23,23,0.12)',
  },
  collectDisabled: {
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  collectPressed: {
    opacity: 0.85,
  },
  collectLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },
  collectLabelDisabled: {
    color: colors.textSecondary,
  },
  art: {
    position: 'absolute',
    right: -4,
    bottom: 4,
    width: 72,
    height: 64,
    opacity: 0.95,
  },
  edgeNotch: {
    position: 'absolute',
    right: -EDGE_NOTCH,
    top: '50%',
    marginTop: -EDGE_NOTCH,
    width: EDGE_NOTCH * 2,
    height: EDGE_NOTCH * 2,
    borderRadius: EDGE_NOTCH,
    backgroundColor: colors.softBackground,
  },
});
