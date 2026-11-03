import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import type { ProfileGender } from '@/types/customerProfile';
import { profileAvatarEmoji } from '@/utils/profileAvatar';

type DrawerHeaderProps = {
  name: string;
  subtitle: string;
  gender?: ProfileGender | null;
  paddingTop: number;
};

export function DrawerHeader({ name, subtitle, gender, paddingTop }: DrawerHeaderProps) {
  return (
    <View style={[styles.header, { paddingTop }]}>
      <View
        style={styles.avatar}
        accessibilityLabel={gender === 'male' ? 'Male cartoon avatar' : 'Female cartoon avatar'}>
        <Text style={styles.emoji}>{profileAvatarEmoji(gender)}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.drawer,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17,
    color: colors.primaryInk,
  },
});
