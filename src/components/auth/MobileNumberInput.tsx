import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { INDIA_CALLING_CODE } from '@/types/auth';
import { sanitizeIndiaMobile } from '@/utils/phoneValidation';

type MobileNumberInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  onBlur?: () => void;
};

export function MobileNumberInput({ value, onChange, error, onBlur }: MobileNumberInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <View
        style={[
          styles.field,
          focused && styles.focused,
          error ? styles.invalid : null,
        ]}>
        <IndiaFlag />
        <Text style={styles.code} accessibilityLabel={`Country code ${INDIA_CALLING_CODE}`}>
          {INDIA_CALLING_CODE}
        </Text>
        <View style={styles.divider} />
        <TextInput
          value={value}
          onChangeText={(next) => onChange(sanitizeIndiaMobile(next))}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholder="Enter mobile number"
          placeholderTextColor={colors.welcomeMuted}
          keyboardType="phone-pad"
          inputMode="numeric"
          maxLength={10}
          autoComplete="tel"
          textContentType="telephoneNumber"
          importantForAutofill="yes"
          autoCorrect={false}
          accessibilityLabel="Mobile number"
          accessibilityHint="10 digit Indian mobile number"
          style={styles.input}
          cursorColor={colors.primaryDark}
          selectionColor={colors.primaryDark}
          testID="mobile-input"
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function IndiaFlag() {
  return (
    <View accessibilityLabel="India" style={styles.flag}>
      <View style={styles.saffron} />
      <View style={styles.flagWhite}>
        <View style={styles.chakra} />
      </View>
      <View style={styles.green} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  focused: {
    borderColor: colors.primaryDark,
  },
  invalid: {
    borderColor: colors.danger,
  },
  flag: {
    width: 22,
    height: 16,
    borderRadius: 2,
    overflow: 'hidden',
  },
  saffron: {
    flex: 1,
    backgroundColor: '#FF9933',
  },
  flagWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chakra: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#000080',
  },
  green: {
    flex: 1,
    backgroundColor: '#138808',
  },
  code: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    paddingVertical: 12,
  },
  error: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
});
