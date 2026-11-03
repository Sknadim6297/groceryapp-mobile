import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { BRAND_LOGO_ASPECT, BRAND_NAME, brandLogo } from '@/constants/brand';

type BrandLogoProps = {
  height?: number;
  radius?: number;
};

export function BrandLogo({ height = 56, radius = 12 }: BrandLogoProps) {
  const width = Math.round(height * BRAND_LOGO_ASPECT);

  return (
    <View style={[styles.frame, radius > 0 && { borderRadius: radius }]}>
      <Image
        source={brandLogo}
        style={{ height, width, borderRadius: radius }}
        contentFit="contain"
        accessibilityLabel={BRAND_NAME}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    maxWidth: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});
