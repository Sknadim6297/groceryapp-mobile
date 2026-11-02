import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

type DiscountOffProps = {
  label: string;
  inline?: boolean;
};

/** Solid green “20% OFF” label. `inline` sits in the text column so a narrow photo cannot clip it. */
export function DiscountOff({ label, inline = false }: DiscountOffProps) {
  return (
    <View pointerEvents="none" style={[styles.badge, inline ? styles.inline : styles.overlay]}>
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
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  overlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 2,
  },
  inline: {
    marginBottom: 2,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.white,
  },
});
