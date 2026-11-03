import { forwardRef, useImperativeHandle, useRef } from 'react';
import MapView, { type Region } from 'react-native-maps';
import { StyleSheet } from 'react-native';

import type { DeliveryMapHandle, MapRegion } from '@/components/location/mapRegion';

type DeliveryMapProps = {
  /** Used only on first mount. Later moves must go through animateToRegion. */
  initialRegion: MapRegion;
  onRegionChangeComplete: (region: MapRegion, isGesture: boolean | undefined) => void;
};

export const DeliveryMap = forwardRef<DeliveryMapHandle, DeliveryMapProps>(function DeliveryMap(
  { initialRegion, onRegionChangeComplete },
  ref,
) {
  const mapRef = useRef<MapView | null>(null);
  const initialRegionRef = useRef(initialRegion);

  useImperativeHandle(ref, () => ({
    animateToRegion(region, duration) {
      mapRef.current?.animateToRegion(region as Region, duration);
    },
  }));

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegionRef.current}
      onRegionChangeComplete={(next, details) => {
        onRegionChangeComplete(next, details?.isGesture);
      }}
      showsUserLocation
      showsMyLocationButton={false}
      followsUserLocation={false}
      rotateEnabled={false}
      pitchEnabled={false}
      moveOnMarkerPress={false}
    />
  );
});
