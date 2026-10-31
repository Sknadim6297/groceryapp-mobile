import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { useToast } from '@/components/ui/AppToast';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts } from '@/constants/theme';
import { useAuthFlow } from '@/context/AuthFlowContext';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useProfileDraft } from '@/context/ProfileDraftContext';
import { buildCustomerRegistration, registerCustomer } from '@/services/customerAuth';
import { isValidEmail } from '@/utils/profileValidation';
import { isValidIndiaMobile } from '@/utils/phoneValidation';

export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const { nationalNumber } = useAuthFlow();
  const { confirmed, setRevisingProfile } = useDeliveryLocation();
  const draft = useProfileDraft();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [registrationSent, setRegistrationSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const mobileReady = isValidIndiaMobile(nationalNumber);
  const canSubmit = draft.fullName.trim().length > 0 && isValidEmail(draft.email);

  useEffect(() => {
    if (mobileReady) {
      return;
    }

    router.replace('/login');
  }, [mobileReady]);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/location');
  }

  async function completeProfile() {
    if (submitting) {
      return;
    }

    if (registrationSent) {
      const message = 'Registration was already submitted. The server has not confirmed it.';
      showToast('info', message);
      setNotice(message);
      return;
    }

    const name = draft.fullName.trim();
    const email = draft.email.trim();
    const nextNameError = name.length === 0 ? 'Enter your full name.' : null;
    const nextEmailError = isValidEmail(email) ? null : 'Enter a valid email address.';
    setNameError(nextNameError);
    setEmailError(nextEmailError);

    if (nextNameError || nextEmailError || !mobileReady) {
      showToast('error', nextNameError ?? nextEmailError ?? 'Enter a valid 10-digit mobile number.');
      return;
    }

    const registration = buildCustomerRegistration({
      mobile: nationalNumber,
      name,
      email,
      dateOfBirth: draft.dateOfBirth,
      location: confirmed,
    });
    if (!registration.ok) {
      showToast('error', registration.message);
      setNotice(registration.message);
      if (registration.message.startsWith('Select a delivery address')) {
        setRevisingProfile(true);
        router.push('/location');
      }
      return;
    }

    setSubmitting(true);
    setNotice(null);
    const result = await registerCustomer(registration.body);
    setSubmitting(false);
    showToast(result.tone, result.message);
    setNotice(result.message);
    if (result.tone !== 'error') {
      setRegistrationSent(true);
    }
  }

  if (!mobileReady) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.blob} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) + 16 },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.column}>
            <View style={styles.nav}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={goBack}
                style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
                <AppIcon name="back" color={colors.text} size={18} />
              </Pressable>
              <View style={styles.skipSpacer} />
            </View>

            <View style={styles.hero}>
              <View style={styles.copy}>
                <Text
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.2}
                  style={[styles.title, compact && styles.titleCompact]}>
                  Complete{'\n'}
                  <Text style={styles.accent}>your profile</Text>
                </Text>
                <Text maxFontSizeMultiplier={1.25} style={styles.subtitle}>
                  Just a few details to get a better shopping experience
                </Text>
              </View>
              {compact ? null : (
                <Image
                  source={require('@/assets/images/onboarding/profile-illustration.jpg')}
                  style={styles.art}
                  contentFit="contain"
                  accessible={false}
                />
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <AppIcon name="profile" color={colors.primaryInk} size={18} />
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Personal Information</Text>
                  <Text style={styles.cardSubtitle}>Tell us about yourself</Text>
                </View>
              </View>

              <Field label="Full Name" error={nameError}>
                <View style={styles.inputRow}>
                  <AppIcon name="profile" color={colors.textSecondary} size={18} />
                  <TextInput
                    value={draft.fullName}
                    onChangeText={(next) => {
                      draft.setFullName(next);
                      setNameError(null);
                      setNotice(null);
                    }}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="words"
                    autoCorrect={false}
                    accessibilityLabel="Full name"
                    style={styles.input}
                  />
                </View>
              </Field>

              <Field label="Email Address" error={emailError}>
                <View style={styles.inputRow}>
                  <AppIcon name="mail" color={colors.textSecondary} size={18} />
                  <TextInput
                    value={draft.email}
                    onChangeText={(next) => {
                      draft.setEmail(next);
                      setEmailError(null);
                      setNotice(null);
                    }}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Email address"
                    style={styles.input}
                  />
                </View>
              </Field>
            </View>

            <PrimaryButton
              label="Complete Profile"
              onPress={() => {
                void completeProfile();
              }}
              disabled={!canSubmit}
              loading={submitting}
              accessibilityLabel="Complete profile"
            />
            {notice ? (
              <Text accessibilityRole="alert" style={styles.notice}>
                {notice}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, error, children }: { label: string; error: string | null; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    top: -10,
    right: -20,
    width: 150,
    height: 120,
    borderRadius: 70,
    backgroundColor: colors.welcomeSoft,
  },
  scroll: {
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 20,
    gap: 14,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.welcomeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipSpacer: {
    width: 64,
  },
  skipLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.4,
    color: colors.text,
  },
  titleCompact: {
    fontSize: 28,
    lineHeight: 34,
  },
  accent: {
    color: colors.primaryDark,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  art: {
    width: 112,
    height: 102,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.welcomeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.text,
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  inputRow: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 10,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger,
  },
  notice: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
