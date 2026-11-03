import { Image } from 'expo-image';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
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

import { OtpInput } from '@/components/auth/OtpInput';
import { AppIcon } from '@/components/ui/AppIcon';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useToast } from '@/components/ui/AppToast';
import { colors, fonts } from '@/constants/theme';
import { DevOtpPanel } from '@/components/auth/DevOtpPanel';
import { useAuthFlow } from '@/context/AuthFlowContext';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCustomerAccount } from '@/context/CustomerAccountContext';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';
import { resendCustomerOtp, verifyCustomerOtp } from '@/services/customerAuth';
import {
  canUseDevelopmentHome,
  hasDevOtpRecord,
  isDevOtpEnabled,
  issueDevTestOtp,
  peekDevTestOtp,
  setDevMockCustomerStatus,
  verifyDevTestOtp,
  type DevOtpFailure,
  type DevOtpView,
} from '@/services/devOtp';
import { clearMobileOtpVerification, saveMobileOtpVerification } from '@/services/mobileVerificationStore';
import { screenAfterCustomerCall } from '@/types/customerApi';
import { INDIA_CALLING_CODE, OTP_LENGTH } from '@/types/auth';
import { formatIndiaMobileDisplay, isValidIndiaMobile } from '@/utils/phoneValidation';

function developmentFailure(reason: DevOtpFailure): string {
  if (reason === 'expired') {
    return 'That development code has expired. Resend OTP creates a new one.';
  }
  if (reason === 'used') {
    return 'That development code was already used. Resend OTP creates a new one.';
  }
  if (reason === 'locked') {
    return 'Too many incorrect attempts. Resend OTP creates a new development code.';
  }
  if (reason === 'disabled') {
    return 'Development OTP is not available in this build.';
  }
  return 'That development code does not match.';
}

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const keyboardCover = useKeyboardOverlap();
  const keyboardOverlap = Platform.OS === 'android' ? keyboardCover : 0;
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const { nationalNumber, setStanding, otpDispatched, setOtpDispatched, setMobileVerification } = useAuthFlow();
  const focused = useIsFocused();
  const { hydrated, session, devSession, signIn, keepDevelopmentLogin } = useAuthSession();
  const { setAccount } = useCustomerAccount();
  const [code, setCode] = useState('');
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState<DevOtpView | null>(() => (isDevOtpEnabled() ? peekDevTestOtp(nationalNumber) : null));
  const { showToast } = useToast();
  const ready = isValidIndiaMobile(nationalNumber);
  const complete = code.length === OTP_LENGTH;
  const leaving = useRef(false);

  useEffect(() => {
    if (!focused || !hydrated || leaving.current) {
      return;
    }
    if (session || canUseDevelopmentHome(devSession)) {
      router.replace('/home');
      return;
    }
    if (ready && otpDispatched) {
      return;
    }

    router.replace('/login');
  }, [devSession, focused, hydrated, otpDispatched, ready, session]);

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/login');
  }

  async function onVerify() {
    if (busy) {
      return;
    }

    if (!ready) {
      showToast('error', 'Enter a valid 10-digit mobile number.');
      router.replace('/login');
      return;
    }

    if (!complete) {
      showToast('error', 'Enter the 6-digit code.');
      return;
    }

    setBusy(true);
    setVerifyMessage(null);
    let holdLoading = false;
    try {
      // Dev OTP mode: never call live verify-otp.
      if (isDevOtpEnabled()) {
        if (!hasDevOtpRecord(nationalNumber)) {
          showToast('error', 'No development OTP is active. Go back and request a new one.');
          return;
        }
        const outcome = verifyDevTestOtp(nationalNumber, code);
        if (!outcome.ok) {
          const message = developmentFailure(outcome.reason);
          showToast('error', message);
          setVerifyMessage(message);
          setDevOtp(peekDevTestOtp(nationalNumber));
          return;
        }
        leaving.current = true;
        const saved = await keepDevelopmentLogin();
        if (!saved) {
          leaving.current = false;
          showToast('warning', 'This development sign-in could not be saved on this device.');
          return;
        }
        const verification = {
          mobile: nationalNumber,
          standing: (outcome.destination === 'home' ? 'registered' : 'unregistered') as 'registered' | 'unregistered',
          source: 'development-test' as const,
          credential: null,
        };
        setMobileVerification(verification);
        void saveMobileOtpVerification(verification);
        setStanding(verification.standing);
        holdLoading = true;
        setTimeout(() => {
          router.replace(outcome.destination === 'home' ? '/home' : '/complete-profile');
          setBusy(false);
        }, 60);
        return;
      }
      const result = await verifyCustomerOtp(nationalNumber, code);
      showToast(result.tone, result.message);
      setVerifyMessage(result.message);
      const screen = screenAfterCustomerCall(result, 'verify');
      if (screen === 'home' && result.temporaryLogin) {
        const saved = await signIn(result.temporaryLogin);
        if (!saved) {
          showToast('warning', 'This sign-in could not be saved on this device.');
          return;
        }
        setMobileVerification(null);
        void clearMobileOtpVerification();
        setStanding('registered');
        if (result.temporaryLogin.customerId && result.temporaryLogin.name) {
          setAccount({
            customerId: result.temporaryLogin.customerId,
            name: result.temporaryLogin.name,
            mobile: result.temporaryLogin.mobile,
            companyMobile: null,
          });
        }
        holdLoading = true;
        setTimeout(() => {
          router.replace('/home');
          setBusy(false);
        }, 60);
        return;
      }
      if (screen === 'complete-profile') {
        leaving.current = true;
        setStanding('unregistered');
        // Keep otpDispatched true so a verified OTP-first identity is not treated as "never sent".
        setOtpDispatched(true);
        const verification = {
          mobile: nationalNumber,
          standing: 'unregistered' as const,
          source: 'verify-otp' as const,
          credential: result.session
            ? { ...result.session, mobile: nationalNumber }
            : null,
        };
        setMobileVerification(verification);
        void saveMobileOtpVerification(verification);
        holdLoading = true;
        setTimeout(() => {
          router.replace('/complete-profile');
          setBusy(false);
        }, 60);
        return;
      }
    } finally {
      if (!holdLoading) {
        setBusy(false);
      }
    }
  }

  async function onResend() {
    if (busy) {
      return;
    }

    if (!ready) {
      return;
    }

    setBusy(true);
    try {
      // Dev OTP mode: never call live resend-otp.
      if (isDevOtpEnabled()) {
        const current = peekDevTestOtp(nationalNumber);
        const next = issueDevTestOtp(nationalNumber, current?.mockStatus ?? 'unregistered');
        if (!next) {
          showToast('error', 'Enter a valid 10-digit mobile number.');
          return;
        }
        setDevOtp(next);
        setCode('');
        setVerifyMessage(null);
        setResendMessage('A new development OTP is ready. It was not sent by SMS.');
        showToast('success', 'A new development OTP is ready. It was not sent by SMS.');
        return;
      }
      const result = await resendCustomerOtp(nationalNumber);
      setResendMessage(result.message);
      showToast(result.tone, result.message);
      const screen = screenAfterCustomerCall(result, 'send');
      if (screen === 'otp') {
        setOtpDispatched(true);
      }
      if (screen === 'complete-profile') {
        leaving.current = true;
        setStanding('unregistered');
        setOtpDispatched(false);
        setTimeout(() => {
          router.replace('/complete-profile');
        }, 60);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated || !ready || !otpDispatched) {
    return null;
  }

  const displayedNumber = `${INDIA_CALLING_CODE} ${formatIndiaMobileDisplay(nationalNumber)}`;

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
              Enter verification code
            </Text>
            <View style={styles.sentRow}>
              <Text maxFontSizeMultiplier={1.2} style={styles.sent} accessibilityLabel={`Sent to ${displayedNumber}`}>
                Sent to {displayedNumber}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit mobile number"
                onPress={goBack}
                hitSlop={8}
                testID="otp-back"
                style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
                <AppIcon name="pencil" color={colors.primaryInk} size={22} />
              </Pressable>
            </View>
            {devOtp && isDevOtpEnabled() && hasDevOtpRecord(nationalNumber) && !devOtp.used ? (
              <DevOtpPanel
                otp={devOtp}
                onStatus={(status) => {
                  setDevMockCustomerStatus(nationalNumber, status);
                  setDevOtp(peekDevTestOtp(nationalNumber));
                }}
              />
            ) : null}
            <OtpInput
              value={code}
              invalid={verifyMessage !== null && !complete}
              onChange={(next) => {
                setCode(next);
                setVerifyMessage(null);
              }}
            />
            {verifyMessage || resendMessage ? (
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.15} numberOfLines={2} style={styles.message}>
                {verifyMessage ?? resendMessage}
              </Text>
            ) : null}
            <View style={styles.spacer} />
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Resend SMS"
                accessibilityState={{ disabled: busy, busy }}
                disabled={busy}
                onPress={() => {
                  void onResend();
                }}
                style={({ pressed }) => [styles.action, styles.actionReady, pressed && styles.pressed]}>
                <Text style={styles.actionLabel}>Resend SMS</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Verify and continue"
                accessibilityState={{ disabled: !complete || busy, busy }}
                disabled={!complete || busy}
                onPress={() => {
                  void onVerify();
                }}
                testID="verify-otp"
                style={({ pressed }) => [styles.action, complete && styles.actionReady, pressed && styles.pressed]}>
                {busy ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={[styles.actionLabel, !complete && styles.actionLabelOff]}>Verify</Text>
                )}
              </Pressable>
            </View>
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
    gap: 16,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
  },
  sentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sent: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  edit: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  message: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  action: {
    flex: 1,
    minHeight: 54,
    borderRadius: 28,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionReady: {
    backgroundColor: colors.primary,
  },
  actionLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  actionLabelOff: {
    color: colors.textSecondary,
  },
});
