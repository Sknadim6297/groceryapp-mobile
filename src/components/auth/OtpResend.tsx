import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

type OtpResendProps = {
  onPress: () => void;
  detail: string | null;
  actionLabel?: string;
  disabled?: boolean;
};

export function OtpResend({ onPress, detail, actionLabel = 'Resend unavailable', disabled = false }: OtpResendProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.prompt}>{"Didn't receive OTP?"}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Resend OTP"
          accessibilityHint={disabled ? 'Please wait' : 'Request another code'}
          disabled={disabled}
          onPress={onPress}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}>
          <Text style={[styles.action, disabled && styles.disabled]}>{actionLabel}</Text>
        </Pressable>
      </View>
      {detail ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.detail}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  prompt: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.welcomeMuted,
  },
  action: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryInk,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
  detail: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
});
