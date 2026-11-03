import { StyleSheet, Text, View } from 'react-native';

import { DEMO_BANNER_LABEL } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';

export function DemoBanner({ message = DEMO_BANNER_LABEL }: { message?: string }) {
  return (
    <View style={styles.banner} accessibilityRole="text">
      <Text style={styles.label}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    backgroundColor: colors.softYellow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
    textAlign: 'center',
  },
});
