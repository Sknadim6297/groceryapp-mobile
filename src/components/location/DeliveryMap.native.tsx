import Constants from 'expo-constants';
import {
  Component,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import type { DeliveryMapHandle, MapRegion } from '@/components/location/mapRegion';
import { GOOGLE_MAPS_ATTRIBUTION } from '@/constants/mapStyle';
import { colors, fonts } from '@/constants/theme';

type DeliveryMapProps = {
  /** Used only on first mount. Later moves must go through animateToRegion. */
  initialRegion: MapRegion;
  onRegionChangeComplete: (region: MapRegion, isGesture: boolean | undefined) => void;
  /** Only enable after foreground location permission is granted. */
  showsUserLocation?: boolean;
};

type MapCrashBoundaryProps = {
  children: ReactNode;
  onCrash: () => void;
};

type MapCrashBoundaryState = {
  crashed: boolean;
};

const isExpoGo = Constants.appOwnership === 'expo';

/** Catches JS-side map failures so the location screen stays mounted. */
class MapCrashBoundary extends Component<MapCrashBoundaryProps, MapCrashBoundaryState> {
  state: MapCrashBoundaryState = { crashed: false };

  static getDerivedStateFromError(): MapCrashBoundaryState {
    return { crashed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onCrash();
  }

  render() {
    if (this.state.crashed) {
      return null;
    }
    return this.props.children;
  }
}

function MapFallback({ message }: { message: string }) {
  return (
    <View style={styles.fallback} accessibilityRole="summary">
      <Text style={styles.fallbackTitle}>Map unavailable</Text>
      <Text style={styles.fallbackBody}>{message}</Text>
      <Text style={styles.fallbackHint}>
        You can still confirm a location from search or GPS using the panel below.
      </Text>
      <Text style={styles.attribution}>{GOOGLE_MAPS_ATTRIBUTION}</Text>
    </View>
  );
}

function missingKeyMessage(): string {
  if (isExpoGo) {
    return 'Google Maps needs a development build with your API key (expo run:android / EAS). Expo Go cannot use your project key.';
  }
  return 'Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (and rebuild) so Google Maps can load.';
}

export const DeliveryMap = forwardRef<DeliveryMapHandle, DeliveryMapProps>(function DeliveryMap(
  { initialRegion, onRegionChangeComplete, showsUserLocation = false },
  ref,
) {
  const mapRef = useRef<MapView | null>(null);
  const [frozenInitial] = useState(() => initialRegion);
  const [crashed, setCrashed] = useState(false);
  const gestureActive = useRef(false);
  const hasMapsKey = Boolean(
    (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim() ||
      (Constants.expoConfig?.extra as { googleMapsConfigured?: boolean } | undefined)?.googleMapsConfigured,
  );

  useImperativeHandle(ref, () => ({
    animateToRegion(region, duration) {
      if (crashed) {
        return;
      }
      try {
        mapRef.current?.animateToRegion(region as Region, duration);
      } catch {
        // Keep the screen usable if the native camera rejects moves.
      }
    },
  }));

  if (!hasMapsKey) {
    return <MapFallback message={missingKeyMessage()} />;
  }

  if (crashed) {
    return (
      <MapFallback message="The map could not start. You can still pick a location with search or GPS." />
    );
  }

  return (
    <MapCrashBoundary onCrash={() => setCrashed(true)}>
      <View style={StyleSheet.absoluteFill}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialRegion={frozenInitial as Region}
          showsUserLocation={showsUserLocation}
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          onPanDrag={() => {
            gestureActive.current = true;
          }}
          onRegionChangeComplete={(region) => {
            const isGesture = gestureActive.current;
            gestureActive.current = false;
            onRegionChangeComplete(
              {
                latitude: region.latitude,
                longitude: region.longitude,
                latitudeDelta: region.latitudeDelta,
                longitudeDelta: region.longitudeDelta,
              },
              isGesture,
            );
          }}
        />
      </View>
    </MapCrashBoundary>
  );
});

const styles = StyleSheet.create({
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
    backgroundColor: colors.softBackground,
  },
  fallbackTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  fallbackBody: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
    textAlign: 'center',
  },
  fallbackHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  attribution: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
