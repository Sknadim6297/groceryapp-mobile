import { Image, type ImageSource } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { colors, fonts, homeLayout } from '@/constants/theme';

type OfferSlide = {
  id: string;
  title: string;
  line: string;
  detail: string;
  badge: string;
  image: ImageSource;
};

const slides: OfferSlide[] = [
  {
    id: 'new-users',
    title: '50% OFF',
    line: 'Special Offer: Get 50%',
    detail: 'Cashback + Free Delivery',
    badge: 'NEW USERS',
    image: require('@/assets/images/home/banner-produce.jpg'),
  },
  {
    id: 'fresh',
    title: 'FRESH PICKS',
    line: 'Fruits and vegetables',
    detail: 'Handpicked for today',
    badge: 'DAILY',
    image: require('@/assets/images/home/fresh-fruits.jpg'),
  },
];

export function NewUserOffers() {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width, homeLayout.maxWidth) - 48;

  return (
    <View style={styles.section}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + 12}
        snapToAlignment="start"
        contentContainerStyle={styles.row}>
        {slides.map((slide) => (
          <View
            key={slide.id}
            accessibilityRole="summary"
            accessibilityLabel={`${slide.title}. ${slide.line} ${slide.detail}. ${slide.badge}. Displayed offer.`}
            style={[styles.card, { width: cardWidth }]}>
            <View style={styles.copy}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.line}>{slide.line}</Text>
              <Text style={styles.line}>{slide.detail}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeLabel}>{slide.badge}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Shop now. ${slide.title}`}
                onPress={() => router.push('/shop')}
                style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
                <Text style={styles.buttonLabel}>SHOP NOW</Text>
              </Pressable>
            </View>
            <Image source={slide.image} style={styles.photo} contentFit="cover" contentPosition="right center" accessible={false} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 18,
    paddingBottom: 8,
  },
  row: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    height: 168,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.brightYellow,
  },
  copy: {
    width: '62%',
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    zIndex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 32,
    color: colors.text,
  },
  line: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 17,
    color: colors.text,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderRadius: 6,
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.4,
    color: colors.white,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: 8,
    minHeight: 32,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    color: colors.text,
  },
  pressed: {
    opacity: 0.8,
  },
  photo: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '48%',
    height: '100%',
  },
});
