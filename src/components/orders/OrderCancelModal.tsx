import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { ORDER_CANCEL_REASONS, type OrderCancelReasonId } from '@/data/orderCancelReasons';
import { colors, fonts, homeLayout, radii, shadow } from '@/constants/theme';

type OrderCancelModalProps = {
  visible: boolean;
  orderId: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (reasonIds: OrderCancelReasonId[]) => void;
};

export function OrderCancelModal({
  visible,
  orderId,
  submitting = false,
  onClose,
  onConfirm,
}: OrderCancelModalProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<OrderCancelReasonId[]>([]);
  const sessionKey = visible ? orderId : '';
  const [activeSession, setActiveSession] = useState(sessionKey);
  if (visible && sessionKey !== activeSession) {
    setActiveSession(sessionKey);
    setSelected([]);
  }

  const toggle = (id: OrderCancelReasonId) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const canSubmit = selected.length > 0 && !submitting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss cancel order"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            { marginBottom: Math.max(insets.bottom, 16), marginTop: Math.max(insets.top, 16) },
          ]}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Order Cancel</Text>
              <Text style={styles.orderHint}>Order #{orderId}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [styles.closeHit, pressed && styles.pressed]}>
              <AppIcon name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <Text style={styles.prompt}>Why did you cancel the order?</Text>

            <View style={styles.list}>
              {ORDER_CANCEL_REASONS.map((reason, index) => {
                const checked = selected.includes(reason.id);
                return (
                  <View key={reason.id}>
                    {index > 0 ? <View style={styles.rowDivider} /> : null}
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      accessibilityLabel={reason.label}
                      onPress={() => toggle(reason.id)}
                      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked ? <AppIcon name="check" size={12} color={colors.text} /> : null}
                      </View>
                      <Text style={styles.reasonLabel}>{reason.label}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirm cancel order"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={() => onConfirm(selected)}
            style={({ pressed }) => [
              styles.cancelButton,
              !canSubmit && styles.cancelButtonDisabled,
              pressed && canSubmit && styles.pressed,
            ]}>
            <Text style={styles.cancelLabel}>{submitting ? 'Cancelling…' : 'Cancel'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: homeLayout.gutter,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    maxHeight: '88%',
    overflow: 'hidden',
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 12,
    backgroundColor: colors.warmBackground,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.text,
    letterSpacing: -0.2,
  },
  orderHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  closeHit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  prompt: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  list: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.warmBackground,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  reasonLabel: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  cancelButton: {
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 18,
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.45,
  },
  cancelLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.88,
  },
});
