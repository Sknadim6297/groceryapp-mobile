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
import { colors, fonts, homeLayout, radii, shadow } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCustomerAccount } from '@/context/CustomerAccountContext';
import { useCustomerProfile } from '@/context/CustomerProfileContext';
import { useRememberedCustomer } from '@/context/RememberedCustomerContext';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { profileRoutes } from '@/navigation/profileRoutes';
import { buildCustomerUpdate, updateCustomer } from '@/services/customerAuth';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { displayCustomer } from '@/services/rememberedCustomer';
import type { CustomerProfileDraft } from '@/types/customerProfile';
import { formatIndiaMobileDisplay, isValidIndiaMobile } from '@/utils/phoneValidation';
import { formatDateOfBirth, isValidEmail } from '@/utils/profileValidation';

function emptyDraft(): CustomerProfileDraft {
  return {
    name: '',
    email: '',
    dateOfBirth: '',
  };
}

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

  const identity = displayCustomer(
    session ?? (devSession ? { mobile: devSession.mobile } : null),
    account,
    remembered,
  );
  const mobile = identity?.mobile ?? session?.mobile ?? devSession?.mobile ?? '';
  const initial: CustomerProfileDraft = {
    name: profile?.name || identity?.name || session?.name || remembered?.name || '',
    email: profile?.email ?? '',
    dateOfBirth: profile?.dateOfBirth ?? '',
  };

  return (
    <EditProfileBody
      key={`${mobile}:${profile?.updatedAt ?? 'base'}`}
      mobile={mobile}
      initial={initial}
    />
  );
}

function EditProfileBody({ mobile, initial }: { mobile: string; initial: CustomerProfileDraft }) {
  const insets = useSafeAreaInsets();
  const keyboardCover = useKeyboardOverlap();
  const keyboardOverlap = Platform.OS === 'android' ? keyboardCover : 0;
  const { saveProfile } = useCustomerProfile();
  const [draft, setDraft] = useState<CustomerProfileDraft>(initial);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const dirty = useMemo(() => {
    const keys = Object.keys(emptyDraft()) as (keyof CustomerProfileDraft)[];
    return keys.some((key) => draft[key].trim() !== initial[key].trim());
  }, [draft, initial]);

  const canSave = dirty && !saving && draft.name.trim().length >= 2;
  const mobileLabel = isValidIndiaMobile(mobile) ? formatIndiaMobileDisplay(mobile) : mobile;
  const mark = initials(draft.name);

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
    if (dirty) {
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
    if (saving) {
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
    const payload: CustomerProfileDraft = {
      name,
      email,
      dateOfBirth: draft.dateOfBirth.trim(),
    };

    const result = await saveProfile(payload);

    if (result.ok && isValidIndiaMobile(mobile)) {
      const built = buildCustomerUpdate({
        mobile,
        name: payload.name,
        email: payload.email,
        dateOfBirth: payload.dateOfBirth || null,
      });
      if (built.ok) {
        await updateCustomer(built.body);
      }
    }
    setSaving(false);

    if (!result.ok) {
      setError(
        result.reason === 'no-owner'
          ? 'Sign in again to edit your profile.'
          : result.reason === 'validation'
            ? 'Please check your details and try again.'
            : 'Could not save your profile on this device.',
      );
      return;
    }

    // Success: go back immediately — no toast.
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(profileRoutes.profile);
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Profile" onBack={requestBack} fallbackHref={profileRoutes.profile} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.scroll, { paddingBottom: 24 + keyboardOverlap }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.column}>
            <View style={styles.hero}>
              <View style={styles.avatar}>
                {mark ? <Text style={styles.avatarText}>{mark}</Text> : <AppIcon name="profile" color={colors.primaryInk} size={36} />}
              </View>
              <Text style={styles.heroName} numberOfLines={1}>
                {draft.name.trim() || 'Your account'}
              </Text>
              <Text style={styles.mobileHint}>{mobileLabel}</Text>
            </View>

            <View style={styles.infoCard}>
              <InfoRow icon="profile" error={nameError}>
                <TextInput
                  value={draft.name}
                  onChangeText={(next) => update('name', next)}
                  placeholder="Name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel="Name"
                  style={[styles.rowInput, nameError ? styles.rowInputError : null]}
                />
              </InfoRow>
              <View style={styles.rowDivider} />
              <InfoRow icon="phone">
                <Text style={styles.rowValue}>{mobileLabel}</Text>
              </InfoRow>
              <View style={styles.rowDivider} />
              <InfoRow icon="mail" error={emailError}>
                <TextInput
                  value={draft.email}
                  onChangeText={(next) => update('email', next)}
                  placeholder="Email (optional)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Email"
                  style={[styles.rowInput, emailError ? styles.rowInputError : null]}
                />
              </InfoRow>
              <View style={styles.rowDivider} />
              <InfoRow icon="calendar">
                <DateOfBirthField
                  embedded
                  value={draft.dateOfBirth || null}
                  displayValue={draft.dateOfBirth ? formatDateOfBirth(draft.dateOfBirth) : ''}
                  onChange={(next) => update('dateOfBirth', next ?? '')}
                />
              </InfoRow>
            </View>

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
            {saving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.saveLabel}>Save Changes</Text>}
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

function InfoRow({
  icon,
  children,
  error,
}: {
  icon: AppIconName;
  children: ReactNode;
  error?: string | null;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconBadge}>
        <AppIcon name={icon} color={colors.text} size={18} />
      </View>
      <View style={styles.infoBody}>
        {children}
        {error ? (
          <Text accessibilityRole="alert" style={styles.fieldError}>
            {error}
          </Text>
        ) : null}
      </View>
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
    backgroundColor: colors.warmBackground,
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
    paddingTop: 12,
  },
  column: {
    width: '100%',
    maxWidth: homeLayout.maxWidth,
    paddingHorizontal: homeLayout.gutter,
    gap: 12,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 4,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    ...shadow.soft,
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    color: colors.primaryInk,
  },
  heroName: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    textAlign: 'center',
  },
  mobileHint: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.soft,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 66,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
  fieldError: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger,
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
    borderRadius: radii.pill,
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
