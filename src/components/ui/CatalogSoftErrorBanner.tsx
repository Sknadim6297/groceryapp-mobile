import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii, space } from '@/constants/theme';

type CatalogSoftErrorBannerProps = {
  message: string | null;
  onRetry?: () => void;
  retrying?: boolean;
};

/**
 * Non-destructive refresh failure: keep product cards visible, show a compact retry strip.
 */
export function CatalogSoftErrorBanner({ message, onRetry, retrying = false }: CatalogSoftErrorBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry catalogue refresh"
          disabled={retrying}
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, (pressed || retrying) && styles.retryPressed]}>
          <Text style={styles.retryLabel}>{retrying ? 'Retrying…' : 'Retry'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    borderRadius: radii.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  text: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  retry: {
    minHeight: 40,
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xs,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  retryPressed: {
    opacity: 0.7,
  },
  retryLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger,
  },
});
