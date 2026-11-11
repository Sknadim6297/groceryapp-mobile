import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

type MapLibreMap = import('maplibre-gl').Map;

const MAPLIBRE_CSS_ID = 'mayapur-maplibre-gl-css';

function ensureMapLibreStylesheet(): void {
  if (typeof document === 'undefined') {
    return;
  }
  if (document.getElementById(MAPLIBRE_CSS_ID)) {
    return;
  }
  const link = document.createElement('link');
  link.id = MAPLIBRE_CSS_ID;
  link.rel = 'stylesheet';
  // Bundled CSS via CDN keeps SSR free of Node ESM/CSS edge cases; version matches package.json.
  link.href = 'https://unpkg.com/maplibre-gl@6.17.0/dist/maplibre-gl.css';
  document.head.appendChild(link);
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

/**
 * Interactive OpenFreeMap surface for Expo web via MapLibre GL JS.
 * Native MapLibre stays in DeliveryMap.native — camera/region helpers stay in mapRegion.ts.
 */
export const DeliveryMap = forwardRef<DeliveryMapHandle, DeliveryMapProps>(function DeliveryMap(
  { initialRegion, onRegionChangeComplete, showsUserLocation: _showsUserLocation = false },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initialRegionRef = useRef(initialRegion);
  const onRegionChangeCompleteRef = useRef(onRegionChangeComplete);
  const programmaticUntil = useRef(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onRegionChangeCompleteRef.current = onRegionChangeComplete;
  }, [onRegionChangeComplete]);

  useImperativeHandle(ref, () => ({
    animateToRegion(region, duration) {
      const map = mapRef.current;
      if (!map || failed) {
        return;
      }
      try {
        programmaticUntil.current = Date.now() + Math.max(duration, 200) + 120;
        map.easeTo({
          center: [region.longitude, region.latitude],
          zoom: zoomFromLatitudeDelta(region.latitudeDelta),
          duration,
          essential: true,
        });
      } catch {
        // Keep the screen usable if the camera rejects moves.
      }
    },
  }));

  useEffect(() => {
    // SSR / non-DOM environments never touch MapLibre globals.
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let map: MapLibreMap | null = null;
    let styleLoadTimer: ReturnType<typeof setTimeout> | null = null;

    const emitRegion = (isGesture: boolean) => {
      if (!map) {
        return;
      }
      const center = map.getCenter();
      const zoom = map.getZoom();
      const latitudeDelta = latitudeDeltaFromZoom(zoom);
      onRegionChangeCompleteRef.current(
        {
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta,
          longitudeDelta: latitudeDelta,
        },
        isGesture,
      );
    };

    void (async () => {
      try {
        ensureMapLibreStylesheet();
        const maplibre = await import('maplibre-gl');
        if (cancelled || !containerRef.current) {
          return;
        }

        const initialZoom = zoomFromLatitudeDelta(initialRegionRef.current.latitudeDelta);
        map = new maplibre.Map({
          container: containerRef.current,
          style: OPEN_FREE_MAP_STYLE_URL,
          center: [initialRegionRef.current.longitude, initialRegionRef.current.latitude],
          zoom: initialZoom,
          attributionControl: { compact: true },
          pitchWithRotate: false,
          dragRotate: false,
        });
        mapRef.current = map;

        map.on('load', () => {
          if (cancelled) {
            return;
          }
          if (styleLoadTimer) {
            clearTimeout(styleLoadTimer);
            styleLoadTimer = null;
          }
          setFailed(false);
          map?.resize();
        });

        map.on('error', () => {
          if (!cancelled) {
            setFailed(true);
          }
        });

        // Style fetch can fail without crashing the page — surface a soft fallback.
        styleLoadTimer = setTimeout(() => {
          if (!cancelled && map && !map.isStyleLoaded()) {
            setFailed(true);
          }
        }, 12_000);

        map.on('moveend', () => {
          const programmatic = Date.now() < programmaticUntil.current;
          emitRegion(!programmatic);
        });

        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
          resizeObserver = new ResizeObserver(() => {
            map?.resize();
          });
          resizeObserver.observe(containerRef.current);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (styleLoadTimer) {
        clearTimeout(styleLoadTimer);
      }
      resizeObserver?.disconnect();
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {createElement('div', {
        ref: containerRef,
        style: {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          // Keep the WebGL container mounted even when showing the soft fallback.
          visibility: failed ? 'hidden' : 'visible',
        },
        'aria-label': 'Delivery location map',
        'aria-hidden': failed ? true : undefined,
      })}
      {failed ? (
        <MapFallback message="The free map style could not load. Check your internet connection and try again." />
      ) : null}
    </View>
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
