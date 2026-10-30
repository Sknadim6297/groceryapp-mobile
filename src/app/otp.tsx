import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
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

import { OtpIllustration } from '@/components/auth/OtpIllustration';
import { OtpInput } from '@/components/auth/OtpInput';
import { OtpResend } from '@/components/auth/OtpResend';
import { AppIcon } from '@/components/ui/AppIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { useAuthFlow } from '@/context/AuthFlowContext';
import { resendOtpCode } from '@/services/customerOtp';
import { INDIA_CALLING_CODE, OTP_LENGTH } from '@/types/auth';
import { formatIndiaMobileDisplay, isValidIndiaMobile } from '@/utils/phoneValidation';

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const { nationalNumber } = useAuthFlow();
  const [code, setCode] = useState('');
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const ready = isValidIndiaMobile(nationalNumber);
  const complete = code.length === OTP_LENGTH;

  useEffect(() => {
    if (UI_PREVIEW_MODE || ready) {
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

  function onVerify() {
    if (UI_PREVIEW_MODE) {
      router.push('/location');
      return;
    }

    if (!complete) {
      return;
    }

    router.push('/location');
  }

  if (!UI_PREVIEW_MODE && !ready) {
    return null;
  }

  const displayedNumber = ready
    ? `${INDIA_CALLING_CODE} ${formatIndiaMobileDisplay(nationalNumber)}`
    : 'UI preview';

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.blobRight} />
      <View pointerEvents="none" style={styles.blobLeft} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                testID="otp-back">
                <AppIcon name="back" color={colors.text} size={18} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Help"
                onPress={() => router.push('/help')}
                style={({ pressed }) => [styles.help, pressed && styles.pressed]}
                testID="otp-help">
                <Text style={styles.helpLabel}>Help</Text>
              </Pressable>
            </View>

            <View style={styles.hero}>
              <View style={styles.copy}>
                <Text
                  accessibilityRole="header"
                  maxFontSizeMultiplier={1.15}
                  style={[styles.title, compact && styles.titleCompact]}>
                  Verify with{'\n'}
                  <Text style={styles.titleAccent}>OTP</Text>
                </Text>
                <Text maxFontSizeMultiplier={1.25} style={styles.subtitle}>
                  Enter the 6-digit code for
                </Text>
              </View>
              {compact ? null : <OtpIllustration size={92} />}
            </View>

            <View style={styles.summary}>
              <AppIcon name="phone" color={colors.text} size={16} />
              <Text
                style={styles.summaryNumber}
                accessibilityLabel={`Mobile number ${displayedNumber}`}>
                {displayedNumber}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit mobile number"
                onPress={goBack}
                hitSlop={8}
                style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
                <AppIcon name="pencil" color={colors.primaryInk} size={16} />
              </Pressable>
            </View>

            <View style={styles.form}>
              <Text style={styles.pending}>
                {UI_PREVIEW_MODE
                  ? 'UI preview. You can continue without a code. Nothing is verified.'
                  : 'A verification code has not been sent. OTP delivery is not connected yet.'}
              </Text>
              <OtpInput
                value={code}
                invalid={verifyMessage !== null && !complete}
                onChange={(next) => {
                  setCode(next);
                  setVerifyMessage(null);
                }}
              />
              <OtpResend
                detail={resendMessage}
                onPress={() => {
                  if (UI_PREVIEW_MODE) {
                    setResendMessage('UI preview. No verification code is sent.');
                    return;
                  }

                  setResendMessage(resendOtpCode().message);
                }}
              />
              {verifyMessage ? (
                <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.verifyMessage}>
                  {verifyMessage}
                </Text>
              ) : null}
              <PrimaryButton
                label="Verify & Continue"
                onPress={onVerify}
                disabled={!UI_PREVIEW_MODE && !complete}
                accessibilityLabel="Verify and continue"
                testID="verify-otp"
              />
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
    top: -30,
    right: -50,
    width: 150,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.welcomeSoft,
  },
  blobLeft: {
    position: 'absolute',
    top: 36,
    left: -80,
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
  help: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpLabel: {
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
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
    color: colors.text,
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
  titleAccent: {
    color: colors.primaryDark,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.welcomeMuted,
  },
  summary: {
    marginTop: 16,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.welcomeSoft,
    borderRadius: 22,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
  },
  summaryNumber: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  edit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    marginTop: 28,
    gap: 16,
  },
  pending: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  verifyMessage: {
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
