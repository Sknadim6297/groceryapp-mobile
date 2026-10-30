import { Image } from 'expo-image';

const basketImage = require('@/assets/images/onboarding/basket-auth.jpg');

type AuthIllustrationProps = {
  size: number;
};

export function AuthIllustration({ size }: AuthIllustrationProps) {
  return (
    <Image
      source={basketImage}
      style={{ width: size, aspectRatio: 761 / 689 }}
      contentFit="contain"
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
