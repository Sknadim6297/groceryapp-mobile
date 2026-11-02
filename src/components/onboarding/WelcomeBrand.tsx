import { StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/ui/BrandLogo';

export function WelcomeBrand() {
  return (
    <View style={styles.row}>
      <BrandLogo height={72} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    minHeight: 72,
  },
});
