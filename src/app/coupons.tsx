import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { PreviewScaffold } from '@/components/preview/PreviewScaffold';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { previewCoupons } from '@/data/previewCoupons';
import { formatRupee } from '@/utils/cartBill';

export default function CouponsScreen() {
  const { couponId, setCouponId } = usePreviewSession();

  if (!UI_PREVIEW_MODE) {
    return (
      <PlaceholderScreen title="Coupons" message="Coupons are not connected yet." withHeader />
    );
  }

  return (
    <PreviewScaffold title="Coupons" subtitle="Simulated offers. Nothing is redeemed.">
      {previewCoupons.map((coupon) => {
        const selected = couponId === coupon.id;
        return (
          <Pressable
            key={coupon.id}
            accessibilityRole="button"
            accessibilityLabel={selected ? `Remove ${coupon.title}` : `Apply ${coupon.title}`}
            onPress={() => {
              setCouponId(selected ? null : coupon.id);
              router.back();
            }}
            style={[styles.card, selected && styles.selected]}>
            <Text style={styles.title}>{coupon.title}</Text>
            <Text style={styles.detail}>{coupon.detail}</Text>
            <Text style={styles.meta}>
              {formatRupee(coupon.amount)} off preview carts of {formatRupee(coupon.minimum)} or more
            </Text>
          </Pressable>
        );
      })}
      {couponId ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Remove preview coupon" onPress={() => setCouponId(null)}>
          <Text style={styles.remove}>Remove preview coupon</Text>
        </Pressable>
      ) : null}
    </PreviewScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  detail: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryInk,
  },
  remove: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
  },
});
