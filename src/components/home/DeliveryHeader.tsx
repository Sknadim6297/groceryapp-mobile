import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchBar } from '@/components/home/SearchBar';
import { AppIcon } from '@/components/ui/AppIcon';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts } from '@/constants/theme';
import { useDeliveryLocation } from '@/context/DeliveryLocationContext';
import { formatDeliveryAddress } from '@/data/referenceLocations';

const SELECT_LOCATION = 'Select delivery location';

export function DeliveryHeader() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { confirmed } = useDeliveryLocation();
  const compact = width < 360;
  const title = UI_PREVIEW_MODE ? 'Deliver in 10 mins' : 'Deliver to';
  const address = confirmed ? formatDeliveryAddress(confirmed) : SELECT_LOCATION;

  return (
    <View style={[styles.header, { paddingTop: insets.top + (compact ? 8 : 10) }]}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            UI_PREVIEW_MODE
              ? `Demo estimate. Ten minutes is not a confirmed delivery time. ${address}`
              : `Delivery location. ${address}`
          }
          onPress={() => router.push('/location')}
          style={({ pressed }) => [styles.location, pressed && styles.pressed]}>
          <AppIcon name="stores" color={colors.text} size={compact ? 18 : 20} />
          <View style={styles.copy}>
            <Text numberOfLines={1} style={[styles.title, compact && styles.titleCompact]}>
              {title}
            </Text>
            <View style={styles.addressRow}>
              <Text numberOfLines={1} style={styles.address}>
                {address}
              </Text>
              <AppIcon name="chevronDown" color={colors.text} size={14} />
            </View>
          </View>
        </Pressable>
        <View
          accessibilityRole="image"
          accessibilityLabel={
            UI_PREVIEW_MODE ? 'Demo notification icon. No notifications are loaded.' : 'Notifications'
          }
          style={styles.bell}>
          <AppIcon name="bell" color={colors.text} size={22} />
          {UI_PREVIEW_MODE ? <View style={styles.dot} /> : null}
        </View>
      </View>
      <View style={styles.search}>
        <SearchBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brightYellow,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  location: {
    flex: 1,
    minWidth: 0,
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
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 18,
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
  bell: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.75,
  },
  search: {
    marginTop: 12,
  },
});
