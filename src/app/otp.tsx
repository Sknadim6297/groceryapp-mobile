import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
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

import { DevOtpPanel } from '@/components/auth/DevOtpPanel';
import { OtpInput } from '@/components/auth/OtpInput';
import { AppIcon } from '@/components/ui/AppIcon';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useToast } from '@/components/ui/AppToast';
import { colors, fonts } from '@/constants/theme';
import { useAuthFlow } from '@/context/AuthFlowContext';
import { resendCustomerOtp, verifyCustomerOtp } from '@/services/customerAuth';
import {
  isDevOtpEnabled,
  issueDevTestOtp,
  peekDevTestOtp,
  readDevTestSession,
  setDevMockCustomerStatus,
  verifyDevTestOtp,
  type DevMockCustomerStatus,
  type DevOtpFailure,
} from '@/services/devOtp';
import { screenAfterCustomerCall } from '@/types/customerApi';
import { INDIA_CALLING_CODE, OTP_LENGTH } from '@/types/auth';
import { formatIndiaMobileDisplay, isValidIndiaMobile } from '@/utils/phoneValidation';

function devOtpFailureMessage(reason: DevOtpFailure): string {
  if (reason === 'expired') {
    return 'That development test code expired. Tap Resend OTP.';
  }
  if (reason === 'used') {
    return 'That development test code was already used. Tap Resend OTP.';
  }
  if (reason === 'wrong') {
    return 'That development test code does not match.';
  }
  return 'Development test OTP is unavailable.';
}

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const { nationalNumber } = useAuthFlow();
  const [code, setCode] = useState('');
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  const devMode = isDevOtpEnabled();
  const [, refreshDevOtp] = useState(0);
  const ready = isValidIndiaMobile(nationalNumber);
  const complete = code.length === OTP_LENGTH;
  const devOtp = devMode && ready ? peekDevTestOtp(nationalNumber) : null;

  useEffect(() => {
    if (ready) {
      return;
    }

    router.replace('/login');
  }, [ready]);

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
      if (devMode) {
        const result = verifyDevTestOtp(nationalNumber, code);
        refreshDevOtp((value) => value + 1);
        if (!result.ok || readDevTestSession()?.kind !== 'development-test') {
          const message = devOtpFailureMessage(result.ok ? 'disabled' : result.reason);
          showToast('error', message);
          setVerifyMessage(message);
          return;
        }
        showToast('success', 'Development test code matched. This is not a real account.');
        holdLoading = true;
        setTimeout(() => {
          router.replace(result.destination === 'home' ? '/home' : '/complete-profile');
          setBusy(false);
        }, 60);
        return;
      }

      const result = await verifyCustomerOtp(nationalNumber, code);
      showToast(result.tone, result.message);
      setVerifyMessage(result.message);
      const screen = screenAfterCustomerCall(result, 'verify');
      if (screen === 'complete-profile' || screen === 'home') {
        holdLoading = true;
        setTimeout(() => {
          router.replace(screen === 'home' ? '/home' : '/complete-profile');
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
      if (devMode) {
        const issued = issueDevTestOtp(nationalNumber, devOtp?.mockStatus ?? 'unregistered');
        refreshDevOtp((value) => value + 1);
        setCode('');
        setVerifyMessage(null);
        const message = issued
          ? 'A new development test code is shown above.'
          : 'Development test OTP is unavailable.';
        setResendMessage(message);
        showToast(issued ? 'info' : 'error', message);
        return;
      }

      const result = await resendCustomerOtp(nationalNumber);
      setResendMessage(result.message);
      showToast(result.tone, result.message);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
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
            contentContainerStyle={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
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
            {devMode && devOtp ? (
              <DevOtpPanel
                otp={devOtp}
                onStatus={(status: DevMockCustomerStatus) => {
                  setDevMockCustomerStatus(nationalNumber, status);
                  refreshDevOtp((value) => value + 1);
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
