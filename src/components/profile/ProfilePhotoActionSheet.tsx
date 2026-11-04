import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radii, shadow } from '@/constants/theme';
import { PROFILE_AVATAR_PRESETS, type ProfileAvatarPresetId } from '@/types/customerProfile';

type ProfilePhotoActionSheetProps = {
  visible: boolean;
  picking?: boolean;
  showAvatarPicker: boolean;
  onClose: () => void;
  onShowPicture: () => void;
  onTakePhoto: () => void;
  onPickFromDevice: () => void;
  onChooseExisting: () => void;
  onSelectPreset: (id: ProfileAvatarPresetId) => void;
};

export function ProfilePhotoActionSheet({
  visible,
  picking = false,
  showAvatarPicker,
  onClose,
  onShowPicture,
  onTakePhoto,
  onPickFromDevice,
  onChooseExisting,
  onSelectPreset,
}: ProfilePhotoActionSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss photo options"
          style={styles.backdrop}
          onPress={onClose}
        />
        <View style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.sheet} testID="profile-photo-sheet">
            {showAvatarPicker ? (
              <>
                <Text style={styles.pickerTitle}>Choose An Existing Avatar</Text>
                <View style={styles.presetGrid}>
                  {PROFILE_AVATAR_PRESETS.map((preset) => (
                    <Pressable
                      key={preset.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Use ${preset.label} avatar`}
                      disabled={picking}
                      onPress={() => onSelectPreset(preset.id)}
                      style={({ pressed }) => [
                        styles.preset,
                        { backgroundColor: preset.wash },
                        pressed && styles.pressed,
                      ]}
                      testID={`profile-avatar-preset-${preset.id}`}>
                      <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                      <Text style={styles.presetLabel}>{preset.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <SheetAction label="Back" onPress={onChooseExisting} danger={false} />
              </>
            ) : (
              <>
                <SheetAction label="Show Profile Picture" onPress={onShowPicture} />
                <View style={styles.divider} />
                <SheetAction label="New Photo Shoot" onPress={onTakePhoto} disabled={picking} />
                <View style={styles.divider} />
                <SheetAction label="Select Photo From Device" onPress={onPickFromDevice} disabled={picking} />
                <View style={styles.divider} />
                <SheetAction label="Choose An Existing Avatar" onPress={onChooseExisting} />
              </>
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={onClose}
            style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}
            testID="profile-photo-dismiss">
            <Text style={styles.dismissLabel}>Dismiss</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function SheetAction({
  label,
  onPress,
  disabled = false,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, disabled && styles.actionDisabled, pressed && !disabled && styles.pressed]}>
      <Text style={[styles.actionLabel, danger && styles.actionDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  sheetWrap: {
    paddingHorizontal: 12,
    gap: 10,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  action: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  actionDanger: {
    color: colors.danger,
    fontFamily: fonts.semibold,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dismiss: {
    minHeight: 54,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  dismissLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.danger,
  },
  pickerTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  preset: {
    width: '47%',
    flexGrow: 1,
    minHeight: 88,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  presetEmoji: {
    fontSize: 28,
  },
  presetLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  pressed: {
    opacity: 0.82,
  },
});
