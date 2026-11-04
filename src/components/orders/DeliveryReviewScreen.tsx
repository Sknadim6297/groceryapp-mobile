import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

import { ProductStarRating } from '@/components/product/ProductStarRating';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppScreenHeader } from '@/components/ui/AppScreenHeader';
import { useToast } from '@/components/ui/AppToast';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { UI_PREVIEW_MODE } from '@/constants/preview';
import { colors, fonts, homeLayout, radii, shadow, space } from '@/constants/theme';
import { usePreviewSession } from '@/context/PreviewSessionContext';
import { findPastOrder } from '@/data/pastOrders';
import {
  activateDeviceDeliveryReviewStore,
  findDeliveryReview,
  upsertDeliveryReview,
} from '@/services/deliveryReviewStore';
import { formatRupee } from '@/utils/cartBill';
import { orderItemCount } from '@/utils/orderListing';

const QUICK_TAGS = ['On Time', 'Fresh Items', 'Careful Handling', 'Friendly Partner', 'Good Packaging'] as const;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function DeliveryReviewScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, homeLayout.maxWidth);
  const { showToast } = useToast();
  const { findOrder } = usePreviewSession();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = firstParam(id)?.trim() ?? '';

  const previewOrder = orderId ? findOrder(orderId) : null;
  const liveOrder = orderId ? findPastOrder(orderId) : null;
  const order = previewOrder ?? liveOrder;

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (Platform.OS !== 'web') {
        await activateDeviceDeliveryReviewStore();
      }
      const existing = orderId ? await findDeliveryReview(orderId) : null;
      if (cancelled) {
        return;
      }
      if (existing) {
        setRating(existing.rating);
        setBody(existing.body);
        setAlreadySubmitted(true);
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const toggleTag = useCallback((tag: string) => {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag].slice(0, 4),
    );
  }, []);

  const submit = useCallback(async () => {
    if (submitting || alreadySubmitted) {
      return;
    }
    if (!orderId) {
      setError('Missing order id. Open this screen from a delivered order.');
      return;
    }
    if (rating < 1) {
      setError('Tap the stars to rate your delivery.');
      return;
    }
    const note = body.trim();
    const composed =
      tags.length > 0 ? `${note}${note ? '\n\n' : ''}${tags.map((tag) => `#${tag.replace(/\s+/g, '')}`).join(' ')}` : note;

    setSubmitting(true);
    setError(null);
    try {
      await upsertDeliveryReview({
        orderId,
        rating,
        body: composed,
        createdAt: Date.now(),
      });
      setAlreadySubmitted(true);
      showToast('success', 'Thanks — delivery review saved on this device.');
      router.replace({ pathname: '/order/[id]', params: { id: orderId } });
    } catch {
      setError('Could not save your review. Please try again.');
      setSubmitting(false);
    }
  }, [alreadySubmitted, body, orderId, rating, showToast, submitting, tags]);

  if (!UI_PREVIEW_MODE && !order) {
    return (
      <PlaceholderScreen
        title="Delivery Review"
        message="Delivery reviews are available after a live delivered order is connected."
        withHeader
      />
    );
  }

  const itemCount = order ? orderItemCount(order) : 0;
  const orderTotal =
    order && 'total' in order && typeof order.total === 'number'
      ? order.total
      : order && typeof order.totalAmount === 'number'
        ? order.totalAmount
        : null;
  const totalLabel = orderTotal != null ? formatRupee(orderTotal) : null;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FEF9C3', colors.warmBackground, colors.warmBackground]}
        locations={[0, 0.28, 1]}
        style={StyleSheet.absoluteFill}
      />

      <AppScreenHeader
        title="Delivery Review"
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
            <View style={styles.heroArt}>
              <View style={styles.heroArc} />
              <View style={styles.heroBubble}>
                <AppIcon name="bike" color={colors.primaryInk} size={36} />
              </View>
              <View style={[styles.dot, styles.dotA]} />
              <View style={[styles.dot, styles.dotB]} />
              <View style={[styles.dot, styles.dotC]} />
            </View>

            <Text style={styles.prompt}>Rate the service quality for your order.</Text>
            <Text style={styles.hint}>
              Your comments and suggestions help us improve grocery delivery for Mayapur Bazaar.
            </Text>

            {order ? (
              <Text style={styles.orderMeta}>
                Order #{order.id}
                {itemCount > 0 ? ` · ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}
                {totalLabel ? ` · ${totalLabel}` : ''}
              </Text>
            ) : orderId ? (
              <Text style={styles.orderMeta}>Order #{orderId}</Text>
            ) : (
              <Text style={styles.orderMeta}>No order selected</Text>
            )}

            <View style={styles.stars}>
              <ProductStarRating
                rating={rating}
                size={36}
                interactive={!alreadySubmitted}
                onChange={(value) => {
                  setRating(value);
                  setError(null);
                }}
              />
            </View>

            {!alreadySubmitted ? (
              <View style={styles.tagRow}>
                {QUICK_TAGS.map((tag) => {
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
            ) : null}

            <TextInput
              value={body}
              onChangeText={setBody}
              editable={!alreadySubmitted && hydrated}
              placeholder="Write a Review"
              placeholderTextColor={colors.textSecondary}
              multiline
              style={[styles.input, alreadySubmitted && styles.inputDisabled]}
              accessibilityLabel="Delivery review text"
            />

            {alreadySubmitted ? (
              <Text style={styles.savedNote}>You already submitted a delivery review for this order on this device.</Text>
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
              label="Submit"
              showArrow={false}
              loading={submitting || !hydrated}
              disabled={!hydrated || !orderId}
              onPress={() => void submit()}
              accessibilityLabel="Submit delivery review"
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
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    gap: 12,
    ...shadow.card,
  },
  heroArt: {
    alignSelf: 'center',
    width: 168,
    height: 132,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  heroArc: {
    position: 'absolute',
    bottom: 18,
    width: 148,
    height: 74,
    borderTopLeftRadius: 74,
    borderTopRightRadius: 74,
    backgroundColor: colors.softYellow,
  },
  heroBubble: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    ...shadow.soft,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotA: {
    top: 18,
    left: 28,
    backgroundColor: colors.primaryDark,
  },
  dotB: {
    top: 36,
    right: 24,
    backgroundColor: colors.success,
  },
  dotC: {
    top: 10,
    right: 56,
    backgroundColor: '#94A3B8',
  },
  prompt: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  orderMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.primaryInk,
    textAlign: 'center',
  },
  stars: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
    minHeight: 120,
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
  savedNote: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.success,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 10,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
