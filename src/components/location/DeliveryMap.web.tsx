import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { DeliveryMapHandle, MapRegion } from '@/components/location/mapRegion';
import { OPEN_FREE_MAP_ATTRIBUTION } from '@/constants/mapStyle';
import { colors, fonts } from '@/constants/theme';

type DeliveryMapProps = {
  initialRegion: MapRegion;
  onRegionChangeComplete: (region: MapRegion, isGesture: boolean | undefined) => void;
  showsUserLocation?: boolean;
};

/** Web does not ship MapLibre Native. Native file provides the interactive map. */
export const DeliveryMap = forwardRef<DeliveryMapHandle, DeliveryMapProps>(function DeliveryMap(_props, ref) {
  useImperativeHandle(ref, () => ({
    animateToRegion() {
      // No map surface on web.
    },
  }));

  return (
    <View style={styles.fallback}>
      <Text style={styles.title}>Interactive map needs iOS or Android</Text>
      <Text style={styles.body}>
        Open this screen in a development or release build. Web does not load the native MapLibre map.
      </Text>
      <Text style={styles.attribution}>{OPEN_FREE_MAP_ATTRIBUTION}</Text>
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
  attribution: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
