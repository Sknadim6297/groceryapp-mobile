import { StyleSheet, Text, View } from 'react-native';

import { SoftIcon } from '@/components/ui/SoftIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts, radii, space } from '@/constants/theme';
import { CATALOGUE_NETWORK_ERROR_HINT } from '@/utils/networkConnectivity';

const DEFAULT_ERROR = CATALOGUE_NETWORK_ERROR_HINT;

type CatalogStatusPanelProps = {
  kind: 'error' | 'empty';
  title?: string;
  message?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
};

/** Friendly catalog empty / network-error panel with optional Retry. */
export function CatalogStatusPanel({
  kind,
  title,
  message,
  onRetry,
  retryLabel = 'Retry',
  retrying = false,
}: CatalogStatusPanelProps) {
  const resolvedTitle =
    title ?? (kind === 'empty' ? 'No products yet' : 'Something went wrong');
  const resolvedMessage =
    (message && message.trim()) ||
    (kind === 'empty'
      ? 'Nothing is available for this store right now.'
      : DEFAULT_ERROR);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <SoftIcon name={kind === 'empty' ? 'basket' : 'box'} size={56} />
      <Text style={styles.title}>{resolvedTitle}</Text>
      <Text style={styles.body}>{resolvedMessage}</Text>
      {onRetry ? (
        <View style={styles.action}>
          <PrimaryButton
            label={retryLabel}
            accessibilityLabel={retryLabel}
            loading={retrying}
            onPress={onRetry}
            showArrow={false}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.xxl,
    gap: space.sm,
  },
  title: {
    marginTop: space.sm,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  action: {
    marginTop: space.md,
    minWidth: 160,
    borderRadius: radii.md,
  },
});
