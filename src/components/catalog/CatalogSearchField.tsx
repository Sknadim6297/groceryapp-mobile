import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';

type CatalogSearchFieldProps = {
  value: string;
  onChange: (next: string) => void;
  /** Commit the current query (e.g. sync into route params for back/forward). */
  onSubmit?: (next: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  testID?: string;
  autoFocus?: boolean;
};

export function CatalogSearchField({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search',
  accessibilityLabel = 'Search',
  testID = 'catalog-search',
  autoFocus = false,
}: CatalogSearchFieldProps) {
  return (
    <View style={styles.wrap}>
      <AppIcon name="search" color={colors.textSecondary} size={18} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={() => onSubmit?.(value.trim())}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        returnKeyType="search"
        clearButtonMode="never"
        style={styles.input}
        testID={testID}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => {
            onChange('');
            onSubmit?.('');
          }}
          style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
          testID={`${testID}-clear`}>
          <AppIcon name="close" color={colors.textSecondary} size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    paddingVertical: 10,
  },
  clear: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
