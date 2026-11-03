import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { colors, fonts } from '@/constants/theme';
import { searchSuggestions, type SearchSuggestion } from '@/data/searchSuggestions';
import { resolveParentIdForCategory } from '@/data/subcategoryCatalog';

type SearchSuggestionsProps = {
  query: string;
  onPick?: (item: SearchSuggestion) => void;
  style?: StyleProp<ViewStyle>;
};

export function SearchSuggestions({ query, onPick, style }: SearchSuggestionsProps) {
  const items = searchSuggestions(query);
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={[styles.list, style]}>
      <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={styles.scroll}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          accessibilityRole="button"
          accessibilityLabel={item.subtitle ? `${item.title}, ${item.subtitle}` : item.title}
          onPress={() => (onPick ? onPick(item) : openSuggestion(item))}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <CatalogImage source={item.image} style={styles.photo} label={item.title} contentFit="cover" />
          <View style={styles.copy}>
            <Text numberOfLines={1} style={styles.title}>
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text numberOfLines={1} style={styles.subtitle}>
                {item.subtitle}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
      </ScrollView>
    </View>
  );
}

export function openSuggestion(item: SearchSuggestion) {
  if (item.kind === 'product' && item.productId) {
    router.push({ pathname: '/product/[id]', params: { id: item.productId } });
    return;
  }
  if (item.kind === 'category' && item.categoryId) {
    const parentId = resolveParentIdForCategory(item.categoryId);
    if (parentId) {
      router.push({ pathname: '/category/[id]', params: { id: parentId } });
      return;
    }
    router.push({ pathname: '/shop', params: { category: item.categoryId } });
    return;
  }
  router.push({ pathname: '/shop', params: { q: item.title } });
}

const styles = StyleSheet.create({
  list: {
    marginTop: 8,
    maxHeight: 320,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  scroll: {
    flexGrow: 0,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  photo: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#F6F7F9',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  subtitle: {
    marginTop: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
  },
  pressed: {
    backgroundColor: colors.softYellow,
  },
});
