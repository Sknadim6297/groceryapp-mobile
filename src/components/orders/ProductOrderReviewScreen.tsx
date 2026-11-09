import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CatalogImage } from '@/components/home/CatalogImage';
import { ProductStarRating } from '@/components/product/ProductStarRating';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useCatalog } from '@/context/CatalogContext';
import { useCustomerProfile } from '@/context/CustomerProfileContext';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { useProductReviews } from '@/context/ProductReviewsContext';
import { findPastOrder } from '@/data/pastOrders';
import { productDetailCopy } from '@/data/productDetails';
import {
  activateDeviceOrderProductReviewStore,
  hasOrderProductsReviewed,
  markOrderProductsReviewed,
} from '@/services/orderProductReviewStore';
import type { DemoProduct } from '@/types/catalog';
import { formatRupee } from '@/utils/cartBill';

const MAX_PHOTOS = 4;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function ProductOrderReviewScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);
  const { showToast } = useToast();
  const { findProduct } = useCatalog();
  const { findOrder } = usePreviewSession();
  const { submitReview } = useProductReviews();
  const { profile } = useCustomerProfile();
  const { session } = useAuthSession();

  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = firstParam(id)?.trim() ?? '';
  const previewOrder = orderId ? findOrder(orderId) : null;
  const liveOrder = orderId ? findPastOrder(orderId) : null;
  const order = previewOrder ?? liveOrder;

  const lines = useMemo(() => {
    if (!order) {
      return [];
    }
    return order.items
      .map((item) => {
        const product = findProduct(item.id);
        return { item, product };
      })
      .filter((row) => row.product != null) as {
      item: (typeof order.items)[number];
      product: DemoProduct;
    }[];
  }, [findProduct, order]);

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authorName = profile?.name?.trim() || session?.name?.trim() || 'You';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (Platform.OS !== 'web') {
        await activateDeviceOrderProductReviewStore();
      }
      const done = orderId ? await hasOrderProductsReviewed(orderId) : false;
      if (cancelled) {
        return;
      }
      setAlreadySubmitted(done);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const pickPhotos = useCallback(async () => {
    if (alreadySubmitted) {
      return;
    }
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
  }, [alreadySubmitted, photoUris.length, showToast]);

  const submit = useCallback(async () => {
    if (submitting || alreadySubmitted) {
      return;
    }
    if (!orderId) {
      setError('Open this screen from a delivered order.');
      return;
    }
    if (lines.length === 0) {
      setError('No catalogue products found on this order to review.');
      return;
    }
    if (rating < 1) {
      setError('Tap the stars for an overall rating.');
      return;
    }
    const message = body.trim();
    if (message.length < 8) {
      setError('Type a short review message (a few words).');
      return;
    }

    setSubmitting(true);
    setError(null);

    let saved = 0;
    for (const line of lines) {
      const result = submitReview({
        productId: line.product.id,
        rating,
        body: message,
        tags: ['Order review'],
        photoUris,
        authorName,
      });
      if (result.ok) {
        saved += 1;
      }
    }

    if (saved === 0) {
      setSubmitting(false);
      setError('Could not save product reviews. Please try again.');
      return;
    }

    await markOrderProductsReviewed(orderId);
    setAlreadySubmitted(true);
    showToast('success', `Saved reviews for ${saved} product${saved === 1 ? '' : 's'} on this device.`);
    router.replace({ pathname: '/order/[id]', params: { id: orderId } });
  }, [
    alreadySubmitted,
    authorName,
    body,
    lines,
    orderId,
    photoUris,
    rating,
    showToast,
    submitReview,
    submitting,
  ]);

  if (!UI_PREVIEW_MODE && !order) {
    return (
      <PlaceholderScreen
        title="Product Review"
        message="Product reviews after delivery need a connected order history."
        withHeader
      />
    );
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader
        title="Product Review"
        fallbackHref={orderId ? { pathname: '/order/[id]', params: { id: orderId } } : '/orders'}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { width: contentWidth, paddingBottom: 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>How is your product?</Text>

            {lines.length === 0 ? (
              <Text style={styles.empty}>
                {order
                  ? 'No matching catalogue products were found for this order.'
                  : 'Order not found in this session.'}
              </Text>
            ) : (
              lines.map((line, index) => {
                const copy = productDetailCopy(line.product);
                const showMrp =
                  line.product.compareAt != null && line.product.compareAt > line.product.price;
                return (
                  <View key={`${line.item.id}-${index}`}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.productRow}>
                      <CatalogImage
                        source={line.product.image}
                        style={styles.thumb}
                        contentFit="cover"
                        label={line.product.name}
                      />
                      <View style={styles.productCopy}>
                        <Text style={styles.productName} numberOfLines={2}>
                          {line.product.name}
                        </Text>
                        <Text style={styles.brand}>{copy.brand}</Text>
                        <View style={styles.priceRow}>
                          <Text style={styles.price}>{formatRupee(line.product.price)}</Text>
                          {showMrp ? (
                            <Text style={styles.mrp}>{formatRupee(line.product.compareAt ?? 0)}</Text>
                          ) : null}
                        </View>
                        <Text style={styles.qty}>
                          Qty {line.item.quantity}
                          {line.item.unit ? ` · ${line.item.unit}` : line.product.unit ? ` · ${line.product.unit}` : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Overall Ratings</Text>
            <View style={styles.stars}>
              <ProductStarRating
                rating={rating}
                size={34}
                interactive={!alreadySubmitted}
                onChange={(value) => {
                  setRating(value);
                  setError(null);
                }}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Review Details</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              editable={!alreadySubmitted && hydrated}
              placeholder="Type your message"
              placeholderTextColor={colors.textSecondary}
              multiline
              style={[styles.input, alreadySubmitted && styles.inputDisabled]}
              accessibilityLabel="Product review message"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add photo"
              disabled={alreadySubmitted}
              onPress={() => void pickPhotos()}
              style={({ pressed }) => [
                styles.photoBtn,
                alreadySubmitted && styles.photoBtnDisabled,
                pressed && !alreadySubmitted && styles.pressed,
              ]}>
              <AppIcon name="image" color={colors.primaryInk} size={18} />
              <Text style={styles.photoBtnLabel}>Add Photo</Text>
            </Pressable>

            {photoUris.length > 0 ? (
              <View style={styles.previews}>
                {photoUris.map((uri) => (
                  <View key={uri} style={styles.preview}>
                    <Image source={{ uri }} style={styles.previewImage} contentFit="cover" />
                    {!alreadySubmitted ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Remove photo"
                        hitSlop={6}
                        onPress={() => setPhotoUris((current) => current.filter((item) => item !== uri))}
                        style={styles.removePhoto}>
                        <AppIcon name="close" color={colors.white} size={12} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            {alreadySubmitted ? (
              <Text style={styles.savedNote}>
                Product reviews for this order were already saved on this device.
              </Text>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {alreadySubmitted ? (
            <PrimaryButton
              label="Back to Order"
              showArrow={false}
              onPress={() =>
                orderId
                  ? router.replace({ pathname: '/order/[id]', params: { id: orderId } })
                  : router.replace('/orders')
              }
            />
          ) : (
            <PrimaryButton
              label="Submit Review"
              showArrow={false}
              loading={submitting || !hydrated}
              disabled={!hydrated || lines.length === 0 || !orderId}
              onPress={() => void submit()}
              accessibilityLabel="Submit product review"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    paddingHorizontal: homeLayout.gutter,
    paddingTop: space.sm,
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 16,
    gap: 12,
    ...shadow.soft,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 4,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.softBackground,
  },
  productCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  productName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  brand: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primaryInk,
  },
  mrp: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  qty: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  stars: {
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  input: {
    minHeight: 110,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.softBackground,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    opacity: 0.85,
  },
  photoBtn: {
    minHeight: 44,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryDark,
    backgroundColor: colors.softYellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoBtnDisabled: {
    opacity: 0.55,
  },
  photoBtnLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primaryInk,
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
  savedNote: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.success,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
  },
  footer: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 10,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
});
