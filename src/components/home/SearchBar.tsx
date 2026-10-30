import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';

export function SearchBar() {
  const [query, setQuery] = useState('');

  return (
    <View style={styles.field}>
      <AppIcon name="search" color={colors.textSecondary} size={18} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search for groceries, snacks, drinks..."
        placeholderTextColor="#94A3B8"
        style={styles.input}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
        importantForAutofill="no"
        accessibilityLabel="Search products"
        clearButtonMode="while-editing"
        testID="home-search"
        cursorColor={colors.primaryDark}
        selectionColor={colors.primaryDark}
      />
      <View accessibilityRole="image" accessibilityLabel="Scan icon">
        <AppIcon name="scan" color={colors.text} size={18} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 8,
  },
});
