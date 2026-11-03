import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CatalogImage } from '@/components/home/CatalogImage';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import type { NotificationListItem } from '@/types/notifications';

type NotificationCardProps = {
  item: NotificationListItem;
  onPress: () => void;
};

export function NotificationCard({ item, onPress }: NotificationCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.isUnread ? 'Unread. ' : ''}${item.body}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, item.isUnread && styles.unread, pressed && styles.pressed]}
      testID={`notification-card-${item.id}`}>
      <View style={styles.thumbWrap}>
        <CatalogImage source={item.image} style={styles.thumb} contentFit="cover" label={item.title} />
        {item.isUnread ? <View style={styles.unreadDot} accessibilityElementsHidden /> : null}
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, !item.isUnread && styles.titleRead]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={3}>
          {item.body}
        </Text>
        <View style={styles.metaRow}>
          <AppIcon name="clock" color={colors.primary} size={13} />
          <Text style={styles.meta}>{item.placedAtLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  unread: {
    borderColor: colors.primaryDark,
    backgroundColor: '#FFFDF5',
  },
  pressed: {
    opacity: 0.92,
  },
  thumbWrap: {
    width: 56,
    height: 56,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.softBackground,
    overflow: 'hidden',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  titleRead: {
    fontFamily: fonts.semibold,
    color: '#334155',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
