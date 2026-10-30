import { Image } from 'expo-image';
import { router, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocationOptionCard } from '@/components/location/LocationOptionCard';
import { AppIcon, type AppIconName } from '@/components/ui/AppIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { formatDeliveryAddress, referenceLocations } from '@/data/referenceLocations';
import { readCurrentLocation } from '@/services/location/locationService';

const statusCopy: Record<string, string> = {
  denied: 'Location permission was denied. You can enter an address instead.',
  'services-off': 'Location services are turned off. Turn them on, or enter an address.',
  timeout: 'Finding your location took too long. Try again, or enter an address.',
  unavailable: 'A street address could not be read. Enter the address manually.',
};

const savedIcons: Record<string, AppIconName> = {
  home: 'home',
  work: 'briefcase',
  charbagh: 'stores',
};

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const navigation = useNavigation();
  const { selection, setSelection, confirmSelection, revisingProfile, setRevisingProfile } = useDeliveryLocation();
  const [detecting, setDetecting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const removable = navigation as { addListener: (event: 'beforeRemove', callback: () => void) => () => void };
    return removable.addListener('beforeRemove', () => {
      setRevisingProfile(false);
    });
  }, [navigation, setRevisingProfile]);

  async function detectCurrentLocation() {
    if (detecting) {
      return;
    }

    if (UI_PREVIEW_MODE) {
      setStatus('preview');
      return;
    }

    setDetecting(true);
    setStatus(null);
    const result = await readCurrentLocation();
    setDetecting(false);

    if (result.status !== 'ready') {
      setStatus(result.status);
      return;
    }

    setSelection(result.location);
    if (result.location.approximate) {
      setStatus('approximate');
    }
  }

  function continueNext() {
    const returnToProfile = () => {
      if (!revisingProfile || !router.canGoBack()) {
        return false;
      }

      setRevisingProfile(false);
      router.back();
      return true;
    };

    if (UI_PREVIEW_MODE && !selection) {
      if (returnToProfile()) {
        return;
      }

      router.push('/complete-profile');
      return;
    }

    if (!selection) {
      return;
    }

    confirmSelection();
    if (returnToProfile()) {
      return;
    }

    router.push('/complete-profile');
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.blob} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 12) + 96 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          <View style={styles.nav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/otp'))}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
              <AppIcon name="back" color={colors.text} size={18} />
              </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip and browse without a delivery location"
              onPress={() => {
                setRevisingProfile(false);
                router.push('/home');
              }}
              style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
              <Text style={styles.skipLabel}>Skip</Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <View style={styles.copy}>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={1.2}
                style={[styles.title, compact && styles.titleCompact]}>
                {"What's your\n"}
                <Text style={styles.accent}>{"location?"}</Text>
              </Text>
              <Text maxFontSizeMultiplier={1.25} style={styles.subtitle}>
                We need your location to show available stores and products
              </Text>
            </View>
            {compact ? null : (
              <Image
                source={require('@/assets/images/onboarding/location-illustration.jpg')}
                style={styles.art}
                contentFit="contain"
                accessible={false}
              />
            )}
          </View>

          <View style={styles.actions}>
            <LocationOptionCard
              icon="stores"
              title="Use current location"
              subtitle={
                selection?.source === 'gps'
                  ? formatDeliveryAddress(selection)
                  : 'Find nearby stores around you'
              }
              selected={selection?.id === 'gps'}
              busy={detecting}
              onPress={() => {
                void detectCurrentLocation();
              }}
            />
            <LocationOptionCard
              icon="search"
              title="Search location manually"
              subtitle={
                selection?.source === 'manual'
                  ? formatDeliveryAddress(selection)
                  : 'Enter your area, street or landmark'
              }
              selected={selection?.source === 'manual'}
              onPress={() => router.push('/location-manual')}
            />
          </View>

          {status === 'approximate' ? (
            <Text style={styles.note}>This location is approximate. Check the address before continuing.</Text>
          ) : null}
          {status === 'preview' ? (
            <Text style={styles.note}>UI preview does not request location permission.</Text>
          ) : null}
          {status && status !== 'approximate' && status !== 'preview' ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {statusCopy[status]}
            </Text>
          ) : null}

          <Text style={styles.section}>Recent Locations</Text>
          <View style={styles.actions}>
            {referenceLocations.map((place) => (
              <LocationOptionCard
                key={place.id}
                icon={savedIcons[place.id] ?? 'stores'}
                title={place.label}
                subtitle={formatDeliveryAddress(place)}
                selected={selection?.id === place.id}
                onPress={() => {
                  setStatus(null);
                  setSelection(place);
                }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.footerInner}>
          <PrimaryButton
            label="Continue"
            onPress={continueNext}
            disabled={!UI_PREVIEW_MODE && !selection}
            accessibilityLabel="Continue to profile"
          />
          <Text style={styles.disclaimer}>Delivery availability is not confirmed until the store service checks this address.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    top: -20,
    right: -30,
    width: 140,
    height: 120,
    borderRadius: 70,
    backgroundColor: colors.welcomeSoft,
  },
  scroll: {
    alignItems: 'center',
  },
  column: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 20,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.welcomeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
  hero: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.4,
    color: colors.text,
  },
  titleCompact: {
    fontSize: 28,
    lineHeight: 34,
  },
  accent: {
    color: colors.primaryDark,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  art: {
    width: 108,
    height: 96,
  },
  actions: {
    marginTop: 18,
    gap: 12,
  },
  section: {
    marginTop: 22,
    marginBottom: 4,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  note: {
    marginTop: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  error: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: 8,
    backgroundColor: colors.cream,
  },
  footerInner: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 20,
    gap: 8,
  },
  disclaimer: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
