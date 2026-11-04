import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountActionRow } from '@/components/account/AccountActionRow';
import { AccountScreenShell } from '@/components/account/AccountScreenShell';
import { AccountSectionCard } from '@/components/account/AccountSectionCard';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, radii, shadow, space } from '@/constants/theme';
import { accountRoutes } from '@/navigation/accountRoutes';
import { profileRoutes } from '@/navigation/profileRoutes';

/**
 * Wallet dashboard — no live balance or top-up API exists.
 * Preview shows a clearly labeled unavailable wallet shell; live shows a placeholder.
 */
export default function WalletScreen() {
  if (!UI_PREVIEW_MODE) {
    return (
      <PlaceholderScreen
        title="My Wallet"
        message="MayapurBazaar Wallet is not connected yet. Balance, top-ups, and wallet checkout are unavailable."
        withHeader
      />
    );
  }

  return (
    <AccountScreenShell title="My Wallet" fallbackHref={profileRoutes.profile}>
      <DemoBanner message="Demo preview — wallet balance and top-up are not live. No money moves here." />

      <View style={styles.balanceCard}>
        <View style={styles.balanceTop}>
          <Text style={styles.balanceEyebrow}>Available balance</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillLabel}>Not connected</Text>
          </View>
        </View>
        <Text style={styles.balanceAmount}>₹ —</Text>
        <Text style={styles.balanceMeta}>INR · Wallet API not published</Text>
        <Text style={styles.balanceNote}>
          A real balance will appear here only after a wallet service is connected. This screen never invents funds.
        </Text>
      </View>

      <View style={styles.quickRow}>
        <QuickAction
          icon="plus"
          label="Add Money"
          disabled
          onPress={() => undefined}
          hint="Unavailable"
        />
        <QuickAction
          icon="history"
          label="Transactions"
          onPress={() => router.push(accountRoutes.transactions)}
        />
        <QuickAction
          icon="headset"
          label="Help"
          onPress={() => router.push(accountRoutes.help)}
        />
      </View>

      <AccountSectionCard title="Recent activity">
        <View style={styles.emptyTxn}>
          <View style={styles.emptyIcon}>
            <AppIcon name="wallet" color={colors.primaryInk} size={28} />
          </View>
          <Text style={styles.emptyTitle}>No wallet transactions</Text>
          <Text style={styles.emptyBody}>
            Wallet credits and debits will list here when a ledger API is available. Demo order payments live under
            Transactions, not Wallet.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open transactions"
            onPress={() => router.push(accountRoutes.transactions)}
            style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}>
            <Text style={styles.linkBtnLabel}>View Transactions</Text>
          </Pressable>
        </View>
      </AccountSectionCard>

      <AccountSectionCard title="Wallet information">
        <Text style={styles.infoBody}>
          Wallet checkout is disabled until MayapurBazaar publishes a wallet API. Top-up and pay-from-wallet actions
          stay blocked so no fake success can appear.
        </Text>
        <AccountActionRow
          icon="help"
          title="Help with payments"
          subtitle="FAQs and live chat preview"
          onPress={() => router.push(accountRoutes.help)}
        />
      </AccountSectionCard>
    </AccountScreenShell>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  disabled = false,
  hint,
}: {
  icon: 'plus' | 'history' | 'headset';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quick,
        disabled && styles.quickDisabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <View style={styles.quickIcon}>
        <AppIcon name={icon} color={colors.primaryInk} size={18} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      {hint ? <Text style={styles.quickHint}>{hint}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: space.lg,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  balanceEyebrow: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: colors.softYellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryInk,
  },
  balanceAmount: {
    fontFamily: fonts.bold,
    fontSize: 36,
    lineHeight: 42,
    color: colors.text,
    letterSpacing: -0.5,
  },
  balanceMeta: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  balanceNote: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quick: {
    flex: 1,
    minHeight: 88,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 6,
    ...shadow.soft,
  },
  quickDisabled: {
    opacity: 0.5,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  quickHint: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textSecondary,
  },
  emptyTxn: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  linkBtn: {
    marginTop: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkBtnLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },
  infoBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.8,
  },
});
