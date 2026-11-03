import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts } from '@/constants/theme';
import type { ProductSortId } from '@/types/productFilters';
import { PRODUCT_SORT_OPTIONS } from '@/utils/productFilters';

type ProductSortSheetProps = {
  visible: boolean;
  selected: ProductSortId;
  onSelect: (id: ProductSortId) => void;
  onClose: () => void;
};

export function ProductSortSheet({ visible, selected, onSelect, onClose }: ProductSortSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const maxHeight = Math.min(Math.round(height * 0.55), 420);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss sort"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View style={[styles.sheet, { maxHeight, paddingBottom: Math.max(insets.bottom, 16) }]} testID="product-sort-sheet">
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>Sort By</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close sort"
              onPress={onClose}
              hitSlop={10}
              style={styles.close}
              testID="product-sort-close">
              <AppIcon name="close" color={colors.text} size={20} />
            </Pressable>
          </View>

          <View style={styles.list}>
            {PRODUCT_SORT_OPTIONS.map((option) => {
              const active = option.id === selected;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.label}
                  onPress={() => onSelect(option.id)}
                  style={({ pressed }) => [styles.option, active && styles.optionActive, pressed && styles.pressed]}
                  testID={`product-sort-${option.id}`}>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
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
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
  },
  close: {
    position: 'absolute',
    right: 0,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 6,
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  optionActive: {
    backgroundColor: colors.softYellow,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primaryDark,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  optionLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  optionLabelActive: {
    fontFamily: fonts.semibold,
  },
  pressed: {
    opacity: 0.8,
  },
});
