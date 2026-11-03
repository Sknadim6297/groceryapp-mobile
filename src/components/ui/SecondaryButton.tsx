import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, control, fonts, radii, space } from '@/constants/theme';
import { hapticSelection } from '@/utils/haptics';

type SecondaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
  testID,
}: SecondaryButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      testID={testID}
      onPress={() => {
        void hapticSelection();
        onPress();
      }}
      style={({ pressed }) => [styles.button, inactive && styles.inactive, pressed && !inactive && styles.pressed]}>
      {loading ? (
        <ActivityIndicator color={colors.primaryInk} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    width: '100%',
    minHeight: control.button,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  pressed: {
    opacity: 0.88,
  },
  inactive: {
    opacity: 0.55,
  },
});
