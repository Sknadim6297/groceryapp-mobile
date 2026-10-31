import { StyleSheet, Text } from 'react-native';

import { PreviewScaffold } from '@/components/preview/PreviewScaffold';
import { colors, fonts } from '@/constants/theme';

export default function BuyAgainScreen() {
  return (
    <PreviewScaffold title="Buy again" subtitle="GroceryApp">
      <Text style={styles.note}>Buy again is not available until your past orders come from the store service.</Text>
    </PreviewScaffold>
  );
}

const styles = StyleSheet.create({
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
