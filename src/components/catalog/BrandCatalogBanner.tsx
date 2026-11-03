import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { colors } from '@/constants/theme';

const groceryArt = require('@/assets/images/home/banner-produce.jpg');

/** Shared Mayapur Bazaar yellow banner for Shop / Subcategories listing chrome. */
export function BrandCatalogBanner() {
  return (
    <View style={styles.wrap} accessibilityRole="image" accessibilityLabel="Mayapur Bazaar">
      <View style={styles.blobLeft} />
      <View style={styles.blobRight} />
      <View style={styles.row}>
        <View style={styles.logoBadge}>
          <BrandLogo height={44} radius={12} />
        </View>
        <Image source={groceryArt} style={styles.art} contentFit="cover" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: colors.brightYellow,
    overflow: 'hidden',
    minHeight: 88,
    justifyContent: 'center',
  },
  blobLeft: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.18)',
    left: -36,
    top: -48,
  },
  blobRight: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(234,179,8,0.35)',
    right: -20,
    bottom: -40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  logoBadge: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  art: {
    width: 112,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
});
