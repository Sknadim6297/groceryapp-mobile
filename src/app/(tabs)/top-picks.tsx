import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/home/ProductCard';
import { DemoBanner } from '@/components/preview/DemoBanner';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { topSelling } from '@/data/homeFeed';

export default function TopPicksScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);
  const gutter = homeLayout.gutter;
  const gap = 10;
  const cardWidth = (contentWidth - gutter * 2 - gap) / 2;

  return (
    <View style={styles.screen}>
      <AppScreenHeader title="Top Picks" showBack={false} />
      <FlatList
        data={topSelling}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24), maxWidth: homeLayout.maxWidth, width: '100%', alignSelf: 'center' },
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.hero}>Popular this week</Text>
            {UI_PREVIEW_MODE ? (
              <DemoBanner message="Top Picks uses local catalogue fixtures — rankings are not live." />
            ) : (
              <Text style={styles.note}>Local spotlight products until popularity ranking is published.</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <ProductCard product={item} compact={cardWidth < 140} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.softBackground },
  content: { paddingHorizontal: homeLayout.gutter, paddingTop: 8 },
  header: { gap: 10, marginBottom: 12 },
  hero: { fontFamily: fonts.bold, fontSize: 24, color: colors.text },
  row: { gap: 10, marginBottom: 10 },
  note: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});
