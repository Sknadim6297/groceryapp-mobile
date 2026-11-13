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
  type DeliveryMapHandle,
  type MapRegion,
  zoomFromLatitudeDelta,
} from '@/components/location/mapRegion';
import { GOOGLE_MAPS_ATTRIBUTION } from '@/constants/mapStyle';
import { colors, fonts } from '@/constants/theme';

type DeliveryMapProps = {
  /** Used only on first mount. Later moves must go through animateToRegion. */
  initialRegion: MapRegion;
  onRegionChangeComplete: (region: MapRegion, isGesture: boolean | undefined) => void;
  /** Only enable after foreground location permission is granted. */
  showsUserLocation?: boolean;
};

type GoogleMapsNamespace = {
  Map: new (
    el: HTMLElement,
    opts: {
      center: { lat: number; lng: number };
      zoom: number;
      disableDefaultUI?: boolean;
      gestureHandling?: string;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
    },
  ) => GoogleMapInstance;
  event: {
    addListener: (target: unknown, name: string, handler: () => void) => { remove: () => void };
  };
};

type GoogleMapInstance = {
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  getCenter: () => { lat: () => number; lng: () => number } | undefined;
  getZoom: () => number | undefined;
};

declare global {
  // eslint-disable-next-line no-var -- Google Maps bootstrap attaches to window
  var google: { maps?: GoogleMapsNamespace } | undefined;
}

const SCRIPT_ID = 'mayapur-google-maps-js';

function googleMapsApiKey(): string {
  return (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();
}

function loadGoogleMapsScript(apiKey: string): Promise<GoogleMapsNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('no-window'));
  }
  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google.maps);
  }

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const poll = () => {
        if (window.google?.maps?.Map) {
          resolve(window.google.maps);
          return;
        }
        if (Date.now() - started > 15_000) {
          reject(new Error('Google Maps script timeout'));
          return;
        }
        requestAnimationFrame(poll);
      };
      poll();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      '&v=weekly&libraries=places';
    script.onload = () => {
      if (window.google?.maps?.Map) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps failed to initialize'));
      }
    };
    script.onerror = () => reject(new Error('Google Maps script failed to load'));
    document.head.appendChild(script);
  });
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

/**
 * Interactive Google Maps surface for Expo web via Maps JavaScript API.
 * Native Google Maps stays in DeliveryMap.native — camera/region helpers stay in mapRegion.ts.
 */
export const DeliveryMap = forwardRef<DeliveryMapHandle, DeliveryMapProps>(function DeliveryMap(
  { initialRegion, onRegionChangeComplete, showsUserLocation: _showsUserLocation = false },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const initialRegionRef = useRef(initialRegion);
  const onRegionChangeCompleteRef = useRef(onRegionChangeComplete);
  const programmaticUntil = useRef(0);
  const [failed, setFailed] = useState(false);
  const [missingKey] = useState(() => !googleMapsApiKey());

  useEffect(() => {
    onRegionChangeCompleteRef.current = onRegionChangeComplete;
  }, [onRegionChangeComplete]);

  useImperativeHandle(ref, () => ({
    animateToRegion(region, duration) {
      const map = mapRef.current;
      if (!map) {
        return;
      }
      programmaticUntil.current = Date.now() + Math.max(duration, 200);
      map.setCenter({ lat: region.latitude, lng: region.longitude });
      map.setZoom(zoomFromLatitudeDelta(region.latitudeDelta));
    },
  }));

  useEffect(() => {
    if (typeof document === 'undefined' || missingKey) {
      return;
    }

    let cancelled = false;
    let dragListener: { remove: () => void } | null = null;
    let idleListener: { remove: () => void } | null = null;
    let map: GoogleMapInstance | null = null;

    void (async () => {
      try {
        const maps = await loadGoogleMapsScript(googleMapsApiKey());
        if (cancelled || !containerRef.current) {
          return;
        }
        const start = initialRegionRef.current;
        map = new maps.Map(containerRef.current, {
          center: { lat: start.latitude, lng: start.longitude },
          zoom: zoomFromLatitudeDelta(start.latitudeDelta),
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;

        let userGesture = false;
        dragListener = maps.event.addListener(map, 'dragstart', () => {
          userGesture = true;
        });
        idleListener = maps.event.addListener(map, 'idle', () => {
          const center = map?.getCenter();
          const zoom = map?.getZoom();
          if (!center || zoom == null) {
            return;
          }
          const isProgrammatic = Date.now() < programmaticUntil.current;
          const isGesture = userGesture && !isProgrammatic;
          userGesture = false;
          const latitudeDelta = 360 / 2 ** Math.min(20, Math.max(1, zoom));
          onRegionChangeCompleteRef.current(
            {
              latitude: center.lat(),
              longitude: center.lng(),
              latitudeDelta,
              longitudeDelta: latitudeDelta,
            },
            isGesture,
          );
        });
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      dragListener?.remove();
      idleListener?.remove();
      mapRef.current = null;
    };
  }, [missingKey]);

  if (missingKey) {
    return (
      <MapFallback message="Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env so the web map can load." />
    );
  }

  if (failed) {
    return (
      <MapFallback message="Google Maps could not load. Check the API key, Maps JavaScript API enablement, and billing." />
    );
  }

  return createElement('div', {
    ref: containerRef,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
    },
  });
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
