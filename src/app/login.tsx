import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthIllustration } from '@/components/auth/AuthIllustration';
import { MobileNumberInput } from '@/components/auth/MobileNumberInput';
import { AppIcon } from '@/components/ui/AppIcon';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { useAuthFlow } from '@/context/AuthFlowContext';
import { getIndiaMobileError, isValidIndiaMobile } from '@/utils/phoneValidation';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const { nationalNumber, setNationalNumber } = useAuthFlow();
  const [mobile, setMobile] = useState(nationalNumber);
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const valid = isValidIndiaMobile(mobile);
  const error = touched ? getIndiaMobileError(mobile) : null;

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }

  function onChangeMobile(next: string) {
    setMobile(next);
    setNationalNumber(next);
    setNotice(null);
  }

  function onGetOtp() {
    if (UI_PREVIEW_MODE) {
      if (isValidIndiaMobile(mobile)) {
        setNationalNumber(mobile);
      }
      router.push('/otp');
      return;
    }

    if (!isValidIndiaMobile(mobile)) {
      setTouched(true);
      return;
    }

    setNationalNumber(mobile);
    router.push('/otp');
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.blobRight} />
      <View pointerEvents="none" style={styles.blobLeft} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + 8,
              paddingBottom: Math.max(insets.bottom, 16) + 12,
            },
          ]}>
          <View style={styles.column}>
            <View style={styles.nav}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={goBack}
                style={({ pressed }) => [styles.back, pressed && styles.pressed]}
                testID="login-back">
                <AppIcon name="back" color={colors.text} size={18} />
              </Pressable>
              <BrandLogo height={40} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Skip sign-in and browse"
                onPress={() => {
                  setMobile('');
                  setNationalNumber('');
                  router.push('/home');
                }}
                style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
                testID="login-skip">
                <Text style={styles.skipLabel}>{UI_PREVIEW_MODE ? 'Preview skip' : 'Skip'}</Text>
              </Pressable>
            </View>

            <View style={styles.hero}>
              <View
                accessible
                accessibilityRole="header"
                accessibilityLabel="Enter your mobile number to get OTP"
                style={styles.copy}>
                <Text maxFontSizeMultiplier={1.15} style={[styles.title, compact && styles.titleCompact]}>
                  Enter your
                </Text>
                <Text
                  maxFontSizeMultiplier={1.15}
                  style={[styles.title, styles.titleAccent, compact && styles.titleCompact]}>
                  mobile number
                </Text>
                <Text maxFontSizeMultiplier={1.15} style={[styles.title, compact && styles.titleCompact]}>
                  to get OTP
                </Text>
                <Text maxFontSizeMultiplier={1.25} style={styles.subtitle}>
                  We will send a 6-digit code to verify your number
                </Text>
              </View>
              <AuthIllustration size={compact ? 96 : 116} />
            </View>

            <View style={styles.form}>
              <MobileNumberInput
                value={mobile}
                onChange={onChangeMobile}
                onBlur={() => setTouched(true)}
                error={error}
              />
              <PrimaryButton
                label="Get OTP"
                onPress={onGetOtp}
                disabled={!UI_PREVIEW_MODE && !valid}
                accessibilityLabel="Get OTP"
                testID="get-otp"
              />
              {UI_PREVIEW_MODE ? (
                <Text style={styles.notice}>UI preview. This does not sign in or send a code.</Text>
              ) : null}
              {notice ? (
                <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.notice}>
                  {notice}
                </Text>
              ) : null}
              <Text maxFontSizeMultiplier={1.3} style={styles.legal}>
                By continuing, you agree to our{' '}
                <Text accessibilityRole="link" style={styles.link} onPress={() => router.push('/terms')}>
                  Terms & Conditions
                </Text>{' '}
                and{' '}
                <Text accessibilityRole="link" style={styles.link} onPress={() => router.push('/privacy')}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: 480,
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  blobRight: {
    position: 'absolute',
    top: -20,
    right: -40,
    width: 160,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.welcomeSoft,
  },
  blobLeft: {
    position: 'absolute',
    top: 28,
    left: -70,
    width: 120,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.welcomeSoft,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.welcomeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
  hero: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
  },
  titleCompact: {
    fontSize: 22,
    lineHeight: 28,
  },
  titleAccent: {
    color: colors.primaryDark,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.welcomeMuted,
  },
  form: {
    marginTop: 28,
    gap: 16,
  },
  notice: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  legal: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.welcomeMuted,
    textAlign: 'center',
  },
  link: {
    fontFamily: fonts.semibold,
    color: colors.primaryInk,
  },
});
