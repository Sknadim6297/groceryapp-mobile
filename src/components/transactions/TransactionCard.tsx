import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PaymentMethodGlyph } from '@/components/transactions/PaymentMethodGlyph';
import { colors, fonts } from '@/constants/theme';
import type { DemoTransaction } from '@/types/transactions';
import { formatTransactionAmount, transactionAmountTone } from '@/data/demoTransactions';

type TransactionCardProps = {
  item: DemoTransaction;
  onPress: () => void;
};

export function TransactionCard({ item, onPress }: TransactionCardProps) {
  const tone = transactionAmountTone(item);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${formatTransactionAmount(item)}, ${item.placedAtLabel}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      testID={`transaction-card-${item.id}`}>
      <PaymentMethodGlyph method={item.method} />
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.when} numberOfLines={1}>
          {item.placedAtLabel}
        </Text>
        {item.status !== 'success' ? (
          <Text style={[styles.status, item.status === 'failed' || item.status === 'reversed' ? styles.statusFailed : styles.statusMuted]}>
            {statusLabel(item)}
          </Text>
        ) : null}
      </View>
      <Text
        style={[
          styles.amount,
          tone === 'credit' && styles.amountCredit,
          tone === 'failed' && styles.amountFailed,
        ]}>
        {formatTransactionAmount(item)}
      </Text>
    </Pressable>
  );
}

function statusLabel(item: DemoTransaction): string {
  switch (item.status) {
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
    case 'reversed':
      return 'Reversed';
    default:
      return item.kind === 'refund' ? 'Refund' : 'Paid';
  }
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  copy: {
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
  when: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  status: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  statusMuted: {
    color: colors.primaryInk,
  },
  statusFailed: {
    color: colors.danger,
  },
  amount: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  amountCredit: {
    color: colors.success,
  },
  amountFailed: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.86,
  },
});
