import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

export type CatalogBreadcrumbCrumb = {
  label: string;
  onPress?: () => void;
};

type CatalogBreadcrumbProps = {
  crumbs: CatalogBreadcrumbCrumb[];
};

/** Shop > Category style trail used on catalogue listing screens. */
export function CatalogBreadcrumb({ crumbs }: CatalogBreadcrumbProps) {
  if (crumbs.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap} accessibilityRole="text">
      {crumbs.map((crumb, index) => {
        const last = index === crumbs.length - 1;
        return (
          <View key={`${crumb.label}-${index}`} style={styles.piece}>
            {index > 0 ? <Text style={styles.sep}>{' > '}</Text> : null}
            {crumb.onPress ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={crumb.label}
                onPress={crumb.onPress}
                hitSlop={6}
                style={({ pressed }) => pressed && styles.pressed}>
                <Text style={last ? styles.current : styles.muted} numberOfLines={1}>
                  {crumb.label}
                </Text>
              </Pressable>
            ) : (
              <Text style={last ? styles.current : styles.muted} numberOfLines={1}>
                {crumb.label}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  piece: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  muted: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  sep: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  current: {
    flexShrink: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  pressed: {
    opacity: 0.7,
  },
});
