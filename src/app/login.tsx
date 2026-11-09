import { Image } from 'expo-image';
import { Redirect, router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MobileNumberInput } from '@/components/auth/MobileNumberInput';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useToast } from '@/components/ui/AppToast';
import { colors, fonts } from '@/constants/theme';
import { useAuthFlow } from '@/context/AuthFlowContext';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useRememberedCustomer } from '@/context/RememberedCustomerContext';
import { sendCustomerOtp } from '@/services/customerAuth';
import { canUseDevelopmentHome, clearDevTestOtp, isDevOtpEnabled, issueDevTestOtp } from '@/services/devOtp';
import {
  prepareAndroidSmsOtpListen,
  stopAndroidSmsOtpListen,
} from '@/services/androidSmsOtp';
import { clearMobileOtpVerification } from '@/services/mobileVerificationStore';
import { screenAfterCustomerCall } from '@/types/customerApi';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { getIndiaMobileError, isValidIndiaMobile } from '@/utils/phoneValidation';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const keyboardCover = useKeyboardOverlap();
  const keyboardOverlap = Platform.OS === 'android' ? keyboardCover : 0;
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const { nationalNumber, setNationalNumber, setStanding, setOtpDispatched, setMobileVerification } = useAuthFlow();
  const focused = useIsFocused();
  const { hydrated, session, devSession } = useAuthSession();
  const { hydrated: rememberedHydrated, customer: remembered } = useRememberedCustomer();
  const [typedMobile, setTypedMobile] = useState<string | null>(nationalNumber.length > 0 ? nationalNumber : null);
  const mobile = typedMobile ?? (rememberedHydrated ? (remembered?.mobile ?? nationalNumber) : nationalNumber);
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const { showToast } = useToast();
  const error = touched
    ? mobile.length === 0
      ? 'Enter your mobile number.'
      : getIndiaMobileError(mobile)
    : null;

  function onChangeMobile(next: string) {
    setTypedMobile(next);
    setNationalNumber(next);
    setNotice(null);
  }

  async function onGetOtp() {
    if (sending) {
      return;
    }

    if (mobile.length === 0) {
      setTouched(true);
      showToast('error', 'Enter your mobile number.');
      return;
    }

    if (!isValidIndiaMobile(mobile)) {
      setTouched(true);
      showToast('error', getIndiaMobileError(mobile) ?? 'Enter a valid 10-digit mobile number.');
      return;
    }

    setNationalNumber(mobile);
    setSending(true);
    setNotice(null);
    let holdLoading = false;
    try {
      // Explicit Dev OTP mode: never call live send-otp / never send SMS.
      if (isDevOtpEnabled()) {
        const issued = issueDevTestOtp(mobile, 'unregistered');
        if (!issued) {
          showToast('error', 'Enter a valid 10-digit mobile number.');
          return;
        }
        holdLoading = true;
        setNationalNumber(mobile);
        setStanding('unregistered');
        setOtpDispatched(true);
        setMobileVerification(null);
        void clearMobileOtpVerification();
        showToast('info', 'Development OTP ready — Demo / Development only. No SMS was sent.');
        setTimeout(() => {
          router.push('/otp');
          setSending(false);
        }, 60);
        return;
      }

      // Production / normal development without Dev OTP flag: live send-otp contract.
      clearDevTestOtp(mobile);
      // Google SMS Retriever / User Consent only deliver messages that arrive AFTER
      // listening starts — arm native listeners before the gateway sends SMS.
      prepareAndroidSmsOtpListen();
      const result = await sendCustomerOtp(mobile);
      const screen = screenAfterCustomerCall(result, 'send');

      if (screen === 'otp') {
        holdLoading = true;
        setNationalNumber(mobile);
        setStanding('registered');
        setOtpDispatched(true);
        setMobileVerification(null);
        void clearMobileOtpVerification();
        showToast('success', result.message || 'OTP sent successfully.');
        setTimeout(() => {
          router.push('/otp');
          setSending(false);
        }, 60);
        return;
      }

      // Not registered → open registration form silently (no toast / no error line).
      if (screen === 'complete-profile') {
        stopAndroidSmsOtpListen();
        holdLoading = true;
        setNationalNumber(mobile);
        setStanding('unregistered');
        setOtpDispatched(false);
        setMobileVerification(null);
        void clearMobileOtpVerification();
        setNotice(null);
        setTimeout(() => {
          router.push('/complete-profile');
          setSending(false);
        }, 60);
        return;
      }

      stopAndroidSmsOtpListen();
      showToast(result.tone === 'success' ? 'error' : result.tone, result.message);
      setNotice(result.message);
    } catch {
      stopAndroidSmsOtpListen();
      showToast('error', 'Could not send the verification code. Please try again.');
    } finally {
      if (!holdLoading) {
        setSending(false);
      }
    }
  }

  const ready = isValidIndiaMobile(mobile);

  if (!hydrated) {
    return null;
  }

  if (focused && (session || canUseDevelopmentHome(devSession))) {
    return <Redirect href="/home" />;
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <View style={styles.heroTop}>
            <View style={styles.logoBadge}>
              <BrandLogo height={compact ? 44 : 52} />
            </View>
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
            contentContainerStyle={[
              styles.sheetContent,
              { paddingBottom: Math.max(insets.bottom, 12) + 8 + keyboardOverlap },
            ]}>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.2} style={styles.title}>
              Enter your number
            </Text>
            <MobileNumberInput
              value={mobile}
              onChange={onChangeMobile}
              onBlur={() => setTouched(true)}
              error={error}
            />
            {notice ? (
              <Text accessibilityRole="alert" maxFontSizeMultiplier={1.15} numberOfLines={2} style={styles.notice}>
                {notice}
              </Text>
            ) : null}
            <View style={styles.spacer} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue"
              accessibilityState={{ disabled: sending, busy: sending }}
              disabled={sending}
              onPress={() => {
                void onGetOtp();
              }}
              testID="get-otp"
              style={({ pressed }) => [styles.continue, ready && styles.continueReady, pressed && styles.pressed]}>
              {sending ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={[styles.continueLabel, ready && styles.continueLabelReady]}>Continue</Text>
              )}
            </Pressable>
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
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  pressed: {
    opacity: 0.82,
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
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  notice: {
    marginTop: 12,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 28,
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
  legal: {
    marginTop: 16,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.welcomeMuted,
    textAlign: 'center',
  },
  link: {
    fontFamily: fonts.semibold,
    color: colors.text,
    textDecorationLine: 'underline',
  },
});
