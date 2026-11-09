import * as Clipboard from 'expo-clipboard';
import { Share, StyleSheet, Text, View, Pressable } from 'react-native';

import { AccountScreenShell } from '@/components/account/AccountScreenShell';
import { AccountSectionCard } from '@/components/account/AccountSectionCard';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppIcon } from '@/components/ui/AppIcon';
import { useToast } from '@/components/ui/AppToast';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCustomerAccount } from '@/context/CustomerAccountContext';
import { useRememberedCustomer } from '@/context/RememberedCustomerContext';
import { profileRoutes } from '@/navigation/profileRoutes';
import { displayCustomer } from '@/services/rememberedCustomer';
import { buildDemoInviteMessage, buildDemoReferralCode } from '@/utils/referralCode';

const STEPS = [
  { title: 'Share your code', body: 'Send your invite code with the share sheet or copy it.' },
  { title: 'Friend signs up', body: 'They use the code when registration supports referrals.' },
  { title: 'Rewards later', body: 'Cashback only appears when a live referral program exists.' },
] as const;

export default function InviteFriendsScreen() {
  const { showToast } = useToast();
  const { session, devSession } = useAuthSession();
  const { account } = useCustomerAccount();
  const { customer: remembered } = useRememberedCustomer();

  if (!UI_PREVIEW_MODE) {
    return (
      <PlaceholderScreen
        title="Invite Friends"
        message="Referral invites are not connected yet. A live referral code and rewards API is required."
        withHeader
      />
    );
  }

  const identity = displayCustomer(
    session ?? (devSession ? { mobile: devSession.mobile } : null),
    account,
    remembered,
  );
  const seed =
    identity?.customerId?.trim() ||
    identity?.mobile ||
    session?.customerId?.trim() ||
    session?.mobile ||
    devSession?.mobile ||
    account?.mobile ||
    '';
  const code = buildDemoReferralCode(seed);

  async function copyCode() {
    if (!code) {
      showToast('info', 'No referral code is available for this account yet.');
      return;
    }
    await Clipboard.setStringAsync(code);
    showToast('success', 'Demo referral code copied.');
  }

  async function shareInvite() {
    if (!code) {
      showToast('info', 'No referral code is available to share yet.');
      return;
    }
    try {
      await Share.share({ message: buildDemoInviteMessage(code) });
    } catch {
      showToast('error', 'Could not open the share sheet.');
    }
  }

  return (
    <AccountScreenShell title="Invite Friends" fallbackHref={profileRoutes.profile}>
      <DemoBanner message="Demo invites only — no cashback or referral rewards are issued." />

      <View style={styles.hero}>
        <View style={styles.heroArt}>
          <AppIcon name="users" color={colors.primaryInk} size={36} />
        </View>
        <Text style={styles.heroTitle}>Good things are better shared</Text>
        <Text style={styles.heroBody}>
          Invite friends to MayapurBazaar. This preview builds a local demo code from your account — it is not a live
          referral program.
        </Text>
      </View>

      <AccountSectionCard>
        {code ? (
          <>
            <Text style={styles.codeLabel}>Your demo referral code</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeValue} selectable>
                {code}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copy referral code"
                onPress={() => void copyCode()}
                style={({ pressed }) => [styles.copyBtn, pressed && styles.pressed]}
                testID="invite-copy">
                <AppIcon name="copy" color={colors.text} size={16} />
                <Text style={styles.copyLabel}>Copy</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Text style={styles.missingCode}>
            Sign in with a verified mobile number to generate a demo referral code on this device.
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share invite"
          accessibilityState={{ disabled: !code }}
          disabled={!code}
          onPress={() => void shareInvite()}
          style={({ pressed }) => [
            styles.shareBtn,
            !code && styles.shareDisabled,
            pressed && code && styles.pressed,
          ]}
          testID="invite-share">
          <AppIcon name="users" color={colors.text} size={18} />
          <Text style={styles.shareLabel}>Share Invite</Text>
        </Pressable>
      </AccountSectionCard>

      <AccountSectionCard title="How it works">
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeLabel}>{index + 1}</Text>
            </View>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          </View>
        ))}
      </AccountSectionCard>

      <AccountSectionCard title="Rewards">
        <Text style={styles.rewardBody}>
          No referral reward program is published. This screen will not invent cashback, credits, or successful invite
          payouts.
        </Text>
      </AccountSectionCard>
    </AccountScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  heroArt: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    textAlign: 'center',
  },
  heroBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  codeLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.warmBackground,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  codeValue: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: 1,
    color: colors.text,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  copyLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },
  missingCode: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  shareBtn: {
    minHeight: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareDisabled: {
    opacity: 0.45,
  },
  shareLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },
  stepCopy: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  stepBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  rewardBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.8,
  },
});
