import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts } from '@/constants/theme';
import type { ManualAddressInput } from '@/types/location';

type ManualAddressFormProps = {
  onSubmit: (value: ManualAddressInput) => void;
};

const emptyAddress: ManualAddressInput = {
  addressLine1: '',
  landmark: '',
  city: '',
  state: '',
  postalCode: '',
};

export function ManualAddressForm({ onSubmit }: ManualAddressFormProps) {
  const [value, setValue] = useState<ManualAddressInput>(emptyAddress);
  const [error, setError] = useState<string | null>(null);
  const postalCode = value.postalCode.replace(/\D/g, '').slice(0, 6);
  const ready =
    value.addressLine1.trim().length >= 5 &&
    value.city.trim().length >= 2 &&
    value.state.trim().length >= 2 &&
    postalCode.length === 6;

  function update(field: keyof ManualAddressInput, next: string) {
    setValue((current) => ({ ...current, [field]: next }));
    setError(null);
  }

  function submit() {
    if (!ready) {
      setError('Enter the address, city, state, and a 6-digit PIN code.');
      return;
    }

    onSubmit({
      addressLine1: value.addressLine1.trim(),
      landmark: value.landmark.trim(),
      city: value.city.trim(),
      state: value.state.trim(),
      postalCode,
    });
  }

  return (
    <View style={styles.form}>
      <Field
        label="Address"
        value={value.addressLine1}
        placeholder="House, street, area"
        onChangeText={(next) => update('addressLine1', next)}
      />
      <Field
        label="Landmark"
        value={value.landmark}
        placeholder="Optional"
        onChangeText={(next) => update('landmark', next)}
      />
      <Field label="City" value={value.city} placeholder="City" onChangeText={(next) => update('city', next)} />
      <Field
        label="State"
        value={value.state}
        placeholder="State"
        onChangeText={(next) => update('state', next)}
      />
      <Field
        label="PIN code"
        value={postalCode}
        placeholder="6 digits"
        keyboardType="number-pad"
        onChangeText={(next) => update('postalCode', next)}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <PrimaryButton label="Use this address" onPress={submit} disabled={!ready} />
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'number-pad';
};

function Field({ label, value, placeholder, onChangeText, keyboardType = 'default' }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        autoCorrect={false}
        accessibilityLabel={label}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
});
