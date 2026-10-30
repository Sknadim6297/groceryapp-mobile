import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { OTP_LENGTH } from '@/types/auth';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
};

export function OtpInput({ value, onChange, invalid = false }: OtpInputProps) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={styles.boxes}>
        {Array.from({ length: OTP_LENGTH }, (_, index) => {
          const active = focused && index === activeIndex;
          return (
            <View
              key={index}
              style={[styles.box, active && styles.boxFocused, invalid && styles.boxInvalid]}>
              <Text style={styles.digit}>{value[index] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        value={value}
        onChangeText={(next) => onChange(next.replace(/\D/g, '').slice(0, OTP_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={OTP_LENGTH}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
        autoCorrect={false}
        spellCheck={false}
        caretHidden
        contextMenuHidden={false}
        accessibilityLabel="6 digit verification code"
        style={styles.input}
        cursorColor="transparent"
        selectionColor="transparent"
        testID="otp-input"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 56,
    justifyContent: 'center',
  },
  boxes: {
    flexDirection: 'row',
    gap: 8,
  },
  box: {
    flex: 1,
    maxWidth: 52,
    aspectRatio: 0.86,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderColor: colors.primaryDark,
  },
  boxInvalid: {
    borderColor: colors.danger,
  },
  digit: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  input: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
    color: 'transparent',
  },
});
