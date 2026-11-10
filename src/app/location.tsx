import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocationFlowHeader } from '@/components/location/LocationFlowHeader';
import { LocationResultCard } from '@/components/location/LocationResultCard';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppIcon } from '@/components/ui/AppIcon';
import { useToast } from '@/components/ui/AppToast';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, control, fonts, homeLayout, radii } from '@/constants/theme';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { isLocationPickerHref, resolveLocationExitHref } from '@/navigation/locationFlow';
import { locationRoutes } from '@/navigation/locationRoutes';
import { readCurrentLocation, searchDeliveryLocations } from '@/services/location/locationService';
import type { LocationSearchResult } from '@/types/location';

const emptyArt = require('@/assets/images/onboarding/location-illustration.jpg');
const SEARCH_DEBOUNCE_MS = 380;

export default function LocationSearchScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { setSelection, returnTo, locationIntent } = useDeliveryLocation();
  const intentFallback: Href = locationIntent === 'registration' ? '/complete-profile' : '/home';
  const backFallback = resolveLocationExitHref(
    returnTo && !isLocationPickerHref(returnTo) ? returnTo : null,
    intentFallback,
  );
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const gpsInFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current += 1;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    const id = ++requestId.current;

    if (trimmed.length < 2) {
      const clearTimer = setTimeout(() => {
        if (id !== requestId.current) {
          return;
        }
        setResults([]);
        setSearching(false);
        setError(null);
      }, 0);
      return () => {
        clearTimeout(clearTimer);
      };
    }

    const timer = setTimeout(() => {
      void (async () => {
        if (id !== requestId.current) {
          return;
        }
        setSearching(true);
        setError(null);
        try {
          const next = await searchDeliveryLocations(trimmed);
          if (id !== requestId.current) {
            return;
          }
          setResults(next);
          if (next.length === 0) {
            setError('No matching locations. Try another area or use current location.');
          }
        } catch {
          if (id !== requestId.current) {
            return;
          }
          setResults([]);
          setError('Location search is unavailable right now. Try current location or enter manually.');
        } finally {
          if (id === requestId.current) {
            setSearching(false);
          }
        }
      })();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  function openMap() {
    router.push(locationRoutes.map);
  }

  async function onUseCurrentLocation() {
    if (detecting || gpsInFlight.current) {
      return;
    }
    gpsInFlight.current = true;
    setDetecting(true);
    setError(null);
    try {
      const outcome = await readCurrentLocation();
      if (!mounted.current) {
        return;
      }
      if (outcome.status !== 'ready' && outcome.status !== 'approximate-permission') {
        const message =
          outcome.status === 'denied'
            ? 'Location permission was denied. Search for an area or enter an address manually.'
            : outcome.status === 'services-off'
              ? 'Turn on location services, then try again.'
              : outcome.status === 'timeout'
                ? 'Finding your location took too long. Try again or search instead.'
                : 'Could not read your current location. Search or enter an address manually.';
        setError(message);
        showToast('error', message);
        return;
      }
      if (outcome.status === 'approximate-permission') {
        showToast(
          'error',
          'Precise location is off. You can still adjust the pin on the map, or enable Precise Location in Settings.',
        );
      }
      setSelection(outcome.location);
      openMap();
    } finally {
      gpsInFlight.current = false;
      if (mounted.current) {
        setDetecting(false);
      }
    }
  }

  function onSelectResult(item: LocationSearchResult) {
    setSelection(item.location);
    openMap();
  }

  const showEmpty = query.trim().length < 2 && !detecting;

  return (
    <View style={styles.screen}>
      <LocationFlowHeader title="Select Delivery Location" fallbackHref={backFallback} />

      <View style={styles.panel}>
        <View style={styles.search}>
          <AppIcon name="search" color={colors.textSecondary} size={20} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search for location"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Search for location"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={8}
              onPress={() => setQuery('')}>
              <AppIcon name="close" color={colors.textSecondary} size={18} />
            </Pressable>
          ) : null}
        </View>

        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Use current location"
          accessibilityState={{ busy: detecting }}
          disabled={detecting}
          onPress={() => {
            void onUseCurrentLocation();
          }}
          style={[styles.gpsButton, detecting && styles.gpsBusy]}>
          <View style={styles.gpsIcon}>
            {detecting ? (
              <ActivityIndicator color={colors.primaryInk} />
            ) : (
              <AppIcon name="crosshair" color={colors.primaryInk} size={20} />
            )}
          </View>
          <Text style={styles.gpsLabel}>{detecting ? 'Finding your location…' : 'Use current location'}</Text>
          <AppIcon name="chevron" color={colors.primaryInk} size={18} />
        </AnimatedPressable>

        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        {showEmpty ? (
          <EmptyState
            title="Search your delivery location"
            body="Find your area, locality or use your current location to continue."
            art={<Image source={emptyArt} style={styles.emptyArt} contentFit="contain" accessible={false} />}
            action={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Enter address manually"
                onPress={() => router.push(locationRoutes.manual)}
                style={({ pressed }) => [styles.manualLink, pressed && styles.pressed]}>
                <Text style={styles.manualLabel}>Enter address manually</Text>
              </Pressable>
            }
          />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
            ListHeaderComponent={
              searching ? (
                <ActivityIndicator color={colors.primaryInk} style={styles.listSpinner} />
              ) : results.length > 0 ? (
                <Text style={styles.section}>Search results</Text>
              ) : (
                <View />
              )
            }
            renderItem={({ item }) => (
              <LocationResultCard
                title={item.title}
                subtitle={item.subtitle}
                accessibilityLabel={`${item.title}. ${item.subtitle}`}
                onPress={() => onSelectResult(item)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  panel: {
    flex: 1,
    marginTop: 10,
    marginHorizontal: 12,
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: 16,
    paddingTop: 16,
    maxWidth: homeLayout.maxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  search: {
    minHeight: control.input,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 12,
  },
  gpsButton: {
    marginTop: 12,
    minHeight: control.input,
    borderRadius: radii.md,
    backgroundColor: colors.softYellow,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gpsBusy: {
    opacity: 0.75,
  },
  gpsIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  errorBox: {
    marginTop: 12,
    borderRadius: radii.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  emptyArt: {
    width: 220,
    height: 160,
  },
  manualLink: {
    marginTop: 8,
    paddingVertical: 8,
  },
  manualLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.75,
  },
  listContent: {
    paddingTop: 8,
    gap: 4,
  },
  listSpinner: {
    marginVertical: 16,
  },
  section: {
    marginTop: 8,
    marginBottom: 6,
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
