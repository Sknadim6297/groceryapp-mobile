import type { ImageSource } from "expo-image";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { CatalogImage } from "@/components/home/CatalogImage";
import { SoftIcon } from "@/components/ui/SoftIcon";
import { colors, fonts } from "@/constants/theme";
import { useCatalog } from "@/context/CatalogContext";
import { listVisibleHomeShoppingShortcuts } from "@/data/shoppingCollections";
import type { LiveCategoryParent } from "@/types/category";
import type { ShoppingCollectionId } from "@/types/shoppingCollection";
import { enrichLiveCategoryTreePresentation } from "@/utils/catalogPresentationAssets";
import { deriveLiveCategoryTree } from "@/utils/liveCatalogMeta";

const INK = "#171717";

/** Curated collage art for demo shopping shortcuts (local assets only). */
const IMAGE_BY_COLLECTION: Record<ShoppingCollectionId, ImageSource> = {
  all: require("@/assets/images/home/grains.jpg"),
  fresh: require("@/assets/images/home/fresh-fruits.jpg"),
  diwali: require("@/assets/images/home/snacks.jpg"),
  electronics: require("@/assets/images/home/personal.jpg"),
  organic: require("@/assets/images/home/produce.jpg"),
};

/**
 * Home header Field / Category strip.
 * Live catalogue → ERP Field parents (with local presentation fallbacks).
 * Demo / preview → Fresh / Diwali / Electronics / Organic collections.
 */
export function HomeCategoryTabs() {
  const { width } = useWindowDimensions();
  const { liveEnabled, products } = useCatalog();
  const liveParents = useMemo(
    () =>
      liveEnabled
        ? enrichLiveCategoryTreePresentation(deriveLiveCategoryTree(products))
        : [],
    [liveEnabled, products],
  );
  const demoTabs = listVisibleHomeShoppingShortcuts();

  const compact = width < 360;
  const tabWidth = compact ? 62 : width < 420 ? 66 : 70;
  const imageWidth = compact ? 52 : 56;
  const imageHeight = compact ? 52 : 56;

  function openLiveParent(parent: LiveCategoryParent) {
    const hasSubcategories = parent.children.some(
      (child) => child.id !== parent.id,
    );
    if (hasSubcategories || parent.children.length > 1) {
      router.push({ pathname: "/category/[id]", params: { id: parent.id } });
      return;
    }
    router.push({ pathname: "/shop", params: { category: parent.id } });
  }

  function openCollection(id: ShoppingCollectionId) {
    router.push({
      pathname: "/collection/[id]",
      params: { id },
    });
  }

  if (liveEnabled) {
    if (liveParents.length === 0) {
      return null;
    }
    return (
      <View style={styles.strip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          style={styles.scroller}
          contentContainerStyle={styles.row}
        >
          {liveParents.map((parent) => (
            <Pressable
              key={parent.id}
              accessibilityRole="button"
              accessibilityLabel={parent.name}
              onPress={() => openLiveParent(parent)}
              style={[styles.tab, { width: tabWidth }]}
              testID={`home-category-${parent.id}`}
            >
              <View
                style={[
                  styles.imageFrame,
                  { width: imageWidth, height: imageHeight },
                ]}
              >
                {hasUsableImage(parent.image) ? (
                  <CatalogImage
                    source={parent.image}
                    label={parent.name}
                    style={styles.imageFill}
                    contentFit="contain"
                  />
                ) : (
                  <View style={styles.iconFallback}>
                    <SoftIcon name="box" size={28} />
                  </View>
                )}
              </View>
              <Text
                numberOfLines={2}
                style={[styles.label, compact && styles.labelCompact]}
              >
                {parent.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.strip}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={styles.scroller}
        contentContainerStyle={styles.row}
      >
        {demoTabs.map((tab) => (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={
              tab.badgeLabel ? `${tab.title}. ${tab.badgeLabel}` : tab.title
            }
            onPress={() => openCollection(tab.id)}
            style={[styles.tab, { width: tabWidth }]}
            testID={`home-shortcut-${tab.id}`}
          >
            <View
              style={[
                styles.imageFrame,
                { width: imageWidth, height: imageHeight },
              ]}
            >
              {tab.badgeLabel ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badgeLabel}</Text>
                </View>
              ) : null}
              <CatalogImage
                source={IMAGE_BY_COLLECTION[tab.id]}
                label={shortcutLabel(tab.id)}
                style={styles.imageFill}
                contentFit="contain"
              />
            </View>
            <Text
              numberOfLines={2}
              style={[styles.label, compact && styles.labelCompact]}
            >
              {shortcutLabel(tab.id)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function hasUsableImage(source: ImageSource | undefined): boolean {
  if (typeof source === "number") {
    return true;
  }
  if (
    typeof source === "object" &&
    source != null &&
    "uri" in source &&
    typeof source.uri === "string" &&
    source.uri.trim().length > 0
  ) {
    return true;
  }
  return false;
}

function shortcutLabel(id: ShoppingCollectionId): string {
  switch (id) {
    case "all":
      return "All";
    case "fresh":
      return "Fresh";
    case "diwali":
      return "Diwali";
    case "electronics":
      return "Electronics";
    case "organic":
      return "Organic";
    default:
      return id;
  }
}

const styles = StyleSheet.create({
  strip: {
    marginTop: 8,
    backgroundColor: colors.cream,
    paddingTop: 4,
    paddingBottom: 8,
  },
  scroller: {
    flexGrow: 0,
  },
  row: {
    paddingLeft: 12,
    paddingRight: 16,
    alignItems: "flex-start",
    gap: 8,
  },
  tab: {
    alignItems: "center",
  },
  imageFrame: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.softBackground,
  },
  imageFill: {
    width: "100%",
    height: "100%",
  },
  iconFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    zIndex: 2,
    alignSelf: "center",
    backgroundColor: INK,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 7,
    lineHeight: 9,
    color: colors.white,
  },
  label: {
    marginTop: 4,
    fontFamily: fonts.semibold,
    fontSize: 10,
    lineHeight: 13,
    color: INK,
    textAlign: "center",
    width: "100%",
  },
  labelCompact: {
    fontSize: 10,
    lineHeight: 12,
  },
});
