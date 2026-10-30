import { Image } from 'expo-image';

const illustration = require('@/assets/images/onboarding/otp-illustration.jpg');

type OtpIllustrationProps = {
  size: number;
};

export function OtpIllustration({ size }: OtpIllustrationProps) {
  return (
    <Image
      source={illustration}
      style={{ width: size, height: Math.round(size * (510 / 552)) }}
      contentFit="contain"
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
