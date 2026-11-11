import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { AccountActionRow } from '@/components/account/AccountActionRow';
import { AccountScreenShell } from '@/components/account/AccountScreenShell';
import { AccountSectionCard } from '@/components/account/AccountSectionCard';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { useToast } from '@/components/ui/AppToast';
import { colors, fonts, radii, space } from '@/constants/theme';
import { useAuthFlow } from '@/context/AuthFlowContext';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCustomerAccount } from '@/context/CustomerAccountContext';
import { useCustomerProfile } from '@/context/CustomerProfileContext';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useProfileDraft } from '@/context/ProfileDraftContext';
import { useRememberedCustomer } from '@/context/RememberedCustomerContext';
import { useSavedAddresses } from '@/context/SavedAddressesContext';
import { accountRoutes } from '@/navigation/accountRoutes';
import { profileRoutes } from '@/navigation/profileRoutes';
import { clearDevTestSession } from '@/services/devOtp';
import {
  activateDeviceAppSettingsStore,
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  saveAppSettings,
  type AppSettingsPrefs,
} from '@/services/appSettingsStore';
import { clearPreviewAccountState } from '@/utils/clearPreviewAccountState';
import { clearSignedInSession } from '@/utils/customerSession';

function appVersion(): string {
  const version = Constants.expoConfig?.version;
  return typeof version === 'string' && version.trim().length > 0 ? version.trim() : '1.0.0';
}

export default function SettingsScreen() {
  const { showToast } = useToast();
  const { clearAuthSession } = useAuthSession();
  const { clearAccount } = useCustomerAccount();
  const { clearRememberedCustomer } = useRememberedCustomer();
  const { setNationalNumber } = useAuthFlow();
  const { clearDraft } = useProfileDraft();
  const { clearDelivery } = useDeliveryLocation();
  const { clearActiveBook } = useSavedAddresses();
  const { clearActiveProfile } = useCustomerProfile();

  const [hydrated, setHydrated] = useState(false);
  const [prefs, setPrefs] = useState<AppSettingsPrefs>(DEFAULT_APP_SETTINGS);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (Platform.OS !== 'web') {
        await activateDeviceAppSettingsStore();
      }
      const loaded = await loadAppSettings();
      if (!cancelled) {
        setPrefs(loaded);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: AppSettingsPrefs) => {
    setPrefs(next);
    const ok = await saveAppSettings(next);
    if (!ok) {
      showToast('error', 'Could not save settings on this device.');
    }
  }, [showToast]);

  function confirmLogout() {
    clearSignedInSession({
      clearAuthSession,
      clearAccount,
      clearRememberedCustomer,
      setNationalNumber,
      clearDraft,
      clearDelivery,
      clearDevTestSession,
      clearSavedAddresses: clearActiveBook,
      clearCustomerProfile: clearActiveProfile,
      clearPreviewAccountState: () => {
        void clearPreviewAccountState();
      },
    });
    setLogoutOpen(false);
    router.replace(profileRoutes.login);
  }

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  return (
    <AccountScreenShell title="Settings" fallbackHref={profileRoutes.profile}>
      <DemoBanner message="Preferences save on this device only. They do not send push alerts or sync to a server." />

      <Text style={styles.sectionLabel}>Account</Text>
      <AccountSectionCard>
        <AccountActionRow
          icon="profile"
          title="Personal Information"
          subtitle="Name, email, and date of birth"
          onPress={() => router.push(profileRoutes.account)}
        />
        <View style={styles.divider} />
        <AccountActionRow
          icon="stores"
          title="Saved Addresses"
          subtitle="Delivery locations"
          onPress={() => router.push(profileRoutes.addresses)}
        />
        <View style={styles.divider} />
        <AccountActionRow
          icon="card"
          title="Payment Methods"
          subtitle="Saved payment preferences"
          onPress={() => router.push(profileRoutes.myPayment)}
        />
      </AccountSectionCard>

      <Text style={styles.sectionLabel}>Preferences</Text>
      <AccountSectionCard>
        <PrefSwitch
          title="Order alerts"
          subtitle="Preference only — no push delivery yet"
          value={prefs.orderAlerts}
          onChange={(orderAlerts) => void persist({ ...prefs, orderAlerts })}
        />
        <View style={styles.divider} />
        <PrefSwitch
          title="Offer notifications"
          subtitle="Preference only — no offer pushes yet"
          value={prefs.offerAlerts}
          onChange={(offerAlerts) => void persist({ ...prefs, offerAlerts })}
        />
        <View style={styles.divider} />
        <AccountActionRow
          icon="bell"
          title="Notification inbox"
          subtitle="Open message center"
          onPress={() => router.push('/notifications')}
        />
      </AccountSectionCard>

      <Text style={styles.sectionLabel}>Help & Legal</Text>
      <AccountSectionCard>
        <AccountActionRow
          icon="headset"
          title="Help & Support"
          subtitle="FAQs and complaints"
          onPress={() => router.push(accountRoutes.complaints)}
        />
        <View style={styles.divider} />
        <AccountActionRow
          icon="shield"
          title="Privacy Policy"
          subtitle="How we handle data"
          onPress={() => router.push(accountRoutes.privacy)}
        />
        <View style={styles.divider} />
        <AccountActionRow
          icon="info"
          title="Terms & Conditions"
          subtitle="Store policies"
          onPress={() => router.push(accountRoutes.terms)}
        />
        <View style={styles.divider} />
        <AccountActionRow
          icon="bag"
          title="About MayapurBazaar"
          subtitle={`Version ${appVersion()}`}
          trailing="none"
          onPress={() => showToast('info', `MayapurBazaar ${appVersion()}`)}
        />
      </AccountSectionCard>

      <Text style={styles.sectionLabel}>Account actions</Text>
      <AccountSectionCard>
        <AccountActionRow
          icon="logout"
          title="Logout"
          subtitle="Sign out on this device"
          danger
          onPress={() => setLogoutOpen(true)}
          testID="settings-logout"
        />
      </AccountSectionCard>

      <Text style={styles.version}>App version {appVersion()}</Text>
      <Text style={styles.versionHint}>
        Account deletion is not offered here — a secure deletion API is not published.
      </Text>

      <Modal visible={logoutOpen} transparent animationType="fade" onRequestClose={() => setLogoutOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setLogoutOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>Log out?</Text>
            <Text style={styles.sheetCopy}>You’ll need to sign in again to place orders on this device.</Text>
            <View style={styles.sheetActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel logout"
                onPress={() => setLogoutOpen(false)}
                style={({ pressed }) => [styles.sheetBtn, pressed && styles.pressed]}>
                <Text style={styles.sheetCancel}>Stay signed in</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirm logout"
                onPress={confirmLogout}
                style={({ pressed }) => [styles.sheetBtn, styles.sheetDanger, pressed && styles.pressed]}
                testID="settings-logout-confirm">
                <Text style={styles.sheetDelete}>Logout</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AccountScreenShell>
  );
}

function PrefSwitch({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: '#E5E7EB' }}
        thumbColor={colors.white}
        accessibilityLabel={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warmBackground,
  },
  sectionLabel: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 52,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingVertical: 4,
  },
  switchCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  switchTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  switchSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  version: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  versionHint: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: space.xl,
    gap: space.md,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  sheetCopy: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.sm,
  },
  sheetBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softBackground,
  },
  sheetDanger: {
    backgroundColor: '#FEE2E2',
  },
  sheetCancel: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  sheetDelete: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.8,
  },
});
