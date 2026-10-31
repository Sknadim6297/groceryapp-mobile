import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { DeliveryHeader } from '@/components/home/DeliveryHeader';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { LIVE_CATALOGUE_CONNECTED } from '@/constants/liveData';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.column, { width: contentWidth }]}>
          <DeliveryHeader />
          {LIVE_CATALOGUE_CONNECTED ? null : (
            <View style={styles.unavailable}>
              <Text style={styles.unavailableTitle}>Catalogue unavailable</Text>
              <Text style={styles.unavailableBody}>
                Products, prices, and offers are not shown until the store service confirms them. Nothing here is a live
                price or a delivery promise.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.softBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: 12,
  },
  column: {
    backgroundColor: colors.softBackground,
    flexGrow: 1,
  },
  unavailable: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    gap: 6,
  },
  unavailableTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  unavailableBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
