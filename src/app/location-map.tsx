import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeliveryMap } from '@/components/location/DeliveryMap';
import { LocationFlowHeader } from '@/components/location/LocationFlowHeader';
import type { DeliveryMapHandle, MapRegion } from '@/components/location/mapRegion';
import { AppIcon } from '@/components/ui/AppIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useToast } from '@/components/ui/AppToast';
import { colors, fonts, homeLayout } from '@/constants/theme';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { formatDeliveryAddress } from '@/data/referenceLocations';
import { useConfirmDeliveryLocation } from '@/hooks/useConfirmDeliveryLocation';
import { locationRoutes } from '@/navigation/locationRoutes';
import { readCurrentLocation, reverseGeocodeCoords } from '@/services/location/locationService';
import type { DeliveryLocation } from '@/types/location';
import { distanceKmBetween, formatDistanceKm } from '@/utils/deliveryAddress';
import { isValidMapCoordinate, regionsNearlyEqual } from '@/utils/mapCameraGuards';
import { openExternalNavigation } from '@/utils/openExternalNavigation';

/** Default to Mayapur / Nadia — not Kolkata CBD — when no prior selection. */
const DEFAULT_REGION: MapRegion = {
  latitude: 23.4241,
  longitude: 88.3915,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

const REVERSE_DEBOUNCE_MS = 450;
const PROGRAMMATIC_LOCK_MS = 700;

function buildInitialRegion(selection: DeliveryLocation | null): MapRegion {
  if (isValidMapCoordinate(selection?.latitude, selection?.longitude)) {
    return {
      latitude: selection!.latitude!,
      longitude: selection!.longitude!,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };
  }
  return DEFAULT_REGION;
}

export default function LocationMapScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { selection, setSelection } = useDeliveryLocation();
  const { confirmLocation, isBusy } = useConfirmDeliveryLocation();
  const mapRef = useRef<DeliveryMapHandle | null>(null);
  const reverseRequestId = useRef(0);
  const reverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const programmaticUntil = useRef(0);
  const lastResolvedCoords = useRef<{ latitude: number; longitude: number } | null>(
    isValidMapCoordinate(selection?.latitude, selection?.longitude)
      ? { latitude: selection!.latitude!, longitude: selection!.longitude! }
      : null,
  );
  const gpsInFlight = useRef(false);

  // initialRegion is captured once — never fed back from onRegionChangeComplete.
  const [initialRegion] = useState<MapRegion>(() => buildInitialRegion(selection));
  const [preview, setPreview] = useState<DeliveryLocation | null>(selection);
  const [deviceOrigin, setDeviceOrigin] = useState<DeliveryLocation | null>(
    selection?.source === 'gps' ? selection : null,
  );
  const [resolving, setResolving] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [query, setQuery] = useState(selection?.locality || selection?.label || '');
  const [pendingRetry, setPendingRetry] = useState<MapRegion | null>(null);
  const [userLocationEnabled, setUserLocationEnabled] = useState(false);

  const distanceKm = deviceOrigin && preview ? distanceKmBetween(deviceOrigin, preview) : null;
  const accuracyLabel = Platform.OS === 'web' ? 'Browser' : 'GPS';

  // Warm permission once so the MapLibre user location layer can show without crashing on deny.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { status } = await import('expo-location').then((Location) =>
          Location.getForegroundPermissionsAsync(),
        );
        if (!cancelled && status === 'granted') {
          setUserLocationEnabled(true);
        }
      } catch {
        // Permission probe failed — keep showsUserLocation off.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (reverseTimer.current) {
        clearTimeout(reverseTimer.current);
      }
      reverseRequestId.current += 1;
    };
  }, []);

  const applyResolved = useCallback(
    (location: DeliveryLocation, coords: { latitude: number; longitude: number }) => {
      if (!mounted.current) {
        return;
      }
      lastResolvedCoords.current = coords;
      // Reverse geocode must never rewrite the pin coordinates.
      const pinned: DeliveryLocation = {
        ...location,
        latitude: coords.latitude,
        longitude: coords.longitude,
        fixKind:
          location.source === 'gps'
            ? location.fixKind
            : location.source === 'map'
              ? 'map-pin'
              : location.fixKind,
      };
      setPreview(pinned);
      setSelection(pinned);
      setQuery(pinned.locality || pinned.label);
      setGeocodeError(null);
      setPendingRetry(null);
      if (__DEV__) {
        // eslint-disable-next-line no-console -- intentional map/GPS diagnostics
        console.info('[location-map:preview]', {
          source: pinned.source,
          fixKind: pinned.fixKind,
          lat: pinned.latitude,
          lng: pinned.longitude,
          accuracyMeters: pinned.accuracyMeters,
          fixAgeMs: pinned.fixAgeMs,
          approximate: pinned.approximate,
          note: pinned.fixNote,
          platform: Platform.OS,
        });
      }
    },
    [setSelection],
  );

  const runReverseGeocode = useCallback(
    async (next: MapRegion, source: DeliveryLocation['source']) => {
      if (!isValidMapCoordinate(next.latitude, next.longitude)) {
        return;
      }
      if (lastResolvedCoords.current && regionsNearlyEqual(lastResolvedCoords.current, next)) {
        return;
      }

      const requestId = ++reverseRequestId.current;
      if (mounted.current) {
        setResolving(true);
        setGeocodeError(null);
      }

      try {
        const outcome = await reverseGeocodeCoords(next.latitude, next.longitude, source);
        if (!mounted.current || requestId !== reverseRequestId.current) {
          return;
        }
        if (outcome.status !== 'ready') {
          // Keep the pin and last preview; do not reset the camera.
          setGeocodeError('Address could not be resolved. You can retry or Set Location with coordinates.');
          setPendingRetry(next);
          return;
        }
        applyResolved(outcome.location, { latitude: next.latitude, longitude: next.longitude });
      } catch {
        if (!mounted.current || requestId !== reverseRequestId.current) {
          return;
        }
        setGeocodeError('Address lookup failed. Retry when the network is available.');
        setPendingRetry(next);
      } finally {
        if (mounted.current && requestId === reverseRequestId.current) {
          setResolving(false);
        }
      }
    },
    [applyResolved],
  );

  const scheduleReverseGeocode = useCallback(
    (next: MapRegion, source: DeliveryLocation['source'], debounceMs = REVERSE_DEBOUNCE_MS) => {
      if (reverseTimer.current) {
        clearTimeout(reverseTimer.current);
      }
      reverseTimer.current = setTimeout(() => {
        void runReverseGeocode(next, source);
      }, debounceMs);
    },
    [runReverseGeocode],
  );

  const centerMapOnce = useCallback((coords: { latitude: number; longitude: number }) => {
    const nextRegion: MapRegion = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    programmaticUntil.current = Date.now() + PROGRAMMATIC_LOCK_MS;
    mapRef.current?.animateToRegion(nextRegion, 420);
    return nextRegion;
  }, []);

  const onRegionChangeComplete = useCallback(
    (next: MapRegion, isGesture: boolean | undefined) => {
      if (!isValidMapCoordinate(next.latitude, next.longitude)) {
        return;
      }

      const programmatic = Date.now() < programmaticUntil.current;
      // Prefer explicit gesture flag when the map provides it (native + web MapLibre).
      if (isGesture === false || (isGesture === undefined && programmatic)) {
        // Programmatic settle after GPS/search center — only resolve if we lack a preview.
        if (!preview || !lastResolvedCoords.current) {
          scheduleReverseGeocode(next, 'map', 120);
        }
        return;
      }

      if (lastResolvedCoords.current && regionsNearlyEqual(lastResolvedCoords.current, next)) {
        return;
      }

      scheduleReverseGeocode(next, 'map');
    },
    [preview, scheduleReverseGeocode],
  );

  async function goToCurrentLocation() {
    if (isBusy() || confirming || gpsInFlight.current || fetchingGps) {
      return;
    }
    gpsInFlight.current = true;
    setFetchingGps(true);
    setGeocodeError(null);
    try {
      const outcome = await readCurrentLocation();
      if (!mounted.current) {
        return;
      }
      const hasFix =
        (outcome.status === 'ready' || outcome.status === 'approximate-permission') &&
        isValidMapCoordinate(outcome.location.latitude, outcome.location.longitude);

      if (!hasFix) {
        const message =
          outcome.status === 'denied'
            ? 'Location permission was denied. Enable location for Mayapur Bazaar in Settings.'
            : outcome.status === 'services-off'
              ? 'Turn on location services, then try again.'
              : outcome.status === 'timeout'
                ? 'Finding your location took too long. Move outdoors and retry.'
                : 'Could not read a fresh GPS fix. Try again.';
        showToast('error', message);
        setGeocodeError(message);
        return;
      }

      if (outcome.status === 'approximate-permission') {
        showToast(
          'error',
          outcome.location.fixNote ??
            (Platform.OS === 'ios'
              ? 'Precise Location is off. Enable Precise Location for Mayapur Bazaar in Settings.'
              : 'Precise location is off. Choose Precise / Fine location for Mayapur Bazaar in Settings.'),
        );
      } else if (outcome.location.approximate && outcome.location.accuracyMeters != null) {
        showToast(
          'error',
          `Location accuracy is low (±${Math.round(outcome.location.accuracyMeters)} m). Move outdoors or adjust your delivery pin.`,
        );
      }

      const coords = {
        latitude: outcome.location.latitude!,
        longitude: outcome.location.longitude!,
      };
      setDeviceOrigin(outcome.location);
      setUserLocationEnabled(true);
      applyResolved(outcome.location, coords);
      // Single camera move. Do not also set controlled region state.
      centerMapOnce(coords);
    } finally {
      gpsInFlight.current = false;
      if (mounted.current) {
        setFetchingGps(false);
      }
    }
  }

  function recenterOnDevice() {
    if (
      deviceOrigin &&
      isValidMapCoordinate(deviceOrigin.latitude, deviceOrigin.longitude)
    ) {
      centerMapOnce({
        latitude: deviceOrigin.latitude!,
        longitude: deviceOrigin.longitude!,
      });
      return;
    }
    void goToCurrentLocation();
  }

  async function navigateToPin() {
    if (!preview || !isValidMapCoordinate(preview.latitude, preview.longitude)) {
      showToast('error', 'Set a delivery pin with coordinates first.');
      return;
    }
    const result = await openExternalNavigation({
      latitude: preview.latitude!,
      longitude: preview.longitude!,
      label: preview.locality || preview.label,
    });
    if (!result.ok) {
      showToast('error', result.message);
    }
  }

  async function onSetLocation() {
    if (!preview || confirming || isBusy() || resolving) {
      return;
    }
    if (
      preview.source !== 'manual' &&
      !isValidMapCoordinate(preview.latitude, preview.longitude)
    ) {
      showToast('error', 'Select a point on the map first.');
      return;
    }
    setConfirming(true);
    try {
      await confirmLocation(preview);
    } finally {
      if (mounted.current) {
        setConfirming(false);
      }
    }
  }

  return (
    <View style={styles.screen}>
      <LocationFlowHeader title="Select Delivery Location" fallbackHref={locationRoutes.search} />

      <View style={styles.mapArea}>
        <DeliveryMap
          ref={mapRef}
          initialRegion={initialRegion}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation={userLocationEnabled}
        />

        <View pointerEvents="box-none" style={styles.overlayTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change search"
            onPress={() => router.replace(locationRoutes.search)}
            style={styles.searchOverlay}>
            <AppIcon name="search" color={colors.textSecondary} size={18} />
            <Text numberOfLines={1} style={styles.searchOverlayText}>
              {query || 'Search for location'}
            </Text>
            <AppIcon name="pencil" color={colors.primaryInk} size={18} />
          </Pressable>
        </View>

        <View pointerEvents="none" style={styles.centerPinWrap}>
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>Drag the map to adjust location</Text>
            <Text style={styles.tooltipSub}>Your order will be delivered here.</Text>
          </View>
          <View style={styles.pin}>
            <AppIcon name="stores" color={colors.white} size={18} />
          </View>
          <View style={styles.pinStem} />
        </View>

        <View style={styles.fabColumn} pointerEvents="box-none">
          {preview?.accuracyMeters != null && Number.isFinite(preview.accuracyMeters) ? (
            <View style={styles.accuracyBadge} accessibilityRole="text">
              <Text style={styles.accuracyText}>
                {accuracyLabel} ±{Math.round(preview.accuracyMeters)} m
                {preview.approximate || Platform.OS === 'web' ? ' · not exact' : ''}
                {preview.fixKind ? ` · ${preview.fixKind}` : ''}
              </Text>
            </View>
          ) : Platform.OS === 'web' && preview?.source === 'gps' ? (
            <View style={styles.accuracyBadge} accessibilityRole="text">
              <Text style={styles.accuracyText}>Browser location · approximate · not exact</Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry location"
            disabled={fetchingGps}
            onPress={() => {
              void goToCurrentLocation();
            }}
            style={({ pressed }) => [styles.locateFab, pressed && styles.pressed, fetchingGps && styles.fabBusy]}>
            {fetchingGps ? (
              <ActivityIndicator color={colors.success} />
            ) : (
              <AppIcon name="stores" color={colors.success} size={20} />
            )}
            <Text style={styles.locateLabel}>{fetchingGps ? 'Improving GPS…' : 'Retry Location'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Recenter map on current location"
            disabled={fetchingGps}
            onPress={recenterOnDevice}
            style={({ pressed }) => [styles.locateFab, pressed && styles.pressed]}>
            <AppIcon name="homeFocused" color={colors.primaryInk} size={18} />
            <Text style={styles.locateLabel}>Recenter</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.distanceSlot}>
        {preview?.approximate || (preview?.accuracyMeters != null && preview.accuracyMeters > 100) ? (
          <View style={styles.distanceBanner}>
            <Text style={styles.distanceText}>
              {Platform.OS === 'web' && (preview?.source === 'gps' || preview?.fixKind === 'network-or-coarse')
                ? `Browser location is approximate${
                    preview.accuracyMeters != null ? ` (±${Math.round(preview.accuracyMeters)} m)` : ''
                  }. Wi‑Fi/IP fixes can be 1–5 km off — drag the pin to your door and confirm. Never treat this as exact GPS.`
                : `Location accuracy is low${
                    preview.accuracyMeters != null ? ` (±${Math.round(preview.accuracyMeters)} m)` : ''
                  }. Move outdoors or adjust your delivery pin. Never treat this as an exact doorstep.`}
            </Text>
          </View>
        ) : distanceKm != null && distanceKm >= 1 ? (
          <View style={styles.distanceBanner}>
            <Text style={styles.distanceText}>
              Pin location is <Text style={styles.distanceStrong}>{formatDistanceKm(distanceKm)}</Text> away from
              your current location.
            </Text>
          </View>
        ) : (
          <View style={styles.distancePlaceholder} />
        )}
      </View>

      <View style={[styles.confirmPanel, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.previewRow}>
          <View style={styles.previewIcon}>
            <AppIcon name="stores" color={colors.text} size={18} />
          </View>
          <View style={styles.previewCopy}>
            <View style={styles.previewTextBlock}>
              <Text numberOfLines={1} style={styles.previewTitle}>
                {preview?.locality || preview?.label || 'Selected location'}
              </Text>
              <Text numberOfLines={2} style={styles.previewBody}>
                {preview ? formatDeliveryAddress(preview) : 'Move the map to choose a delivery point.'}
              </Text>
              {preview && isValidMapCoordinate(preview.latitude, preview.longitude) ? (
                <Text numberOfLines={1} style={styles.coordsText}>
                  {preview.latitude!.toFixed(5)}, {preview.longitude!.toFixed(5)}
                  {preview.landmark ? ` · ${preview.landmark}` : ''}
                </Text>
              ) : null}
            </View>
            {resolving ? <ActivityIndicator color={colors.primaryInk} style={styles.previewSpinner} /> : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change location search"
            onPress={() => router.replace(locationRoutes.search)}
            hitSlop={8}>
            <Text style={styles.change}>Change</Text>
          </Pressable>
        </View>
        {geocodeError ? (
          <View style={styles.errorRow}>
            <Text accessibilityRole="alert" style={styles.errorText}>
              {geocodeError}
            </Text>
            {pendingRetry ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retry address lookup"
                onPress={() => {
                  void runReverseGeocode(pendingRetry, 'map');
                }}>
                <Text style={styles.retry}>Retry</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Navigate to this pin in Maps"
            disabled={!preview || !isValidMapCoordinate(preview.latitude, preview.longitude)}
            onPress={() => {
              void navigateToPin();
            }}
            style={({ pressed }) => [
              styles.navigateBtn,
              pressed && styles.pressed,
              (!preview || !isValidMapCoordinate(preview.latitude, preview.longitude)) && styles.navigateDisabled,
            ]}>
            <Text style={styles.navigateLabel}>Navigate</Text>
          </Pressable>
          <View style={styles.setLocationWrap}>
            <PrimaryButton
              label={confirming ? 'Setting…' : 'Set Location'}
              accessibilityLabel="Set Location"
              disabled={!preview || confirming}
              onPress={() => {
                void onSetLocation();
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mapArea: {
    flex: 1,
    minHeight: 280,
    backgroundColor: colors.softBackground,
  },
  overlayTop: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
  },
  searchOverlay: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchOverlayText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  centerPinWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  tooltip: {
    maxWidth: 240,
    backgroundColor: colors.text,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  tooltipText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
    textAlign: 'center',
  },
  tooltipSub: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  pinStem: {
    width: 3,
    height: 12,
    backgroundColor: colors.success,
    marginTop: -2,
  },
  fabColumn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  accuracyBadge: {
    borderRadius: 12,
    backgroundColor: 'rgba(17, 24, 39, 0.86)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  accuracyText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: colors.white,
  },
  locateFab: {
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locateLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text,
  },
  coordsText: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navigateBtn: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.success,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigateDisabled: {
    opacity: 0.45,
  },
  navigateLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.success,
  },
  setLocationWrap: {
    flex: 1,
  },
  distanceSlot: {
    minHeight: 34,
  },
  distancePlaceholder: {
    height: 34,
  },
  distanceBanner: {
    minHeight: 34,
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#FDBA74',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  distanceText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
    textAlign: 'center',
  },
  distanceStrong: {
    fontFamily: fonts.bold,
  },
  confirmPanel: {
    width: '100%',
    maxWidth: homeLayout.maxWidth,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
  },
  previewIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCopy: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
  },
  previewTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  previewSpinner: {
    marginLeft: 4,
  },
  previewTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  previewBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  change: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger,
  },
  retry: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primaryInk,
  },
  pressed: {
    opacity: 0.8,
  },
  fabBusy: {
    opacity: 0.7,
  },
});
