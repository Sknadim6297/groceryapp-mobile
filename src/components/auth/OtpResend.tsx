import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

type OtpResendProps = {
  onPress: () => void;
  detail: string | null;
};

export function OtpResend({ onPress, detail }: OtpResendProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.prompt}>{"Didn't receive OTP?"}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Resend OTP"
          accessibilityHint="OTP resend is not connected"
          onPress={onPress}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}>
          <Text style={styles.action}>Resend unavailable</Text>
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
