import { StyleSheet, Text, View } from 'react-native';

import { SoftIcon } from '@/components/ui/SoftIcon';
import { colors, fonts } from '@/constants/theme';

type DrawerHeaderProps = {
  name: string;
  phone: string;
  paddingTop: number;
};

export function DrawerHeader({ name, phone, paddingTop }: DrawerHeaderProps) {
  return (
    <View style={[styles.header, { paddingTop }]}>
      <View style={styles.avatar}>
        <SoftIcon name="profile" size={28} />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        <Text numberOfLines={1} style={styles.phone}>
          {phone}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.brightYellow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  phone: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },
});
