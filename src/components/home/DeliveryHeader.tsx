import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogImage } from '@/components/home/CatalogImage';
import { HomeCategoryTabs } from '@/components/home/HomeCategoryTabs';
import { HomeSubcategoryStrip } from '@/components/home/HomeSubcategoryStrip';
import { SearchBar } from '@/components/home/SearchBar';
import { SideMenu } from '@/components/home/SideMenu';
import { AppIcon } from '@/components/ui/AppIcon';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { addressesSelectHref, locationRoutes } from '@/navigation/locationRoutes';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { useSavedAddresses } from '@/context/SavedAddressesContext';
import { previewDeliveryIconUrl } from '@/data/previewImageCatalog';
import { formatDeliveryAddress } from '@/data/referenceLocations';

const SELECT_LOCATION = 'Select delivery location';

export function DeliveryHeader() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { confirmed, beginAddressBookPick, beginLocationEdit } = useDeliveryLocation();
  const { addresses, hydrated } = useSavedAddresses();
  const compact = width < 360;
  const [menuOpen, setMenuOpen] = useState(false);
  const title = UI_PREVIEW_MODE ? 'Deliver in 10 mins' : 'Deliver to';
  const address = confirmed ? formatDeliveryAddress(confirmed) : SELECT_LOCATION;
  const etaIcon = previewDeliveryIconUrl();

  function openDeliveryPicker() {
    if (hydrated && addresses.length > 0) {
      beginAddressBookPick({ selectMode: true, returnTo: '/home' });
      router.push(addressesSelectHref());
      return;
    }
    beginLocationEdit('change', { returnTo: '/home' });
    router.push(locationRoutes.search);
  }

  return (
    <View style={[styles.header, { paddingTop: insets.top + (compact ? 6 : 8) }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            UI_PREVIEW_MODE
              ? `Demo estimate. Ten minutes is not a confirmed delivery time. ${address}`
              : `Delivery location. ${address}`
          }
          onPress={openDeliveryPicker}
          style={({ pressed }) => [styles.location, pressed ? styles.pressed : null]}>
          <View style={styles.copy}>
            <View style={styles.titleRow}>
              {etaIcon ? (
                <CatalogImage
                  source={{ uri: etaIcon }}
                  style={styles.etaIcon}
                  label="Preview delivery artwork. Not a confirmed delivery time."
                />
              ) : null}
              <Text numberOfLines={1} style={[styles.title, compact ? styles.titleCompact : null]}>
                {title}
              </Text>
            </View>
            <View style={styles.addressRow}>
              <Text numberOfLines={1} style={styles.address}>
                {address}
              </Text>
              <AppIcon name="chevronDown" color={colors.text} size={20} />
            </View>
          </View>
        </Pressable>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/notifications')}
            style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
            testID="home-header-notifications">
            <AppIcon name="bell" color={colors.white} size={24} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu"
            accessibilityState={{ expanded: menuOpen }}
            onPress={() => setMenuOpen(true)}
            style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}>
            <AppIcon name="menu" color={colors.white} size={24} />
          </Pressable>
        </View>
      </View>
      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
      <View style={styles.search}>
        <SearchBar />
      </View>
      <HomeCategoryTabs />
      <HomeSubcategoryStrip />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brightYellow,
    paddingBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  location: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  etaIcon: {
    width: 22,
    height: 22,
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 18,
    color: colors.text,
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 17,
  },
  addressRow: {
    marginTop: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
  },
  address: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  action: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B3E26',
  },
  pressed: {
    opacity: 0.75,
  },
  search: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
});
