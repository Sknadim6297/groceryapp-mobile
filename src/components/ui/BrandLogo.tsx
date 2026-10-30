import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

const logo = require('@/assets/images/brand/logo.jpg');

const LOGO_ASPECT = 1448 / 1086;

type BrandLogoProps = {
  height?: number;
};

export function BrandLogo({ height = 56 }: BrandLogoProps) {
  return (
    <Image
      source={logo}
      style={[styles.logo, { height, width: Math.round(height * LOGO_ASPECT) }]}
      contentFit="contain"
      accessibilityLabel="PhoneBook ERP"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    maxWidth: '100%',
  },
});
