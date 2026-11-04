import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts, radii, shadow } from '@/constants/theme';
import { formatRupee } from '@/utils/cartBill';
import type { DemoCheckoutBill } from '@/utils/demoCheckoutBill';

type PaymentOrderSummaryProps = {
  addressLabel: string;
  addressLine: string | null;
  itemCount: number;
  bill: DemoCheckoutBill;
  expanded: boolean;
  onToggleExpand: () => void;
  onChangeAddress?: () => void;
};

export function PaymentOrderSummary({
  addressLabel,
  addressLine,
  itemCount,
  bill,
  expanded,
  onToggleExpand,
  onChangeAddress,
}: PaymentOrderSummaryProps) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headCopy}>
          <Text style={styles.title}>Order summary</Text>
          <Text style={styles.sub}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatRupee(bill.grandTotal)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Hide bill breakdown' : 'Show bill breakdown'}
          accessibilityState={{ expanded }}
          hitSlop={8}
          onPress={onToggleExpand}
          style={({ pressed }) => [styles.expandChip, pressed && styles.pressed]}>
          <Text style={styles.expandLabel}>{expanded ? 'Hide' : 'Bill'}</Text>
          <AppIcon name={expanded ? 'chevronDown' : 'chevron'} color={colors.primaryInk} size={16} />
        </Pressable>
      </View>

      <View style={styles.addressBlock}>
        <View style={styles.addressIcon}>
          <AppIcon name="stores" color={colors.primaryInk} size={16} />
        </View>
        <View style={styles.addressCopy}>
          <Text style={styles.addressTitle}>{addressLabel}</Text>
          <Text style={styles.addressLine} numberOfLines={expanded ? 4 : 2}>
            {addressLine ?? 'Add a complete delivery address to place this order.'}
          </Text>
        </View>
        {onChangeAddress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change address"
            hitSlop={8}
            onPress={onChangeAddress}
            style={({ pressed }) => [styles.change, pressed && styles.pressed]}>
            <Text style={styles.changeLabel}>Change</Text>
          </Pressable>
        ) : null}
      </View>

      {expanded ? (
        <View style={styles.bill}>
          <BillRow label="Item total" value={formatRupee(bill.itemTotal)} />
          {bill.savings > 0 ? (
            <BillRow label="Product discount" value={`-${formatRupee(bill.savings)}`} emphasize />
          ) : null}
          <BillRow label="Delivery fee" value={formatRupee(bill.deliveryFee)} />
          {bill.handlingFee > 0 ? <BillRow label="Handling fee" value={formatRupee(bill.handlingFee)} /> : null}
          {bill.discount > 0 ? (
            <BillRow label="Coupon discount" value={`-${formatRupee(bill.discount)}`} emphasize />
          ) : null}
          <View style={styles.grand}>
            <Text style={styles.grandLabel}>Payable</Text>
            <Text style={styles.grandValue}>{formatRupee(bill.grandTotal)}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function BillRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.billRow}>
      <Text style={styles.billLabel}>{label}</Text>
      <Text style={[styles.billValue, emphasize && styles.billEmphasize]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: 14,
    gap: 12,
    ...shadow.soft,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  expandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.softYellow,
  },
  expandLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primaryInk,
  },
  addressBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.iconBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  addressTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
  },
  addressLine: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  change: {
    minHeight: 32,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  changeLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  bill: {
    gap: 8,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 24,
  },
  billLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  billValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  billEmphasize: {
    color: colors.success,
  },
  grand: {
    marginTop: 2,
    borderRadius: radii.sm,
    backgroundColor: colors.cream,
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grandLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  grandValue: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
});
