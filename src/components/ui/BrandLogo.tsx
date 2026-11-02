import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

const logo = require('@/assets/images/brand/logo.jpg');

const LOGO_ASPECT = 1448 / 1086;

type BrandLogoProps = {
  height?: number;
  radius?: number;
};

export function BrandLogo({ height = 56, radius = 0 }: BrandLogoProps) {
  const width = Math.round(height * LOGO_ASPECT);

  return (
    <View style={[styles.frame, radius > 0 && { borderRadius: radius }]}>
      <Image
        source={logo}
        style={{ height, width, borderRadius: radius }}
        contentFit="contain"
        accessibilityLabel="PhoneBook ERP"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    maxWidth: '100%',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
});
