import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { OTP_LENGTH } from '@/types/auth';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
};

export function OtpInput({ value, onChange, invalid = false }: OtpInputProps) {
  const inputRef = useRef<{ focus: () => void } | null>(null);
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  return (
    <Pressable onPressIn={() => inputRef.current?.focus()} style={styles.wrap}>
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
        ref={(node) => {
          inputRef.current = node;
        }}
        value={value}
        onChangeText={(next) => onChange(next.replace(/\D/g, '').slice(0, OTP_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 56,
    justifyContent: 'center',
  },
  boxes: {
    flexDirection: 'row',
    gap: 10,
  },
  box: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderColor: colors.primaryInk,
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
    zIndex: 2,
    opacity: 0.02,
    color: 'transparent',
    fontSize: 16,
  },
});
