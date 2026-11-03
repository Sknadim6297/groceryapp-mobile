import { Redirect, router, useIsFocused } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateOfBirthField } from '@/components/profile/DateOfBirthField';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCustomerAccount } from '@/context/CustomerAccountContext';
import { useCustomerProfile } from '@/context/CustomerProfileContext';
import { useRememberedCustomer } from '@/context/RememberedCustomerContext';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { profileRoutes } from '@/navigation/profileRoutes';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { displayCustomer } from '@/services/rememberedCustomer';
import type { CustomerProfileDraft } from '@/types/customerProfile';
import { formatIndiaMobileDisplay, isValidIndiaMobile } from '@/utils/phoneValidation';
import { formatDateOfBirth, isValidEmail } from '@/utils/profileValidation';

export default function EditProfileScreen() {
  const focused = useIsFocused();
  const { hydrated: authHydrated, session, devSession } = useAuthSession();
  const { hydrated, profile } = useCustomerProfile();
  const { account } = useCustomerAccount();
  const { customer: remembered } = useRememberedCustomer();

  if (!authHydrated || !hydrated) {
    return (
      <View style={[styles.screen, styles.loading]}>
        <ActivityIndicator color={colors.primaryInk} />
      </View>
    );
  }

  if (!session && !canUseDevelopmentHome(devSession)) {
    if (!focused) {
      return null;
    }
    return <Redirect href={profileRoutes.login} />;
  }

  const identity = displayCustomer(session, account, remembered);
  const mobile = session?.mobile ?? devSession?.mobile ?? identity?.mobile ?? '';
  const initial: CustomerProfileDraft = {
    name: profile?.name || identity?.name || session?.name || remembered?.name || '',
    email: profile?.email ?? '',
    dateOfBirth: profile?.dateOfBirth ?? '',
  };

  return <EditProfileBody key={`${mobile}:${profile?.updatedAt ?? 'base'}`} mobile={mobile} initial={initial} />;
}

function EditProfileBody({ mobile, initial }: { mobile: string; initial: CustomerProfileDraft }) {
  const insets = useSafeAreaInsets();
  const keyboardCover = useKeyboardOverlap();
  const keyboardOverlap = Platform.OS === 'android' ? keyboardCover : 0;
  const { saveProfile } = useCustomerProfile();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<CustomerProfileDraft>(initial);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const dirty = useMemo(
    () =>
      draft.name.trim() !== initial.name.trim() ||
      draft.email.trim() !== initial.email.trim() ||
      draft.dateOfBirth.trim() !== initial.dateOfBirth.trim(),
    [draft, initial],
  );

  const mark = initials(draft.name || 'Your account');
  const mobileLabel = isValidIndiaMobile(mobile)
    ? `+91 ${formatIndiaMobileDisplay(mobile)}`
    : mobile || 'Not available';
  const ready = draft.name.trim().length >= 2 && (draft.email.trim().length === 0 || isValidEmail(draft.email));
  const canSave = ready && dirty && !saving;

  function update<K extends keyof CustomerProfileDraft>(field: K, value: CustomerProfileDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (field === 'name') {
      setNameError(null);
    }
    if (field === 'email') {
      setEmailError(null);
    }
    setError(null);
  }

  function requestBack() {
    if (dirty && !saving) {
      setLeaveOpen(true);
      return;
    }
    leave();
  }

  function leave() {
    setLeaveOpen(false);
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(profileRoutes.profile);
  }

  async function submit() {
    if (saving || !dirty) {
      return;
    }
    const name = draft.name.trim();
    const email = draft.email.trim();
    let invalid = false;
    if (name.length < 2) {
      setNameError('Enter your full name.');
      invalid = true;
    }
    if (email.length > 0 && !isValidEmail(email)) {
      setEmailError('Enter a valid email address.');
      invalid = true;
    }
    if (invalid) {
      setError('Please fix the highlighted fields.');
      return;
    }

    setSaving(true);
    setError(null);
    const result = await saveProfile({
      name,
      email,
      dateOfBirth: draft.dateOfBirth.trim(),
    });
    setSaving(false);

    if (!result.ok) {
      const message =
        result.reason === 'no-owner'
          ? 'Sign in again to edit your profile.'
          : result.reason === 'validation'
            ? 'Please check your details and try again.'
            : 'Could not save your profile on this device.';
      setError(message);
      showToast('error', message);
      return;
    }

    showToast('success', 'Profile updated on this device. Server profile sync is not available yet.');
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(profileRoutes.profile);
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Edit Profile" onBack={requestBack} fallbackHref={profileRoutes.profile} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: 24 + keyboardOverlap },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.column}>
            <View style={styles.avatarBlock}>
              <View style={styles.avatar} accessibilityLabel="Profile initials">
                {mark ? (
                  <Text style={styles.avatarText}>{mark}</Text>
                ) : (
                  <AppIcon name="profile" color={colors.text} size={36} />
                )}
              </View>
              <Text style={styles.avatarHint}>Personal account details</Text>
            </View>

            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.sectionStack}>
              <DetailRow icon="profile" label="Full Name" error={nameError}>
                <TextInput
                  value={draft.name}
                  onChangeText={(next) => update('name', next)}
                  placeholder="Your full name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel="Full Name"
                  style={[styles.rowInput, nameError ? styles.rowInputError : null]}
                />
              </DetailRow>

              <DetailRow icon="mail" label="Email Address" error={emailError}>
                <TextInput
                  value={draft.email}
                  onChangeText={(next) => update('email', next)}
                  placeholder="Email (optional)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Email Address"
                  style={[styles.rowInput, emailError ? styles.rowInputError : null]}
                />
              </DetailRow>

              <DetailRow
                icon="phone"
                label="Mobile Number"
                trailing={<AppIcon name="lock" color={colors.textSecondary} size={16} />}
                accessibilityHint="Verified mobile number. Read only.">
                <Text style={styles.rowValue} accessibilityLabel={`Mobile number ${mobileLabel}`}>
                  {mobileLabel}
                </Text>
                <Text style={styles.rowMeta}>Verified mobile number</Text>
              </DetailRow>

              <DetailRow icon="calendar" label="Date of Birth">
                <DateOfBirthField
                  embedded
                  value={draft.dateOfBirth || null}
                  displayValue={draft.dateOfBirth ? formatDateOfBirth(draft.dateOfBirth) : ''}
                  onChange={(next) => update('dateOfBirth', next ?? '')}
                />
              </DetailRow>
            </View>

            <Text style={styles.notice}>
              Changes are saved on this device only. A server profile-update API is not published yet.
            </Text>

            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 12) + keyboardOverlap,
            },
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save Changes"
            accessibilityState={{ disabled: !canSave, busy: saving }}
            disabled={!canSave}
            onPress={() => void submit()}
            style={({ pressed }) => [
              styles.saveButton,
              !canSave && styles.saveDisabled,
              pressed && canSave && styles.pressed,
            ]}
            testID="edit-profile-save">
            {saving ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.saveLabel}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={leaveOpen} transparent animationType="fade" onRequestClose={() => setLeaveOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setLeaveOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>Discard changes?</Text>
            <Text style={styles.sheetCopy}>You have unsaved profile edits. Leave without saving?</Text>
            <View style={styles.sheetActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Keep editing"
                onPress={() => setLeaveOpen(false)}
                style={({ pressed }) => [styles.sheetButton, pressed && styles.pressed]}>
                <Text style={styles.sheetCancel}>Keep editing</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Discard changes"
                onPress={leave}
                style={({ pressed }) => [styles.sheetButton, styles.sheetDanger, pressed && styles.pressed]}>
                <Text style={styles.sheetDelete}>Discard</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  children,
  trailing,
  error,
  accessibilityHint,
}: {
  icon: AppIconName;
  label: string;
  children: ReactNode;
  trailing?: ReactNode;
  error?: string | null;
  accessibilityHint?: string;
}) {
  return (
    <View
      style={[styles.detailRow, error ? styles.detailRowError : null]}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}>
      <View style={styles.iconBadge}>
        <AppIcon name={icon} color={colors.text} size={18} />
      </View>
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{label}</Text>
        {children}
        {error ? (
          <Text accessibilityRole="alert" style={styles.fieldError}>
            {error}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    alignItems: 'center',
    paddingTop: 20,
  },
  column: {
    width: '100%',
    maxWidth: homeLayout.maxWidth,
    paddingHorizontal: homeLayout.gutter,
    gap: 12,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: colors.primaryInk,
  },
  avatarHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 2,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  sectionStack: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  detailRowError: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  detailLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  rowInput: {
    padding: 0,
    margin: 0,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    minHeight: 22,
  },
  rowInputError: {
    color: colors.danger,
  },
  rowValue: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  rowMeta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  trailing: {
    marginLeft: 4,
  },
  fieldError: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger,
  },
  notice: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.primaryInk,
    backgroundColor: colors.softYellow,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  footer: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  saveButton: {
    minHeight: 54,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  saveDisabled: {
    opacity: 0.45,
  },
  saveLabel: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
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
    gap: 10,
    marginTop: 8,
  },
  sheetButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
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
    opacity: 0.75,
  },
});
