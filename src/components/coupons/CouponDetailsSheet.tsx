import * as Clipboard from 'expo-clipboard';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { formatDiscountBadge, formatDiscountSummary } from '@/data/demoCoupons';
import type { DemoCoupon } from '@/types/coupons';
import { formatRupee } from '@/utils/cartBill';

type CouponDetailsSheetProps = {
  coupon: DemoCoupon | null;
  collected: boolean;
  expired: boolean;
  applied: boolean;
  onClose: () => void;
  onCollect: () => void;
  onApply: () => void;
  onCopied: () => void;
};

export function CouponDetailsSheet({
  coupon,
  collected,
  expired,
  applied,
  onClose,
  onCollect,
  onApply,
  onCopied,
}: CouponDetailsSheetProps) {
  const insets = useSafeAreaInsets();

  async function handleCopy() {
    if (!coupon) {
      return;
    }
    await Clipboard.setStringAsync(coupon.code);
    onCopied();
  }

  return (
    <Modal visible={coupon !== null} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss coupon details" onPress={onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} testID="coupon-details-sheet">
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>Coupon details</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={10}
              style={styles.closeIcon}
              testID="coupon-details-close">
              <AppIcon name="close" color={colors.text} size={20} />
            </Pressable>
          </View>

          {coupon ? (
            <>
              <Text style={styles.demoPill}>Demo / Preview — not a live offer</Text>
              <Text style={styles.couponTitle}>{coupon.title}</Text>
              <Text style={styles.badge}>{formatDiscountBadge(coupon).replace('\n', ' ')}</Text>

              <DetailRow label="Code" value={coupon.code} />
              <DetailRow label="Discount" value={formatDiscountSummary(coupon)} />
              <DetailRow label="Minimum order" value={formatRupee(coupon.minimum)} />
              {coupon.maxDiscount != null ? (
                <DetailRow label="Maximum discount" value={formatRupee(coupon.maxDiscount)} />
              ) : null}
              <DetailRow label="Expiry" value={coupon.expiresAtLabel} />
              <DetailRow label="Status" value={expired ? 'Expired' : collected ? 'Collected' : 'Available'} />

              <Text style={styles.termsHeading}>Terms</Text>
              <Text style={styles.terms}>{coupon.terms}</Text>

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Copy code"
                  onPress={() => {
                    void handleCopy();
                  }}
                  style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                  testID="coupon-copy-code">
                  <Text style={styles.secondaryLabel}>Copy Code</Text>
                </Pressable>

                {!expired && !collected ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Collect coupon"
                    onPress={onCollect}
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                    testID="coupon-details-collect">
                    <Text style={styles.primaryLabel}>Collect</Text>
                  </Pressable>
                ) : null}

                {!expired && collected ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={applied ? 'Remove from preview checkout' : 'Apply to preview checkout'}
                    onPress={onApply}
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                    testID="coupon-details-apply">
                    <Text style={styles.primaryLabel}>{applied ? 'Remove from preview' : 'Apply to preview'}</Text>
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
                <Text style={styles.closeLabel}>Close</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    maxHeight: '88%',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
  },
  closeIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoPill: {
    alignSelf: 'flex-start',
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.primaryInk,
    backgroundColor: colors.softYellow,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  couponTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
    marginBottom: 4,
  },
  badge: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.primaryInk,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  termsHeading: {
    marginTop: 14,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  terms: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  primaryBtn: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  secondaryBtn: {
    flexGrow: 1,
    minWidth: 120,
    backgroundColor: colors.softBackground,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  secondaryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  closeBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
});
