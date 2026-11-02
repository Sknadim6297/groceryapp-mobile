import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

const heroImage = require('@/assets/images/onboarding/welcome-hero.jpg');

export function GroceryHero() {
  return (
    <View style={styles.frame}>
      <Image
        source={heroImage}
        style={styles.image}
        contentFit="contain"
        accessible={false}
        importantForAccessibility="no"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    marginTop: 20,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  image: {
    width: '100%',
    aspectRatio: 1.55,
  },
});
