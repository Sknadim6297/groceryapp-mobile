import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { SectionHeader } from '@/components/home/SectionHeader';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';

const snacks = require('@/assets/images/home/cutouts/snacks-drinks.png');
const produce = require('@/assets/images/home/cutouts/produce-offer.png');

const offers = [
  { id: 'groceries', title: 'Up to\n50% OFF', detail: 'On Groceries', color: '#FCE7F3', image: produce },
  { id: 'snacks', title: 'Buy 2 Get 1\nFREE', detail: 'On Snacks', color: '#E0F2FE', image: snacks },
  { id: 'flat', title: 'Flat\n₹100 OFF', detail: 'On Orders\nAbove ₹999', color: '#DCFCE7', image: null },
] as const;

export function OfferRow() {
  return (
    <View style={styles.section}>
      <SectionHeader title="Best Offers for You" />
      <View style={styles.row}>
        {offers.map((offer) => (
          <Pressable
            key={offer.id}
            accessibilityRole="button"
            accessibilityLabel={`${offer.title.replace('\n', ' ')}. Demo offer.`}
            onPress={() => router.push('/shop')}
            style={({ pressed }) => [styles.card, { backgroundColor: offer.color }, pressed && styles.pressed]}>
            <Text style={styles.title}>{offer.title}</Text>
            <Text style={styles.detail}>{offer.detail}</Text>
            {offer.image ? (
              <CatalogImage source={offer.image} style={styles.image} />
            ) : (
              <View style={styles.percent}>
                <AppIcon name="percent" color={colors.success} size={22} />
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 118,
    borderRadius: 16,
    padding: 10,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    color: colors.text,
  },
  detail: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  image: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 64,
    height: 56,
  },
  percent: {
    position: 'absolute',
    right: 8,
    bottom: 8,
  },
});
