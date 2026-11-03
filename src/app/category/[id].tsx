import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandCatalogBanner } from "@/components/catalog/BrandCatalogBanner";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogSearchField } from "@/components/catalog/CatalogSearchField";
import { SubcategoryCard } from "@/components/category/SubcategoryCard";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors, fonts, homeLayout } from "@/constants/theme";
import {
    findCatalogParent,
    listSubcategoriesForParent,
} from "@/data/subcategoryCatalog";
import type { CatalogSubcategory } from "@/types/subcategory";
import { filterSubcategories } from "@/utils/subcategorySearch";

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default function SubcategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const parentId = paramValue(id);
  const parent = findCatalogParent(parentId);
  const [query, setQuery] = useState("");

  const subcategories = useMemo(
    () => listSubcategoriesForParent(parentId),
    [parentId],
  );
  const visible = useMemo(
    () => filterSubcategories(subcategories, query),
    [query, subcategories],
  );

  const gutter = homeLayout.gutter;
  const columns = 2;
  const gap = 10;
  const contentWidth = Math.min(width, homeLayout.maxWidth);
  const cardWidth = (contentWidth - gutter * 2 - gap) / columns;

  function openShop(subcategory: CatalogSubcategory) {
    router.push({
      pathname: "/shop",
      params: { category: subcategory.id },
    });
  }

  if (!parent) {
    return (
      <View style={styles.screen}>
        <AppScreenHeader
          title="Subcategories"
          fallbackHref="/home"
          titleWeight="semibold"
        />
        <View
          style={[
            styles.fallback,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <Text style={styles.fallbackTitle}>Category unavailable</Text>
          <Text style={styles.fallbackBody}>
            This category could not be found. Choose another category from Home
            or Shop.
          </Text>
          <PrimaryButton
            label="Back to Home"
            onPress={() => router.replace("/home")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppScreenHeader
        title="Subcategories"
        fallbackHref="/home"
        titleWeight="semibold"
      />

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: Math.max(insets.bottom, 20) + 12,
            maxWidth: homeLayout.maxWidth,
            alignSelf: "center",
            width: "100%",
          },
        ]}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View>
            <BrandCatalogBanner />
            <CatalogBreadcrumb
              crumbs={[
                { label: "Shop", onPress: () => router.push("/shop") },
                { label: parent.name },
              ]}
            />
            <CatalogSearchField
              value={query}
              onChange={setQuery}
              placeholder="Search subcategories"
              accessibilityLabel="Search subcategories"
              testID="subcategory-search"
            />
            <View style={styles.headerSpacer} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {query.trim().length > 0
                ? "No matching subcategories"
                : "No subcategories yet"}
            </Text>
            <Text style={styles.emptyBody}>
              {query.trim().length > 0
                ? "Try a different search term."
                : "This category has no shelves in the on-device catalogue yet."}
            </Text>
            {query.trim().length > 0 ? (
              <PrimaryButton
                label="Clear search"
                onPress={() => setQuery("")}
              />
            ) : (
              <PrimaryButton
                label="Browse Shop"
                onPress={() => router.push("/shop")}
              />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <SubcategoryCard subcategory={item} onPress={openShop} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        testID="subcategories-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: homeLayout.gutter,
  },
  row: {
    gap: 10,
    marginBottom: 10,
  },
  headerSpacer: {
    height: 12,
  },
  empty: {
    paddingHorizontal: 12,
    paddingTop: 36,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.text,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  fallback: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 12,
  },
  fallbackTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    textAlign: "center",
  },
  fallbackBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
});
