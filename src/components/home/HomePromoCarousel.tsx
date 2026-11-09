import { Image } from 'expo-image';
import { router, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListViewToken,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { colors, fonts, homeLayout, radii, shadow } from '@/constants/theme';
import {
  resolveHomePromoBanners,
  type HomePromoBanner,
  type HomePromoBannerTone,
} from '@/data/homePromoBanners';
import { contentColumnWidth } from '@/utils/contentWidth';

const produce = require('@/assets/images/home/banner-produce.jpg');

const AUTOPLAY_MS = 3500;
const SIDE_GUTTER = homeLayout.gutter;
const CARD_GAP = 10;
const BANNER_HEIGHT = 148;
const BANNER_HEIGHT_COMPACT = 136;

type HomePromoCarouselProps = {
  banners?: readonly HomePromoBanner[];
};

export function HomePromoCarousel({ banners }: HomePromoCarouselProps) {
  const focused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = contentColumnWidth(windowWidth);
  const slides = useMemo(() => resolveHomePromoBanners(banners), [banners]);
  const cardWidth = Math.round(Math.min(contentWidth * 0.88, contentWidth - SIDE_GUTTER * 2));
  const snapInterval = cardWidth + CARD_GAP;
  const compact = contentWidth < 360;
  const bannerHeight = compact ? BANNER_HEIGHT_COMPACT : BANNER_HEIGHT;

  const listRef = useRef<FlatList<HomePromoBanner> | null>(null);
  const indexRef = useRef(0);
  const draggingRef = useRef(false);
  const appActiveRef = useRef(AppState.currentState === 'active');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      const safe = ((index % slides.length) + slides.length) % slides.length;
      listRef.current?.scrollToOffset({
        offset: safe * snapInterval,
        animated,
      });
      indexRef.current = safe;
      setActiveIndex(safe);
    },
    [slides.length, snapInterval],
  );

  const startTimer = useCallback(() => {
    clearTimer();
    if (
      reducedMotion ||
      !focused ||
      !appActiveRef.current ||
      draggingRef.current ||
      slides.length < 2
    ) {
      return;
    }
    timerRef.current = setInterval(() => {
      const next = (indexRef.current + 1) % slides.length;
      scrollToIndex(next, true);
    }, AUTOPLAY_MS);
  }, [clearTimer, focused, reducedMotion, scrollToIndex, slides.length]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      appActiveRef.current = state === 'active';
      if (state === 'active') {
        startTimer();
      } else {
        clearTimer();
      }
    });
    return () => sub.remove();
  }, [clearTimer, startTimer]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [clearTimer, startTimer]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<ListViewToken> }) => {
    const first = viewableItems.find((item) => item.isViewable && typeof item.index === 'number');
    if (typeof first?.index === 'number') {
      indexRef.current = first.index;
      setActiveIndex(first.index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  function syncIndexFromOffset(offset: number) {
    const nearest = Math.round(offset / snapInterval);
    indexRef.current = Math.max(0, Math.min(slides.length - 1, nearest));
    setActiveIndex(indexRef.current);
  }

  function onScrollBeginDrag() {
    draggingRef.current = true;
    clearTimer();
  }

  function onScrollEndDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    syncIndexFromOffset(event.nativeEvent.contentOffset.x);
    // Soft stops (no momentum) never fire onMomentumScrollEnd on some Android builds.
    if (Math.abs(event.nativeEvent.velocity?.x ?? 0) < 0.05) {
      draggingRef.current = false;
      startTimer();
    }
  }

  function onMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    draggingRef.current = false;
    syncIndexFromOffset(event.nativeEvent.contentOffset.x);
    startTimer();
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap} testID="home-promo-carousel">
      <FlatList
        ref={(node) => {
          listRef.current = node;
        }}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
        bounces={slides.length > 1}
        nestedScrollEnabled
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: snapInterval,
          offset: snapInterval * index,
          index,
        })}
        contentContainerStyle={{
          paddingLeft: SIDE_GUTTER,
          paddingRight: Math.max(SIDE_GUTTER, contentWidth - SIDE_GUTTER - cardWidth),
        }}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth, marginRight: CARD_GAP }}>
            <PromoBannerSlide banner={item} height={bannerHeight} compact={compact} />
          </View>
        )}
      />

      {slides.length > 1 ? (
        <View style={styles.dots} accessibilityRole="summary" accessibilityLabel={`Banner ${activeIndex + 1} of ${slides.length}`}>
          {slides.map((slide, index) => {
            const active = index === activeIndex;
            return (
              <Pressable
                key={slide.id}
                accessibilityRole="button"
                accessibilityLabel={`Go to banner ${index + 1}`}
                accessibilityState={{ selected: active }}
                hitSlop={8}
                onPress={() => {
                  clearTimer();
                  scrollToIndex(index, !reducedMotion);
                  startTimer();
                }}
                style={[styles.dot, active && styles.dotActive]}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function PromoBannerSlide({
  banner,
  height,
  compact,
}: {
  banner: HomePromoBanner;
  height: number;
  compact: boolean;
}) {
  const palette = TONE[banner.tone];
  const lightCta = banner.tone === 'violet' || banner.tone === 'green';

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={banner.accessibilityLabel}
      style={[styles.card, { height, backgroundColor: palette.background }]}>
      {banner.presentationImage || banner.showProduceImage ? (
        <Image
          source={banner.presentationImage ?? produce}
          style={styles.produce}
          contentFit="cover"
          accessible={false}
        />
      ) : null}

      <View
        style={[
          styles.copy,
          banner.presentationImage || banner.showProduceImage ? styles.copyWithImage : null,
        ]}>
        {banner.tone === 'violet' ? (
          <View style={styles.titleRow}>
            <AppIcon name="bolt" color={colors.primary} size={18} />
            <Text style={[styles.title, { color: palette.title }, compact && styles.titleCompact]} numberOfLines={2}>
              {banner.title.replace('\n', ' ')}
            </Text>
          </View>
        ) : (
          <Text style={[styles.title, { color: palette.title }, compact && styles.titleCompact]}>{banner.title}</Text>
        )}
        <Text style={[styles.subtitle, { color: palette.subtitle }]} numberOfLines={2}>
          {banner.subtitle}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={banner.ctaLabel}
          onPress={() => router.push(banner.href)}
          style={({ pressed }) => [
            styles.cta,
            lightCta ? styles.ctaLight : styles.ctaDark,
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.ctaLabel, lightCta ? styles.ctaLabelDark : styles.ctaLabelLight]}>
            {banner.ctaLabel}
          </Text>
          <AppIcon name="arrow" color={lightCta ? colors.text : colors.white} size={14} />
        </Pressable>
      </View>

      {banner.badgeLabel ? (
        <View
          style={[
            styles.badge,
            banner.tone === 'mint' && styles.badgeFresh,
            banner.tone === 'violet' && styles.badgeMinutes,
            banner.demoOnly && styles.badgeDemo,
          ]}
          importantForAccessibility="no"
          accessibilityElementsHidden>
          <Text
            style={[
              styles.badgeText,
              (banner.tone === 'mint' || banner.demoOnly) && styles.badgeTextLight,
            ]}>
            {banner.badgeLabel}
          </Text>
        </View>
      ) : null}

      {banner.demoOnly ? (
        <View style={styles.demoRibbon}>
          <Text style={styles.demoRibbonLabel}>DEMO</Text>
        </View>
      ) : null}
    </View>
  );
}

const TONE: Record<
  HomePromoBannerTone,
  { background: string; title: string; subtitle: string }
> = {
  warm: {
    background: '#FFF4C4',
    title: colors.text,
    subtitle: colors.textSecondary,
  },
  violet: {
    background: '#6D28D9',
    title: colors.white,
    subtitle: '#EDE9FE',
  },
  green: {
    background: '#22C55E',
    title: colors.white,
    subtitle: colors.white,
  },
  mint: {
    background: '#ECFDF3',
    title: colors.text,
    subtitle: colors.textSecondary,
  },
  cream: {
    background: colors.cream,
    title: colors.text,
    subtitle: colors.textSecondary,
  },
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
  },
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadow.soft,
  },
  produce: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '48%',
  },
  copy: {
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 14,
    paddingRight: 14,
    zIndex: 1,
    gap: 6,
  },
  copyWithImage: {
    width: '58%',
    paddingRight: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 22,
  },
  titleCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  cta: {
    marginTop: 6,
    alignSelf: 'flex-start',
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaDark: {
    backgroundColor: colors.text,
  },
  ctaLight: {
    backgroundColor: colors.white,
  },
  ctaLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
  },
  ctaLabelLight: {
    color: colors.white,
  },
  ctaLabelDark: {
    color: colors.text,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  badgeMinutes: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  badgeFresh: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success,
  },
  badgeDemo: {
    backgroundColor: colors.ink,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    lineHeight: 11,
    color: colors.text,
    textAlign: 'center',
  },
  badgeTextLight: {
    color: colors.white,
  },
  demoRibbon: {
    position: 'absolute',
    left: 10,
    top: 10,
    backgroundColor: colors.ink,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 2,
  },
  demoRibbonLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.white,
  },
  dots: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(17, 24, 39, 0.16)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primaryDark,
  },
  pressed: {
    opacity: 0.82,
  },
});
