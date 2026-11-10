import { Image, type ImageContentFit, type ImageSource, type ImageStyle } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/theme';
import { recyclingKeyForImageUri } from '@/utils/productImageSource';

type CatalogImageProps = {
  source: ImageSource;
  style: StyleProp<ImageStyle>;
  label?: string;
  contentFit?: ImageContentFit;
};

/**
 * Catalog product image with pulse placeholder while loading and a soft fallback on failure.
 * Supports HTTP(S) URLs and data-URI / Base64 sources. Uses memory-disk cache.
 */
export function CatalogImage({ source, style, label, contentFit = 'contain' }: CatalogImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const remote = isRemote(source);
  const localModule = typeof source === 'number';
  const uri = remote ? source.uri.trim() : '';
  const usable = remote && uri.length > 0;
  const explicitCacheKey =
    typeof source === 'object' &&
    source != null &&
    'cacheKey' in source &&
    typeof source.cacheKey === 'string' &&
    source.cacheKey.length > 0
      ? source.cacheKey
      : undefined;
  // Prefer explicit cacheKey (content fingerprint) so ERP image replacements invalidate disk cache.
  const recyclingKey = usable ? explicitCacheKey ?? recyclingKeyForImageUri(uri) : undefined;

  // Reset load/error when the URI changes (list recycling / gallery thumb swap).
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [recyclingKey]);

  if (failed || (remote && !usable)) {
    return (
      <View
        style={[style, styles.fallback]}
        accessibilityRole="image"
        accessibilityLabel={label ? `${label}. Image unavailable.` : 'Image unavailable.'}
      />
    );
  }

  // Local require() assets — render immediately (no network load gate).
  if (localModule) {
    return (
      <View style={style}>
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          cachePolicy="memory-disk"
          {...(label ? { accessible: true as const, accessibilityLabel: label } : {})}
        />
      </View>
    );
  }

  return (
    <View style={style}>
      {!loaded ? <ImagePlaceholder /> : null}
      <Image
        source={source}
        style={[StyleSheet.absoluteFill, !loaded ? styles.hiddenUntilLoaded : null]}
        contentFit={contentFit}
        cachePolicy="memory-disk"
        recyclingKey={recyclingKey}
        transition={loaded ? 120 : 0}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        {...(label ? { accessible: true as const, accessibilityLabel: label } : {})}
      />
    </View>
  );
}

function ImagePlaceholder() {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.45);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (reduced) {
      // eslint-disable-next-line react-hooks/immutability -- shared value write
      opacity.value = 0.35;
      return;
    }
    opacity.value = withRepeat(withTiming(0.85, { duration: 700 }), -1, true);
  }, [opacity, reduced]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.placeholder, animated]}
    />
  );
}

function isRemote(source: ImageSource): source is { uri: string } {
  return typeof source === 'object' && source != null && 'uri' in source && typeof source.uri === 'string';
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.softBackground,
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.borderSubtle,
  },
  hiddenUntilLoaded: {
    opacity: 0,
  },
});
