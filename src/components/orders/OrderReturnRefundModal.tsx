import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogImage } from '@/components/home/CatalogImage';
import { AppIcon } from '@/components/ui/AppIcon';
import { useToast } from '@/components/ui/AppToast';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { ORDER_RETURN_REASONS, type OrderReturnReasonId } from '@/data/orderReturnReasons';
import { findDemoProduct } from '@/data/findDemoProduct';
import type { OrderLine } from '@/types/order';

const MAX_PHOTOS = 4;
const STEPS = ['Items', 'Reason', 'Photos', 'Review'] as const;

export type ReturnRequestPayload = {
  reasonIds: OrderReturnReasonId[];
  itemIds: string[];
  photoUris: string[];
};

type OrderReturnRefundModalProps = {
  visible: boolean;
  orderId: string;
  items: readonly OrderLine[];
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (payload: ReturnRequestPayload) => void;
};

export function OrderReturnRefundModal({
  visible,
  orderId,
  items,
  submitting = false,
  onClose,
  onConfirm,
}: OrderReturnRefundModalProps) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<OrderReturnReasonId[]>([]);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep(0);
      setSelectedItems(items.map((item) => item.id));
      setSelectedReasons([]);
      setPhotoUris([]);
      setPicking(false);
    }
  }, [visible, orderId, items]);

  const selectedLines = useMemo(
    () => items.filter((item) => selectedItems.includes(item.id)),
    [items, selectedItems],
  );

  const reasonLabels = useMemo(
    () =>
      ORDER_RETURN_REASONS.filter((reason) => selectedReasons.includes(reason.id)).map(
        (reason) => reason.label,
      ),
    [selectedReasons],
  );

  function toggleItem(id: string) {
    setSelectedItems((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleReason(id: OrderReturnReasonId) {
    setSelectedReasons((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function pickFromLibrary() {
    if (picking || submitting) {
      return;
    }
    const remaining = MAX_PHOTOS - photoUris.length;
    if (remaining <= 0) {
      showToast('info', `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showToast('error', 'Photo access is needed to show the returned product.');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.75,
      });
      if (picked.canceled) {
        return;
      }
      const uris = picked.assets.map((asset) => asset.uri).filter(Boolean);
      setPhotoUris((current) => [...current, ...uris].slice(0, MAX_PHOTOS));
    } finally {
      setPicking(false);
    }
  }

  async function pickFromCamera() {
    if (picking || submitting) {
      return;
    }
    if (photoUris.length >= MAX_PHOTOS) {
      showToast('info', `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    setPicking(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showToast('error', 'Camera access is needed to photograph the product.');
        return;
      }
      const picked = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.75,
      });
      if (picked.canceled || !picked.assets[0]?.uri) {
        return;
      }
      setPhotoUris((current) => [...current, picked.assets[0]!.uri].slice(0, MAX_PHOTOS));
    } finally {
      setPicking(false);
    }
  }

  function removePhoto(uri: string) {
    setPhotoUris((current) => current.filter((item) => item !== uri));
  }

  function canContinue(): boolean {
    if (step === 0) {
      return selectedItems.length > 0;
    }
    if (step === 1) {
      return selectedReasons.length > 0;
    }
    if (step === 2) {
      return photoUris.length > 0;
    }
    return selectedItems.length > 0 && selectedReasons.length > 0 && photoUris.length > 0 && !submitting;
  }

  function onPrimary() {
    if (!canContinue()) {
      if (step === 0) {
        showToast('error', 'Select at least one product to return.');
      } else if (step === 1) {
        showToast('error', 'Select at least one return reason.');
      } else if (step === 2) {
        showToast('error', 'Upload at least one product photo for the refund review.');
      }
      return;
    }
    if (step < STEPS.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    onConfirm({
      reasonIds: selectedReasons,
      itemIds: selectedItems,
      photoUris,
    });
  }

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
          accessibilityLabel="Dismiss return and refund"
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
              <Text style={styles.title}>Return & Refund</Text>
              <Text style={styles.orderHint}>Order #{orderId}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
              onPress={onClose}
              disabled={submitting}
              style={({ pressed }) => [styles.closeHit, pressed && styles.pressed]}>
              <AppIcon name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.stepRow}>
            {STEPS.map((label, index) => {
              const active = index === step;
              const done = index < step;
              return (
                <View key={label} style={styles.stepItem}>
                  <View style={[styles.stepDot, (active || done) && styles.stepDotOn]}>
                    {done ? (
                      <AppIcon name="check" size={11} color={colors.text} />
                    ) : (
                      <Text style={[styles.stepIndex, active && styles.stepIndexOn]}>{index + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, active && styles.stepLabelOn]} numberOfLines={1}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}>
            {step === 0 ? (
              <View style={styles.block}>
                <Text style={styles.prompt}>Which products are you returning?</Text>
                <Text style={styles.helper}>Select the items that need a refund review.</Text>
                {items.length === 0 ? (
                  <Text style={styles.helper}>No line items were found on this order.</Text>
                ) : (
                  <View style={styles.itemList}>
                    {items.map((item) => {
                      const product = findDemoProduct(item.id);
                      const checked = selectedItems.includes(item.id);
                      return (
                        <Pressable
                          key={`${item.id}-${item.name}`}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked }}
                          accessibilityLabel={item.name}
                          onPress={() => toggleItem(item.id)}
                          style={({ pressed }) => [
                            styles.itemRow,
                            checked && styles.itemRowChecked,
                            pressed && styles.pressed,
                          ]}>
                          <View style={styles.itemThumb}>
                            {product ? (
                              <CatalogImage
                                source={product.image}
                                style={styles.itemThumbImage}
                                contentFit="cover"
                                label={item.name}
                              />
                            ) : (
                              <AppIcon name="bag" color={colors.primaryInk} size={18} />
                            )}
                          </View>
                          <View style={styles.itemCopy}>
                            <Text style={styles.itemName} numberOfLines={2}>
                              {item.name}
                            </Text>
                            <Text style={styles.itemMeta}>
                              Qty {item.quantity}
                              {item.unit ? ` · ${item.unit}` : ''}
                            </Text>
                          </View>
                          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                            {checked ? <AppIcon name="check" size={12} color={colors.text} /> : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

            {step === 1 ? (
              <View style={styles.block}>
                <Text style={styles.prompt}>Why are you returning these items?</Text>
                <Text style={styles.helper}>You can select more than one reason.</Text>
                <View style={styles.list}>
                  {ORDER_RETURN_REASONS.map((reason, index) => {
                    const checked = selectedReasons.includes(reason.id);
                    return (
                      <View key={reason.id}>
                        {index > 0 ? <View style={styles.rowDivider} /> : null}
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked }}
                          accessibilityLabel={reason.label}
                          onPress={() => toggleReason(reason.id)}
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
              </View>
            ) : null}

            {step === 2 ? (
              <View style={styles.block}>
                <Text style={styles.prompt}>Upload product photos</Text>
                <Text style={styles.helper}>
                  Clear photos of the item help the refund review. At least one photo is required.
                </Text>
                <View style={styles.photoActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Take photo"
                    disabled={picking || submitting}
                    onPress={() => {
                      void pickFromCamera();
                    }}
                    style={({ pressed }) => [styles.photoAction, pressed && styles.pressed]}>
                    <AppIcon name="camera" color={colors.primaryInk} size={20} />
                    <Text style={styles.photoActionLabel}>Camera</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Choose from gallery"
                    disabled={picking || submitting}
                    onPress={() => {
                      void pickFromLibrary();
                    }}
                    style={({ pressed }) => [styles.photoAction, pressed && styles.pressed]}>
                    <AppIcon name="image" color={colors.primaryInk} size={20} />
                    <Text style={styles.photoActionLabel}>Gallery</Text>
                  </Pressable>
                </View>
                {picking ? (
                  <View style={styles.pickingRow}>
                    <ActivityIndicator color={colors.primaryInk} />
                    <Text style={styles.helper}>Opening photos…</Text>
                  </View>
                ) : null}
                <View style={styles.photoGrid}>
                  {photoUris.map((uri) => (
                    <View key={uri} style={styles.photoTile}>
                      <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Remove photo"
                        hitSlop={8}
                        onPress={() => removePhoto(uri)}
                        style={styles.photoRemove}>
                        <AppIcon name="close" color={colors.white} size={12} />
                      </Pressable>
                    </View>
                  ))}
                  {photoUris.length < MAX_PHOTOS ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Add return photo"
                      onPress={() => {
                        void pickFromLibrary();
                      }}
                      style={({ pressed }) => [styles.photoAdd, pressed && styles.pressed]}>
                      <AppIcon name="plus" color={colors.primaryInk} size={22} />
                      <Text style={styles.photoAddLabel}>Add</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Text style={styles.photoCount}>
                  {photoUris.length}/{MAX_PHOTOS} photos · required for refund review
                </Text>
              </View>
            ) : null}

            {step === 3 ? (
              <View style={styles.block}>
                <Text style={styles.prompt}>Review your return request</Text>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Products</Text>
                  {selectedLines.map((item) => {
                    const product = findDemoProduct(item.id);
                    return (
                      <View key={`${item.id}-summary`} style={styles.summaryRow}>
                        <View style={styles.summaryThumb}>
                          {product ? (
                            <CatalogImage
                              source={product.image}
                              style={styles.summaryThumbImage}
                              contentFit="cover"
                            />
                          ) : null}
                        </View>
                        <Text style={styles.summaryName} numberOfLines={2}>
                          {item.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Reasons</Text>
                  {reasonLabels.map((label) => (
                    <Text key={label} style={styles.summaryBullet}>
                      • {label}
                    </Text>
                  ))}
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Photos ({photoUris.length})</Text>
                  <View style={styles.photoGrid}>
                    {photoUris.map((uri) => (
                      <View key={`review-${uri}`} style={styles.photoTile}>
                        <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={styles.helper}>
                  Preview only — this request stays on this device. Live bank refunds are not connected yet.
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {step > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                disabled={submitting}
                onPress={() => setStep((current) => Math.max(0, current - 1))}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryLabel}>Back</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={step === STEPS.length - 1 ? 'Submit return request' : 'Continue'}
              accessibilityState={{ disabled: !canContinue() || submitting }}
              disabled={submitting}
              onPress={onPrimary}
              style={({ pressed }) => [
                styles.confirmButton,
                step > 0 && styles.confirmButtonFlex,
                !canContinue() && styles.confirmButtonDisabled,
                pressed && canContinue() && styles.pressed,
              ]}>
              {submitting ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.confirmLabel}>
                  {step === STEPS.length - 1 ? 'Submit return request' : 'Continue'}
                </Text>
              )}
            </Pressable>
          </View>
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
    maxHeight: '92%',
    overflow: 'hidden',
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
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
  stepRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.softBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotOn: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.primary,
  },
  stepIndex: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textSecondary,
  },
  stepIndexOn: {
    color: colors.text,
  },
  stepLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 12,
    color: colors.textSecondary,
  },
  stepLabelOn: {
    fontFamily: fonts.bold,
    color: colors.primaryInk,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  block: {
    gap: 10,
  },
  prompt: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  helper: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  itemList: {
    gap: 8,
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.warmBackground,
  },
  itemRowChecked: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemThumbImage: {
    width: 52,
    height: 52,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  itemMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
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
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  photoAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoActionLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryInk,
  },
  pickingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoTile: {
    width: 76,
    height: 76,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.softBackground,
  },
  photoImage: {
    width: 76,
    height: 76,
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(17,24,39,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAdd: {
    width: 76,
    height: 76,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primaryDark,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  photoAddLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryInk,
  },
  photoCount: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  summaryCard: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.warmBackground,
    padding: space.md,
    gap: 8,
  },
  summaryTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  summaryThumbImage: {
    width: 40,
    height: 40,
  },
  summaryName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
  },
  summaryBullet: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  secondaryButton: {
    minHeight: 52,
    minWidth: 96,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  confirmButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonFlex: {
    flex: 1,
  },
  confirmButtonDisabled: {
    opacity: 0.45,
  },
  confirmLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.88,
  },
});
