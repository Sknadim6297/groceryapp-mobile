import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemoBanner } from '@/components/preview/DemoBanner';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';
import {
  DEMO_TRANSACTIONS,
  filterDemoTransactions,
  formatTransactionAmount,
} from '@/data/demoTransactions';
import type { DemoTransaction, TransactionsFilterId } from '@/types/transactions';

const FILTERS: { id: TransactionsFilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'payments', label: 'Payments' },
  { id: 'refunds', label: 'Refunds' },
];

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<TransactionsFilterId>('all');
  const [selected, setSelected] = useState<DemoTransaction | null>(null);

  const visible = useMemo(
    () => (UI_PREVIEW_MODE ? filterDemoTransactions(DEMO_TRANSACTIONS, filter) : []),
    [filter],
  );

  if (!UI_PREVIEW_MODE) {
    return (
      <PlaceholderScreen
        title="Transactions"
        message="Transactions are not connected yet."
        withHeader
      />
    );
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Transactions" fallbackHref="/profile" />
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) },
          visible.length === 0 ? styles.grow : null,
        ]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <DemoBanner message="Demo ledger only — no banks, wallets, or live refunds are involved." />
            <View style={styles.filters}>
              {FILTERS.map((entry) => {
                const active = entry.id === filter;
                return (
                  <Pressable
                    key={entry.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setFilter(entry.id)}
                    style={[styles.chip, active && styles.chipOn]}
                    testID={`transactions-filter-${entry.id}`}>
                    <Text style={[styles.chipLabel, active && styles.chipLabelOn]}>{entry.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyBody}>
              {filter === 'refunds'
                ? 'No demo refunds in this filter.'
                : filter === 'payments'
                  ? 'No demo payments in this filter.'
                  : 'Demo payments and refunds will appear here.'}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        renderItem={({ item }) => (
          <TransactionCard item={item} onPress={() => setSelected(item)} />
        )}
        showsVerticalScrollIndicator={false}
        testID="transactions-list"
      />

      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
            onPress={(event) => event.stopPropagation()}>
            {selected ? (
              <>
                <Text style={styles.sheetTitle}>Transaction details</Text>
                <Text style={styles.demoPill}>Demo record</Text>
                <DetailRow label="Transaction ID" value={selected.id} />
                {selected.orderId ? <DetailRow label="Demo Order ID" value={selected.orderId} /> : null}
                <DetailRow label="Payment method" value={selected.title} />
                <DetailRow label="Amount" value={formatTransactionAmount(selected)} />
                <DetailRow label="Date / time" value={selected.placedAtLabel} />
                <DetailRow label="Status" value={selected.status} />
                <DetailRow label="Type" value={selected.kind} />
                <Text style={styles.note}>{selected.note}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={() => setSelected(null)}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
                  testID="transaction-detail-close">
                  <Text style={styles.closeLabel}>Close</Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.softBackground,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 12,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  grow: {
    flexGrow: 1,
  },
  headerBlock: {
    gap: 12,
    marginBottom: 14,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipLabelOn: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  gap: {
    height: 10,
  },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
  demoPill: {
    alignSelf: 'flex-start',
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryInk,
    backgroundColor: colors.softYellow,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  detailRow: {
    gap: 2,
  },
  detailLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  note: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  closeButton: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  pressed: {
    opacity: 0.82,
  },
});
