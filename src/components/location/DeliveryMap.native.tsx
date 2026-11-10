import Constants from 'expo-constants';
import {
  Component,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { StyleSheet, Text, TurboModuleRegistry, View } from 'react-native';

import {
  latitudeDeltaFromZoom,
  type DeliveryMapHandle,
  type MapRegion,
  zoomFromLatitudeDelta,
} from '@/components/location/mapRegion';
import { OPEN_FREE_MAP_ATTRIBUTION, OPEN_FREE_MAP_STYLE_URL } from '@/constants/mapStyle';
import { colors, fonts } from '@/constants/theme';

type DeliveryMapProps = {
  /** Used only on first mount. Later moves must go through animateToRegion. */
  initialRegion: MapRegion;
  onRegionChangeComplete: (region: MapRegion, isGesture: boolean | undefined) => void;
  /** Only enable after foreground location permission is granted. */
  showsUserLocation?: boolean;
};

/** Avoid static imports from MapLibre — its entrypoint enforces TurboModules at load. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic native map surface
type MapLibreRuntime = {
  Map: ComponentType<any>;
  Camera: ComponentType<any>;
  UserLocation: ComponentType<any>;
};

type CameraHandle = {
  easeTo: (options: {
    center: [number, number];
    zoom: number;
    duration: number;
    easing: 'ease';
  }) => void;
};

type MapCrashBoundaryProps = {
  children: ReactNode;
  onCrash: () => void;
};

type MapCrashBoundaryState = {
  crashed: boolean;
};

/**
 * MapLibre TurboModules are only present in a native build that includes the
 * `@maplibre/maplibre-react-native` config plugin (not Expo Go). Probe before
 * requiring the package — its entrypoint calls getEnforcing() at import time.
 */
function loadMapLibreRuntime(): MapLibreRuntime | null {
  try {
    if (TurboModuleRegistry.get('MLRNCameraModule') == null) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- must stay dynamic
    return require('@maplibre/maplibre-react-native') as MapLibreRuntime;
  } catch {
    return null;
  }
}

const mapLibre = loadMapLibreRuntime();
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
      <Text style={styles.attribution}>{OPEN_FREE_MAP_ATTRIBUTION}</Text>
    </View>
  );
}

function missingNativeMessage(): string {
  if (isExpoGo) {
    return 'Interactive maps need a native Mayapur Bazaar build (expo run:android / EAS APK), not Expo Go.';
  }
  return 'Map native modules are missing. Rebuild with MapLibre enabled (not the slim ui-preview profile).';
}

export const DeliveryMap = forwardRef<DeliveryMapHandle, DeliveryMapProps>(function DeliveryMap(
  { initialRegion, onRegionChangeComplete, showsUserLocation = false },
  ref,
) {
  const mapRef = useRef<unknown>(null);
  const cameraRef = useRef<CameraHandle | null>(null);
  const initialRegionRef = useRef(initialRegion);
  const [crashed, setCrashed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const nativeMissing = mapLibre == null;

  useImperativeHandle(ref, () => ({
    animateToRegion(region, duration) {
      if (nativeMissing || crashed || loadFailed) {
        return;
      }
      try {
        const zoom = zoomFromLatitudeDelta(region.latitudeDelta);
        cameraRef.current?.easeTo({
          center: [region.longitude, region.latitude],
          zoom,
          duration,
          easing: 'ease',
        });
      } catch {
        // Keep the screen usable if the native camera rejects moves.
      }
    },
  }));

  if (nativeMissing) {
    return <MapFallback message={missingNativeMessage()} />;
  }

  if (crashed || loadFailed) {
    return (
      <MapFallback
        message={
          loadFailed
            ? 'The free map style could not load. Check your internet connection and try again.'
            : 'The map could not start. You can still pick a location with search or GPS.'
        }
      />
    );
  }

  const { Map, Camera, UserLocation } = mapLibre;
  const initialZoom = zoomFromLatitudeDelta(initialRegionRef.current.latitudeDelta);

  return (
    <MapCrashBoundary onCrash={() => setCrashed(true)}>
      <View style={StyleSheet.absoluteFill}>
        <Map
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          mapStyle={OPEN_FREE_MAP_STYLE_URL}
          attribution
          attributionPosition={{ bottom: 8, left: 8 }}
          logo={false}
          compass={false}
          scaleBar={false}
          touchRotate={false}
          touchPitch={false}
          onDidFinishLoadingMap={() => {
            setReady(true);
            setLoadFailed(false);
          }}
          onDidFailLoadingMap={() => {
            setLoadFailed(true);
          }}
          onRegionDidChange={(event: { nativeEvent?: { center?: unknown; zoom?: number; userInteraction?: boolean } }) => {
            const payload = event.nativeEvent;
            if (!payload) {
              return;
            }
            const center = payload.center;
            if (!Array.isArray(center) || center.length < 2) {
              return;
            }
            const longitude = Number(center[0]);
            const latitude = Number(center[1]);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              return;
            }
            const zoom = typeof payload.zoom === 'number' ? payload.zoom : initialZoom;
            const latitudeDelta = latitudeDeltaFromZoom(zoom);
            onRegionChangeComplete(
              {
                latitude,
                longitude,
                latitudeDelta,
                longitudeDelta: latitudeDelta,
              },
              payload.userInteraction === true,
            );
          }}>
          <Camera
            ref={cameraRef}
            initialViewState={{
              center: [initialRegionRef.current.longitude, initialRegionRef.current.latitude],
              zoom: initialZoom,
            }}
          />
          {showsUserLocation && ready ? <UserLocation animated accuracy /> : null}
        </Map>
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
