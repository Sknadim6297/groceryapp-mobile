import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogImage } from '@/components/home/CatalogImage';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import type { NotificationListItem } from '@/types/notifications';

type NotificationDetailsSheetProps = {
  item: NotificationListItem | null;
  onClose: () => void;
};

export function NotificationDetailsSheet({ item, onClose }: NotificationDetailsSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={item !== null} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification details" onPress={onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} testID="notification-details-sheet">
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notification</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={10}
              style={styles.close}
              testID="notification-details-close">
              <AppIcon name="close" color={colors.text} size={20} />
            </Pressable>
          </View>

          {item ? (
            <>
              <Text style={styles.demoPill}>Demo / Preview — not a live alert</Text>
              <View style={styles.hero}>
                <CatalogImage source={item.image} style={styles.heroImage} contentFit="cover" label={item.title} />
                <View style={styles.heroCopy}>
                  <Text style={styles.title}>{item.title}</Text>
                  <View style={styles.metaRow}>
                    <AppIcon name="clock" color={colors.primary} size={13} />
                    <Text style={styles.meta}>{item.placedAtLabel}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.body}>{item.body}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
                <Text style={styles.closeLabel}>Close</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
  },
  close: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoPill: {
    alignSelf: 'flex-start',
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.primaryInk,
    backgroundColor: colors.softYellow,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  hero: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  heroImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.softBackground,
    overflow: 'hidden',
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  closeBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
