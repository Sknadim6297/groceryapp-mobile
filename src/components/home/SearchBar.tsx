import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SearchSuggestions } from '@/components/home/SearchSuggestions';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';

export function SearchBar() {
  const [query, setQuery] = useState('');

  return (
    <View>
      <View style={styles.field}>
      <AppIcon name="search" color={colors.textSecondary} size={24} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search for groceries, snacks, drinks..."
        placeholderTextColor="#94A3B8"
        style={styles.input}
        returnKeyType="search"
        onSubmitEditing={() => {
          const next = query.trim();
          if (next.length > 0) {
            router.push({ pathname: '/shop', params: { q: next } });
          }
        }}
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scan QR code"
        hitSlop={8}
        onPress={() => router.push('/scan-qr')}
        style={({ pressed }) => [styles.scanBtn, pressed && styles.scanPressed]}
        testID="home-search-scan-qr">
        <AppIcon name="scan" color={colors.text} size={24} />
      </Pressable>
      </View>
      <SearchSuggestions query={query} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 8,
  },
  scanBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanPressed: {
    opacity: 0.7,
  },
});
