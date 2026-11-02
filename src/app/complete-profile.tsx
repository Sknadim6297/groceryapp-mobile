import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useToast } from '@/components/ui/AppToast';
import { colors, fonts } from '@/constants/theme';
import { formatDeliveryAddress } from '@/data/referenceLocations';
import { useAuthFlow } from '@/context/AuthFlowContext';
import { useCustomerAccount } from '@/context/CustomerAccountContext';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useProfileDraft } from '@/context/ProfileDraftContext';
import { useRememberedCustomer } from '@/context/RememberedCustomerContext';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { buildCustomerRegistration, registerCustomer, sendCustomerOtp } from '@/services/customerAuth';
import { isDevOtpEnabled } from '@/services/devOtp';
import { registrationFollowUp, screenAfterCustomerCall } from '@/types/customerApi';
import { isValidEmail } from '@/utils/profileValidation';
import { formatIndiaMobileDisplay, isValidIndiaMobile } from '@/utils/phoneValidation';
import { registeredDisplayName, registeredDisplayPhone } from '@/utils/registeredIdentity';

export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const keyboardCover = useKeyboardOverlap();
  const keyboardOverlap = Platform.OS === 'android' ? keyboardCover : 0;
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const { nationalNumber, standing, setStanding, setOtpDispatched } = useAuthFlow();
  const { account, setAccount } = useCustomerAccount();
  const { confirmed, setRevisingProfile } = useDeliveryLocation();
  const draft = useProfileDraft();
  const { customer: remembered } = useRememberedCustomer();
  const [nameCleared, setNameCleared] = useState(false);
  const { showToast } = useToast();
  const rememberedName = remembered?.name.trim() ?? '';
  const nameValue = draft.fullName.length > 0 ? draft.fullName : nameCleared ? '' : rememberedName;
  const [submitting, setSubmitting] = useState(false);
  const [registrationSent, setRegistrationSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const mobileReady = isValidIndiaMobile(nationalNumber);
  const sameAccount = account && account.mobile === nationalNumber ? account : null;
  const alreadyRegistered = standing === 'registered';
  const canSubmit = alreadyRegistered || (nameValue.trim().length > 0 && isValidEmail(draft.email));

  useEffect(() => {
    if (mobileReady && standing !== 'unknown') {
      return;
    }

    router.replace('/login');
  }, [mobileReady, standing]);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/location');
  }

  async function openVerification() {
    const result = await sendCustomerOtp(nationalNumber);
    showToast(result.tone, result.message);
    setNotice(result.message);
    const screen = screenAfterCustomerCall(result, 'send');
    if (screen === 'otp') {
      setStanding('registered');
      setOtpDispatched(true);
      setTimeout(() => {
        router.replace('/otp');
      }, 60);
      return true;
    }
    if (screen === 'complete-profile') {
      setStanding('unregistered');
      setOtpDispatched(false);
    }
    return false;
  }

  async function completeProfile() {
    if (submitting) {
      return;
    }

    if (isDevOtpEnabled()) {
      showToast('info', 'Development mode does not register this number.');
      return;
    }

    if (alreadyRegistered || registrationSent) {
      setSubmitting(true);
      let holdLoading = false;
      try {
        holdLoading = await openVerification();
      } finally {
        if (!holdLoading) {
          setSubmitting(false);
        }
      }
      return;
    }

    const name = nameValue.trim();
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
    let holdLoading = false;
    try {
      const result = await registerCustomer(registration.body);
      showToast(result.tone, result.message);
      setNotice(result.message);
      if (result.customer) {
        setAccount(result.customer);
      }
      if (registrationFollowUp(result) === 'otp') {
        setStanding('registered');
        setRegistrationSent(true);
        holdLoading = await openVerification();
      }
    } finally {
      if (!holdLoading) {
        setSubmitting(false);
      }
    }
  }

  if (!mobileReady || standing === 'unknown') {
    return null;
  }

  const address = confirmed ? formatDeliveryAddress(confirmed) : '';

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <View style={styles.heroTop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={goBack}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
              <AppIcon name="back" color={colors.text} size={24} />
            </Pressable>
            <View style={styles.logoBadge}>
              <BrandLogo height={compact ? 44 : 52} />
            </View>
            <View style={styles.heroSide} />
          </View>
          <Text maxFontSizeMultiplier={1.25} style={[styles.heroLine, compact && styles.heroLineCompact]}>
            Fresh groceries, delivered{'\n'}to your door.
          </Text>
          <View style={styles.artRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Image source={require('@/assets/images/home/produce.jpg')} style={[styles.art, styles.artSide]} contentFit="cover" />
            <Image source={require('@/assets/images/onboarding/welcome-hero.jpg')} style={styles.artMain} contentFit="cover" />
            <Image source={require('@/assets/images/home/carrots.jpg')} style={[styles.art, styles.artSide]} contentFit="cover" />
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(380)} style={styles.sheet}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 12) + 8 + keyboardOverlap }]}
            showsVerticalScrollIndicator={false}>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} style={styles.title}>
              Personal information
            </Text>
            <Text maxFontSizeMultiplier={1.2} style={styles.subtitle}>
              {alreadyRegistered
                ? 'This number is already registered. Continue to the verification code.'
                : 'Add your name, email, and delivery address.'}
            </Text>

            {alreadyRegistered && sameAccount ? (
              <>
                <Field label="Full name" error={null}>
                  <View style={styles.inputRow}>
                    <Text style={styles.input}>{registeredDisplayName(sameAccount)}</Text>
                  </View>
                </Field>
                <Field label="Mobile" error={null}>
                  <View style={styles.inputRow}>
                    <Text style={styles.input}>{registeredDisplayPhone(sameAccount)}</Text>
                  </View>
                </Field>
                {sameAccount.companyMobile ? (
                  <Field label="Company mobile" error={null}>
                    <View style={styles.inputRow}>
                      <Text style={styles.input}>
                        {isValidIndiaMobile(sameAccount.companyMobile)
                          ? `+91 ${formatIndiaMobileDisplay(sameAccount.companyMobile)}`
                          : sameAccount.companyMobile}
                      </Text>
                    </View>
                  </Field>
                ) : null}
              </>
            ) : null}

            {alreadyRegistered ? null : (
              <>
                <Field label="Full name" error={nameError}>
                  <View style={[styles.inputRow, nameError ? styles.inputInvalid : null]}>
                    <TextInput
                      value={nameValue}
                      onChangeText={(next) => {
                        setNameCleared(next.length === 0);
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
                    {nameValue.length > 0 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Clear full name"
                        onPress={() => {
                          setNameCleared(true);
                          draft.setFullName('');
                          setNameError(null);
                        }}
                        hitSlop={8}>
                        <AppIcon name="close" color={colors.textSecondary} size={16} />
                      </Pressable>
                    ) : null}
                  </View>
                </Field>

                <Field label="Email" error={emailError}>
                  <View style={[styles.inputRow, emailError ? styles.inputInvalid : null]}>
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

                <Field label="Delivery address" error={null}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={address.length > 0 ? `Delivery address ${address}` : 'Add a delivery address'}
                    onPress={() => {
                      setRevisingProfile(true);
                      router.push('/location');
                    }}
                    style={({ pressed }) => [styles.inputRow, pressed && styles.pressed]}>
                    <Text numberOfLines={2} style={[styles.address, address.length === 0 && styles.addressEmpty]}>
                      {address.length > 0 ? address : 'Add a delivery address'}
                    </Text>
                    <AppIcon name="chevron" color={colors.primaryInk} size={18} />
                  </Pressable>
                </Field>

              </>
            )}
            {notice ? (
              <Text accessibilityRole="alert" maxFontSizeMultiplier={1.15} numberOfLines={2} style={styles.notice}>
                {notice}
              </Text>
            ) : null}
            <View style={styles.spacer} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue"
              accessibilityState={{ disabled: !canSubmit || submitting, busy: submitting }}
              disabled={!canSubmit || submitting}
              onPress={() => {
                void completeProfile();
              }}
              style={({ pressed }) => [styles.continue, canSubmit && styles.continueReady, pressed && styles.pressed]}>
              {submitting ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={[styles.continueLabel, canSubmit && styles.continueLabelReady]}>Continue</Text>
              )}
            </Pressable>
          </ScrollView>
        </Animated.View>
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
    backgroundColor: colors.brightYellow,
  },
  flex: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 78,
  },
  heroTop: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroSide: {
    width: 44,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  heroLine: {
    marginTop: 12,
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.text,
    textAlign: 'center',
  },
  heroLineCompact: {
    fontSize: 18,
    lineHeight: 24,
  },
  artRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -28,
    height: 92,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 10,
    zIndex: 2,
  },
  art: {
    width: 86,
    height: 72,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.white,
  },
  artSide: {
    marginBottom: 6,
  },
  artMain: {
    width: 108,
    height: 84,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.white,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 1,
  },
  sheetContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    gap: 14,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  subtitle: {
    marginTop: -6,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
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
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputInvalid: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  address: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  addressEmpty: {
    color: colors.textSecondary,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger,
  },
  notice: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 20,
  },
  continue: {
    minHeight: 54,
    borderRadius: 28,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueReady: {
    backgroundColor: colors.primary,
  },
  continueLabel: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  continueLabelReady: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.82,
  },
});
