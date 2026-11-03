import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DeliveryMapHandle, MapRegion } from '@/components/location/mapRegion';
import { colors, fonts } from '@/constants/theme';

type DeliveryMapProps = {
  initialRegion: MapRegion;
  onRegionChangeComplete: (region: MapRegion, isGesture: boolean | undefined) => void;
};

/** Web has no react-native-maps. Native file provides the real map. */
export const DeliveryMap = forwardRef<DeliveryMapHandle, DeliveryMapProps>(function DeliveryMap(_props, ref) {
  useImperativeHandle(ref, () => ({
    animateToRegion() {
      // No map surface on web.
    },
  }));

  return (
    <View style={styles.fallback}>
      <Text style={styles.title}>Interactive map needs iOS or Android</Text>
      <Text style={styles.body}>Open this screen in Expo Go. Web does not load the native map.</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: colors.softBackground,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
