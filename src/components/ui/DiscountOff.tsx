import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

type DiscountOffProps = {
  label: string;
  /** Sit in the text column instead of over the photo. */
  inline?: boolean;
  /** `deal` = blue ribbon (listing cards). Default green for product detail. */
  tone?: 'success' | 'deal';
};

/** “9% OFF” badge — overlay on photo or inline in the text column. */
export function DiscountOff({ label, inline = false, tone = 'success' }: DiscountOffProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.badge,
        tone === 'deal' ? styles.deal : styles.success,
        inline ? styles.inline : styles.overlay,
      ]}>
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  success: {
    backgroundColor: colors.success,
  },
  deal: {
    backgroundColor: '#2563EB',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 8,
  },
  inline: {
    marginBottom: 2,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.white,
  },
});
