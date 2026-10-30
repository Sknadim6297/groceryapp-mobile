import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

const heroImage = require('@/assets/images/onboarding/welcome-hero.jpg');

export function GroceryHero() {
  return (
    <Image
      source={heroImage}
      style={styles.image}
      contentFit="cover"
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    marginTop: 22,
    borderRadius: 28,
  },
});
