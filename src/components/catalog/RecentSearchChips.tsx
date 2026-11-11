import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts, radii } from '@/constants/theme';

type RecentSearchChipsProps = {
  queries: readonly string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClearAll: () => void;
};

/** Compact MRU search history under the Shop search field. */
export function RecentSearchChips({ queries, onSelect, onRemove, onClearAll }: RecentSearchChipsProps) {
  if (queries.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap} testID="recent-searches">
      <View style={styles.head}>
        <Text style={styles.title}>Recent searches</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear all recent searches"
          hitSlop={8}
          onPress={onClearAll}
          testID="recent-searches-clear-all">
          <Text style={styles.clearAll}>Clear all</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {queries.map((query) => (
          <View key={query.toLowerCase()} style={styles.chip}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Search again for ${query}`}
              onPress={() => onSelect(query)}
              style={styles.chipTap}
              testID={`recent-search-${query}`}>
              <AppIcon name="history" color={colors.textSecondary} size={14} />
              <Text numberOfLines={1} style={styles.chipLabel}>
                {query}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove recent search ${query}`}
              hitSlop={6}
              onPress={() => onRemove(query)}
              style={styles.chipClose}>
              <AppIcon name="close" color={colors.textSecondary} size={14} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    gap: 6,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  clearAll: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger,
  },
  row: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 220,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingLeft: 10,
    paddingRight: 4,
    minHeight: 32,
  },
  chipTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: 6,
  },
  chipLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
    flexShrink: 1,
  },
  chipClose: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
