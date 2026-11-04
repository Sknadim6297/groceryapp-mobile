import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductStarRating } from '@/components/product/ProductStarRating';
import { AppIcon } from '@/components/ui/AppIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors, fonts, radii, shadow, space } from '@/constants/theme';
import { useToast } from '@/components/ui/AppToast';
import { REVIEW_QUICK_TAGS } from '@/types/productReviews';

type WriteReviewSheetProps = {
  visible: boolean;
  productName: string;
  authorName: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (draft: {
    rating: number;
    body: string;
    tags: string[];
    photoUris: string[];
  }) => { ok: true } | { ok: false; reason: string };
};

const MAX_PHOTOS = 4;

export function WriteReviewSheet({
  visible,
  productName,
  authorName,
  submitting = false,
  onClose,
  onSubmit,
}: WriteReviewSheetProps) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setRating(0);
    setBody('');
    setTags([]);
    setPhotoUris([]);
    setError(null);
  }, [visible]);

  function toggleTag(tag: string) {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag].slice(0, 4)));
  }

  async function pickPhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('error', 'Photo access is needed to attach images.');
      return;
    }
    const remaining = MAX_PHOTOS - photoUris.length;
    if (remaining <= 0) {
      showToast('info', `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
    });
    if (picked.canceled) {
      return;
    }
    const uris = picked.assets.map((asset) => asset.uri).filter(Boolean);
    setPhotoUris((current) => [...current, ...uris].slice(0, MAX_PHOTOS));
  }

  function submit() {
    const result = onSubmit({ rating, body, tags, photoUris });
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    showToast('success', 'Review saved on this device.');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close write review" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <Text style={styles.title}>Write a Review</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={onClose}>
              <AppIcon name="close" color={colors.textSecondary} size={22} />
            </Pressable>
          </View>
          <Text style={styles.product} numberOfLines={1}>
            {productName}
          </Text>
          <Text style={styles.author}>Posting as {authorName}</Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}>
            <View style={styles.starsWrap}>
              <ProductStarRating rating={rating} size={32} interactive onChange={setRating} />
            </View>

            <Text style={styles.label}>What do you think? (Optional)</Text>
            <View style={styles.tagRow}>
              {REVIEW_QUICK_TAGS.map((tag) => {
                const on = tags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => toggleTag(tag)}
                    style={[styles.tag, on && styles.tagOn]}>
                    <Text style={[styles.tagLabel, on && styles.tagLabelOn]}>{tag}</Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Write a review"
              placeholderTextColor={colors.textSecondary}
              multiline
              style={styles.input}
              accessibilityLabel="Review text"
            />

            <Text style={styles.label}>Add Photo (Optional)</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upload review photos"
              onPress={() => void pickPhotos()}
              style={({ pressed }) => [styles.upload, pressed && styles.pressed]}>
              <AppIcon name="image" color={colors.primaryInk} size={22} />
              <Text style={styles.uploadTitle}>Upload png or jpg</Text>
              <Text style={styles.uploadSub}>Max {MAX_PHOTOS} photos · stays on this device</Text>
            </Pressable>

            {photoUris.length > 0 ? (
              <View style={styles.previews}>
                {photoUris.map((uri) => (
                  <View key={uri} style={styles.preview}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Remove photo"
                      hitSlop={6}
                      onPress={() => setPhotoUris((current) => current.filter((item) => item !== uri))}
                      style={styles.removePhoto}>
                      <AppIcon name="close" color={colors.white} size={12} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <PrimaryButton
            label="Submit Review"
            showArrow={false}
            loading={submitting}
            onPress={submit}
            accessibilityLabel="Submit review"
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: space.lg,
    paddingTop: 8,
    gap: 8,
    ...shadow.fab,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  product: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  author: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  scroll: {
    gap: 10,
    paddingBottom: 12,
  },
  starsWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.softBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagOn: {
    backgroundColor: colors.softYellow,
    borderColor: colors.primaryDark,
  },
  tagLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  tagLabelOn: {
    color: colors.primaryInk,
  },
  input: {
    minHeight: 110,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.softBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  upload: {
    minHeight: 88,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  uploadTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  uploadSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
  previews: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preview: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.softBackground,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.85,
  },
});
