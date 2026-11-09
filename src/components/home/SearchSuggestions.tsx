import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { colors, fonts } from '@/constants/theme';
import { useCatalog } from '@/context/CatalogContext';
import { searchSuggestions, type SearchSuggestion } from '@/data/searchSuggestions';
import { resolveParentIdForCategory } from '@/data/subcategoryCatalog';

type SearchSuggestionsProps = {
  query: string;
  onPick?: (item: SearchSuggestion) => void;
  style?: StyleProp<ViewStyle>;
};

export function SearchSuggestions({ query, onPick, style }: SearchSuggestionsProps) {
  const { products, listShelves } = useCatalog();
  const shelves = useMemo(() => listShelves(), [listShelves]);
  const items = useMemo(
    () => searchSuggestions(query, { products, shelves }),
    [products, query, shelves],
  );
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
  router.push('/shop');
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 280,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  scroll: {
    maxHeight: 280,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  pressed: {
    opacity: 0.82,
    backgroundColor: colors.softBackground,
  },
  photo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.softBackground,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
});
