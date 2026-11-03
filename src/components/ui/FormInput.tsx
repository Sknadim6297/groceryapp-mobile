import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, control, fonts, radii, space, typeScale } from '@/constants/theme';

type FormInputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  left?: ReactNode;
  right?: ReactNode;
};

export function FormInput({ label, error, left, right, style, ...rest }: FormInputProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, error ? styles.fieldError : null]}>
        {left ? <View style={styles.affix}>{left}</View> : null}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, style]}
          {...rest}
        />
        {right ? <View style={styles.affix}>{right}</View> : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.xs,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: typeScale.caption.size,
    lineHeight: typeScale.caption.line,
    color: colors.textSecondary,
  },
  field: {
    minHeight: control.input,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: typeScale.body.size,
    lineHeight: typeScale.body.line,
    color: colors.text,
    paddingVertical: space.md,
  },
  affix: {
    flexShrink: 0,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption.size,
    lineHeight: typeScale.caption.line,
    color: colors.danger,
  },
});
