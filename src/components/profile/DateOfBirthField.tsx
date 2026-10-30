import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { createElement, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import { isFutureDate, parseIsoDate, toIsoDate } from '@/utils/profileValidation';

type DateOfBirthFieldProps = {
  value: string | null;
  displayValue: string;
  onChange: (value: string | null) => void;
};

const earliestBirthDate = new Date(1900, 0, 1);

export function DateOfBirthField({ value, displayValue, onChange }: DateOfBirthFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseIsoDate(value) : null;
  const maximumDate = new Date();

  function applyDate(date: Date) {
    if (isFutureDate(date)) {
      return;
    }

    onChange(toIsoDate(date));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        Date of Birth <Text style={styles.optional}>(Optional)</Text>
      </Text>
      {Platform.OS === 'web' ? (
        <WebDateInput value={value} onChange={onChange} />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={value ? `Date of birth ${displayValue}` : 'Select date of birth'}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
          <AppIcon name="calendar" color={colors.textSecondary} size={18} />
          <Text style={[styles.value, !value && styles.placeholder]}>{value ? displayValue : 'Select date'}</Text>
          <AppIcon name="calendar" color={colors.textSecondary} size={18} />
        </Pressable>
      )}
      {open && Platform.OS !== 'web' ? (
        <View>
          <DateTimePicker
            value={selected ?? earliestBirthDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={earliestBirthDate}
            maximumDate={maximumDate}
            accentColor={colors.primaryDark}
            themeVariant="light"
            presentation="dialog"
            onDismiss={() => setOpen(false)}
            onValueChange={(_event, date) => {
              applyDate(date);
              if (Platform.OS === 'android') {
                setOpen(false);
              }
            }}
          />
          {Platform.OS === 'ios' ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={() => setOpen(false)}>
              <Text style={styles.done}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function WebDateInput({ value, onChange }: { value: string | null; onChange: (value: string | null) => void }) {
  const maximum = toIsoDate(new Date());

  return (
    <View style={styles.field}>
      <AppIcon name="calendar" color={colors.textSecondary} size={18} />
      {createElement('input', {
        type: 'date',
        'aria-label': 'Date of birth',
        max: maximum,
        value: value ?? '',
        onChange: (event: { currentTarget: { value: string } }) => {
          const next = event.currentTarget.value;
          onChange(next.length > 0 ? next : null);
        },
        style: {
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: fonts.medium,
          fontSize: 15,
          color: value ? colors.text : colors.textSecondary,
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  optional: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  field: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  value: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
  done: {
    marginTop: 6,
    alignSelf: 'flex-end',
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.primaryInk,
  },
});
