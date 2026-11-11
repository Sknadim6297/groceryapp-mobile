import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CatalogImage } from "@/components/home/CatalogImage";
import { DiscountOff } from "@/components/ui/DiscountOff";
import { colors, fonts } from "@/constants/theme";
import type { DemoProduct } from "@/types/catalog";
import { productPhotos } from "@/utils/productPhotos";

type Pager = {
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
};

export function ProductGallery({ product }: { product: DemoProduct }) {
  const photos = productPhotos(product);
  const pager = useRef<Pager | null>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [seenProductId, setSeenProductId] = useState(product.id);
  if (product.id !== seenProductId) {
    setSeenProductId(product.id);
    setIndex(0);
  }
  const selected = photos.length === 0 ? 0 : Math.min(index, photos.length - 1);
  const frameHeight = frameWidth > 0 ? Math.round(frameWidth / 1.05) : 0;

  useEffect(() => {
    if (frameWidth > 0) {
      pager.current?.scrollTo({ x: 0, animated: false });
    }
  }, [product.id, frameWidth]);

  function show(next: number) {
    if (photos.length === 0) {
      return;
    }
    const safe = Math.max(0, Math.min(next, photos.length - 1));
    setIndex(safe);
    if (frameWidth > 0) {
      pager.current?.scrollTo({ x: safe * frameWidth, animated: true });
    }
  }

  return (
    <View style={styles.wrap}>
      <View
        style={styles.frame}
        onLayout={(event) => {
          const nextWidth = Math.round(event.nativeEvent.layout.width);
          if (nextWidth > 0 && nextWidth !== frameWidth) {
            setFrameWidth(nextWidth);
          }
        }}
      >
        {photos.length === 0 ? (
          <View
            style={[styles.missing, frameHeight > 0 ? { height: frameHeight } : styles.missingFill]}
            accessibilityRole="image"
            accessibilityLabel={`${product.name}. Image unavailable.`}
          >
            <Text style={styles.missingLabel}>Image unavailable</Text>
          </View>
        ) : (
          <ScrollView
            ref={(node) => {
              pager.current = node;
            }}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            style={frameHeight > 0 ? { height: frameHeight } : undefined}
            onMomentumScrollEnd={(event) => {
              if (frameWidth <= 0 || photos.length === 0) {
                return;
              }
              const next = Math.round(
                event.nativeEvent.contentOffset.x / frameWidth,
              );
              setIndex(Math.max(0, Math.min(next, photos.length - 1)));
            }}
          >
            {photos.map((photo, photoIndex) => (
              <View
                key={`${product.id}-${photoIndex}`}
                style={{
                  width: frameWidth || "100%",
                  height: frameHeight || "100%",
                }}
              >
                <CatalogImage
                  source={photo}
                  style={styles.photo}
                  label={`${product.name}, photo ${photoIndex + 1} of ${photos.length}`}
                  contentFit="contain"
                  identityKey={`${product.id}:${photoIndex}`}
                />
              </View>
            ))}
          </ScrollView>
        )}
        {product.compareAt != null &&
        product.compareAt > product.price &&
        product.discountLabel ? (
          <DiscountOff label={product.discountLabel} />
        ) : null}
      </View>

      {photos.length > 1 ? (
        <View style={styles.dots}>
          {photos.map((_, photoIndex) => (
            <View
              key={photoIndex}
              style={[styles.dot, photoIndex === selected && styles.dotOn]}
            />
          ))}
        </View>
      ) : null}

      {photos.length > 1 ? (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
        >
          {photos.map((photo, photoIndex) => {
            const active = photoIndex === selected;
            return (
              <Pressable
                key={`${product.id}-thumb-${photoIndex}`}
                accessibilityRole="button"
                accessibilityLabel={`Show photo ${photoIndex + 1} of ${product.name}`}
                accessibilityState={{ selected: active }}
                onPress={() => show(photoIndex)}
                style={[styles.thumb, active && styles.thumbOn]}
              >
                <CatalogImage
                  source={photo}
                  style={styles.thumbPhoto}
                  contentFit="cover"
                  identityKey={`${product.id}:thumb:${photoIndex}`}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    paddingBottom: 4,
  },
  frame: {
    width: "100%",
    aspectRatio: 1.05,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  missing: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.softBackground,
  },
  missingFill: {
    ...StyleSheet.absoluteFill,
  },
  missingLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#D4D4D4",
  },
  dotOn: {
    backgroundColor: colors.text,
  },
  thumbs: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  thumbOn: {
    borderColor: colors.primary,
  },
  thumbPhoto: {
    width: "100%",
    height: "100%",
  },
});
