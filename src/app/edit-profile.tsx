import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
import { ProfilePhotoActionSheet } from '@/components/profile/ProfilePhotoActionSheet';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { colors, fonts, homeLayout, radii, shadow } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCustomerAccount } from '@/context/CustomerAccountContext';
import { useCustomerProfile } from '@/context/CustomerProfileContext';
import { useRememberedCustomer } from '@/context/RememberedCustomerContext';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { profileRoutes } from '@/navigation/profileRoutes';
import { canUseDevelopmentHome } from '@/services/devOtp';
import { displayCustomer } from '@/services/rememberedCustomer';
import type { CustomerProfileDraft, ProfileAvatarPresetId } from '@/types/customerProfile';
import { formatIndiaMobileDisplay, isValidIndiaMobile } from '@/utils/phoneValidation';
import { formatProfileIdDisplay, profileAvatarPreset } from '@/utils/profileAvatar';
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
  const customerId = session?.customerId ?? account?.customerId ?? remembered?.customerId ?? '';
  const initial: CustomerProfileDraft = {
    name: profile?.name || identity?.name || session?.name || remembered?.name || '',
    email: profile?.email ?? '',
    dateOfBirth: profile?.dateOfBirth ?? '',
    avatarUri: profile?.avatarUri ?? null,
    avatarPreset: profile?.avatarPreset ?? null,
  };

  return (
    <EditProfileBody
      key={`${mobile}:${profile?.updatedAt ?? 'base'}`}
      mobile={mobile}
      customerId={customerId}
      initial={initial}
    />
  );
}

function EditProfileBody({
  mobile,
  customerId,
  initial,
}: {
  mobile: string;
  customerId: string;
  initial: CustomerProfileDraft;
}) {
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
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [avatarPicker, setAvatarPicker] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [picking, setPicking] = useState(false);

  const dirty = useMemo(
    () =>
      draft.name.trim() !== initial.name.trim() ||
      draft.email.trim() !== initial.email.trim() ||
      draft.dateOfBirth.trim() !== initial.dateOfBirth.trim() ||
      (draft.avatarUri ?? null) !== (initial.avatarUri ?? null) ||
      (draft.avatarPreset ?? null) !== (initial.avatarPreset ?? null),
    [draft, initial],
  );

  const mark = initials(draft.name || 'Your account');
  const mobileLabel = isValidIndiaMobile(mobile)
    ? `+91 ${formatIndiaMobileDisplay(mobile)}`
    : mobile || 'Not available';
  const idDisplay = formatProfileIdDisplay(customerId, mobile);
  const preset = profileAvatarPreset(draft.avatarPreset);
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

  async function copyId() {
    if (!idDisplay || idDisplay === 'Not assigned') {
      showToast('info', 'No customer id is available to copy yet.');
      return;
    }
    await Clipboard.setStringAsync(idDisplay.replace(/\s+/g, ''));
    showToast('success', 'Customer id copied.');
  }

  async function takePhoto() {
    setPicking(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showToast('error', 'Camera access is needed to take a profile photo.');
        return;
      }
      const picked = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.75,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (picked.canceled || !picked.assets[0]?.uri) {
        return;
      }
      setDraft((current) => ({
        ...current,
        avatarUri: picked.assets[0]!.uri,
        avatarPreset: null,
      }));
      setPhotoSheetOpen(false);
      setAvatarPicker(false);
      showToast('success', 'Profile photo updated. Save to keep it on this device.');
    } finally {
      setPicking(false);
    }
  }

  async function pickFromDevice() {
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('error', 'Photo access is needed to choose a profile picture.');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.75,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (picked.canceled || !picked.assets[0]?.uri) {
        return;
      }
      setDraft((current) => ({
        ...current,
        avatarUri: picked.assets[0]!.uri,
        avatarPreset: null,
      }));
      setPhotoSheetOpen(false);
      setAvatarPicker(false);
      showToast('success', 'Profile photo updated. Save to keep it on this device.');
    } finally {
      setPicking(false);
    }
  }

  function selectPreset(id: ProfileAvatarPresetId) {
    setDraft((current) => ({
      ...current,
      avatarPreset: id,
      avatarUri: null,
    }));
    setPhotoSheetOpen(false);
    setAvatarPicker(false);
    showToast('success', 'Avatar selected. Save to keep it on this device.');
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
      avatarUri: draft.avatarUri ?? null,
      avatarPreset: draft.avatarPreset ?? null,
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
      <AppScreenHeader title="Profile" onBack={requestBack} fallbackHref={profileRoutes.profile} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.scroll, { paddingBottom: 24 + keyboardOverlap }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.column}>
            <View style={styles.hero}>
              <View style={styles.avatarWrap}>
                <View style={[styles.avatar, preset ? { backgroundColor: preset.wash } : null]}>
                  {draft.avatarUri ? (
                    <Image source={{ uri: draft.avatarUri }} style={styles.avatarImage} contentFit="cover" />
                  ) : preset ? (
                    <Text style={styles.avatarEmoji}>{preset.emoji}</Text>
                  ) : mark ? (
                    <Text style={styles.avatarText}>{mark}</Text>
                  ) : (
                    <AppIcon name="profile" color={colors.primaryInk} size={36} />
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                  onPress={() => {
                    setAvatarPicker(false);
                    setPhotoSheetOpen(true);
                  }}
                  style={({ pressed }) => [styles.cameraBadge, pressed && styles.pressed]}
                  testID="profile-photo-open">
                  <AppIcon name="camera" color={colors.text} size={16} />
                </Pressable>
              </View>

              <Text style={styles.heroName} numberOfLines={1}>
                {draft.name.trim() || 'Your account'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Copy customer id"
                onPress={() => void copyId()}
                style={({ pressed }) => [styles.idRow, pressed && styles.pressed]}
                testID="profile-copy-id">
                <Text style={styles.idText}>{idDisplay}</Text>
                <AppIcon name="copy" color={colors.textSecondary} size={16} />
              </Pressable>
            </View>

            <View style={styles.infoCard}>
              <InfoRow icon="profile" error={nameError}>
                <TextInput
                  value={draft.name}
                  onChangeText={(next) => update('name', next)}
                  placeholder="Full name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel="Full Name"
                  style={[styles.rowInput, nameError ? styles.rowInputError : null]}
                />
              </InfoRow>
              <View style={styles.rowDivider} />
              <InfoRow icon="card">
                <Text style={styles.rowValue}>{idDisplay}</Text>
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
                  accessibilityLabel="Email Address"
                  style={[styles.rowInput, emailError ? styles.rowInputError : null]}
                />
              </InfoRow>
            </View>

            <View style={styles.infoCard}>
              <InfoRow icon="calendar">
                <DateOfBirthField
                  embedded
                  value={draft.dateOfBirth || null}
                  displayValue={draft.dateOfBirth ? formatDateOfBirth(draft.dateOfBirth) : ''}
                  onChange={(next) => update('dateOfBirth', next ?? '')}
                />
              </InfoRow>
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

      <ProfilePhotoActionSheet
        visible={photoSheetOpen}
        picking={picking}
        showAvatarPicker={avatarPicker}
        onClose={() => {
          if (!picking) {
            setPhotoSheetOpen(false);
            setAvatarPicker(false);
          }
        }}
        onShowPicture={() => {
          setPhotoSheetOpen(false);
          setAvatarPicker(false);
          setPreviewOpen(true);
        }}
        onTakePhoto={() => void takePhoto()}
        onPickFromDevice={() => void pickFromDevice()}
        onChooseExisting={() => setAvatarPicker((open) => !open)}
        onSelectPreset={selectPreset}
      />

      <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewOpen(false)}>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Profile Picture</Text>
            <View style={[styles.previewAvatar, preset ? { backgroundColor: preset.wash } : null]}>
              {draft.avatarUri ? (
                <Image source={{ uri: draft.avatarUri }} style={styles.previewImage} contentFit="cover" />
              ) : preset ? (
                <Text style={styles.previewEmoji}>{preset.emoji}</Text>
              ) : (
                <Text style={styles.previewInitials}>{mark || '?'}</Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close preview"
              onPress={() => setPreviewOpen(false)}
              style={({ pressed }) => [styles.previewClose, pressed && styles.pressed]}>
              <Text style={styles.previewCloseLabel}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

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
    gap: 14,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  avatarWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.white,
    ...shadow.soft,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    color: colors.primaryInk,
  },
  avatarEmoji: {
    fontSize: 42,
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    textAlign: 'center',
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  idText: {
    fontFamily: fonts.medium,
    fontSize: 14,
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
  notice: {
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
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  previewCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 20,
    alignItems: 'center',
    gap: 14,
    ...shadow.card,
  },
  previewTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  previewAvatar: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewEmoji: {
    fontSize: 72,
  },
  previewInitials: {
    fontFamily: fonts.bold,
    fontSize: 56,
    color: colors.primaryInk,
  },
  previewClose: {
    minHeight: 44,
    paddingHorizontal: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCloseLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
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
