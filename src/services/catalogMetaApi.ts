import {
    CATEGORIES_API,
    PRODUCT_IMAGES_API,
    SUBCATEGORIES_API,
} from "@/constants/api";
import { PRODUCTS_COMPANY } from "@/constants/liveData";
import { getJson, isCancelledApiResult } from "@/services/api/http";
import type { Category, LiveCategoryParent } from "@/types/category";
import {
    liveShelfIdForCategory,
    liveShelfIdForSubcategory,
    titleCaseCategory,
} from "@/utils/liveCatalogMeta";
import {
    normalizeBoundedCategoryImageSource,
    normalizeProductImageSource,
    recyclingKeyForImageUri,
} from "@/utils/productImageSource";
import type { ImageSource } from "expo-image";

const CATEGORIES_TIMEOUT_MS = 90_000;
const SUBCATEGORIES_TIMEOUT_MS = 45_000;
const PRODUCT_IMAGES_TIMEOUT_MS = 60_000;

export type LiveCategoryRecord = {
  id: string;
  name: string;
  image: ImageSource;
};

export type LiveSubcategoryRecord = {
  id: string;
  parentId: string;
  parentName: string;
  name: string;
  image: ImageSource;
};

export type CategoriesApiResult =
  | { ok: true; categories: LiveCategoryRecord[] }
  | { ok: false; message: string; cancelled?: boolean };

export type SubcategoriesApiResult =
  | { ok: true; subcategories: LiveSubcategoryRecord[] }
  | { ok: false; message: string; cancelled?: boolean };

export type ProductImagesApiResult =
  | { ok: true; images: ImageSource[] }
  | { ok: false; message: string; cancelled?: boolean };

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function textField(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
}

function extractRows(body: unknown): unknown[] {
  if (Array.isArray(body)) {
    return body;
  }
  const record = asRecord(body);
  if (!record) {
    return [];
  }
  for (const key of [
    "data",
    "Data",
    "categories",
    "Categories",
    "items",
    "Items",
    "result",
    "Result",
  ]) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return nested;
    }
  }
  return [record];
}

function serverMessage(body: unknown): string | null {
  const record = Array.isArray(body) ? asRecord(body[0]) : asRecord(body);
  if (!record) {
    return typeof body === "string" && body.trim()
      ? body.trim().slice(0, 180)
      : null;
  }
  return textField(
    record.Message,
    record.message,
    record.ExceptionMessage,
    record.title,
  );
}

/** GET /api/values/categories?company={company} — names only; oversized CategoryImage dropped. */
export async function fetchCategories(
  company: string = PRODUCTS_COMPANY,
  options?: { signal?: AbortSignal },
): Promise<CategoriesApiResult> {
  const trimmed = company.trim();
  if (!trimmed) {
    return {
      ok: false,
      message: "Set EXPO_PUBLIC_PRODUCTS_COMPANY to load categories.",
    };
  }

  const response = await getJson(
    CATEGORIES_API.list,
    { company: trimmed },
    { signal: options?.signal, timeoutMs: CATEGORIES_TIMEOUT_MS },
  );

  if (isCancelledApiResult(response) || options?.signal?.aborted) {
    return { ok: false, message: "Request cancelled.", cancelled: true };
  }
  if (response.status === 0) {
    return {
      ok: false,
      message:
        serverMessage(response.body) ?? "Unable to connect. Please try again.",
    };
  }
  if (response.status < 200 || response.status >= 300) {
    return {
      ok: false,
      message:
        serverMessage(response.body) ??
        `Categories request failed (${response.status}).`,
    };
  }

  const rows = extractRows(response.body);
  const categories: LiveCategoryRecord[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const record = asRecord(row);
    if (!record) {
      continue;
    }
    const name = textField(
      record.Category,
      record.category,
      record.Name,
      record.name,
    );
    if (!name) {
      continue;
    }
    const id = liveShelfIdForCategory(name);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    categories.push({
      id,
      name: titleCaseCategory(name),
      image: normalizeBoundedCategoryImageSource(
        record.CategoryImage ?? record.categoryImage,
      ) ?? { uri: "" },
    });
  }

  if (categories.length === 0) {
    return {
      ok: false,
      message:
        serverMessage(response.body) ??
        "No categories were returned for this company.",
    };
  }

  return { ok: true, categories };
}

/** GET /api/values/subcategories?company={company}&category={category} */
export async function fetchSubcategories(
  category: string,
  company: string = PRODUCTS_COMPANY,
  options?: { signal?: AbortSignal },
): Promise<SubcategoriesApiResult> {
  const trimmedCompany = company.trim();
  const trimmedCategory = category.trim();
  if (!trimmedCompany) {
    return {
      ok: false,
      message: "Set EXPO_PUBLIC_PRODUCTS_COMPANY to load subcategories.",
    };
  }
  if (!trimmedCategory) {
    return { ok: false, message: "Category is required for subcategories." };
  }

  const response = await getJson(
    SUBCATEGORIES_API.list,
    { company: trimmedCompany, category: trimmedCategory },
    { signal: options?.signal, timeoutMs: SUBCATEGORIES_TIMEOUT_MS },
  );

  if (isCancelledApiResult(response) || options?.signal?.aborted) {
    return { ok: false, message: "Request cancelled.", cancelled: true };
  }
  if (response.status === 0) {
    return {
      ok: false,
      message:
        serverMessage(response.body) ?? "Unable to connect. Please try again.",
    };
  }
  if (response.status < 200 || response.status >= 300) {
    return {
      ok: false,
      message:
        serverMessage(response.body) ??
        `Subcategories request failed (${response.status}).`,
    };
  }

  const parentId = liveShelfIdForCategory(trimmedCategory);
  const rows = extractRows(response.body);
  const subcategories: LiveSubcategoryRecord[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const record = asRecord(row);
    if (!record) {
      continue;
    }
    const parentName =
      textField(record.Category, record.category) ?? trimmedCategory;
    const name = textField(
      record.Subcategory,
      record.SubCategory,
      record.subcategory,
      record.Name,
      record.name,
    );
    if (!name) {
      continue;
    }
    const id = liveShelfIdForSubcategory(parentName, name);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    subcategories.push({
      id,
      parentId,
      parentName: titleCaseCategory(parentName),
      name: titleCaseCategory(name),
      image: normalizeBoundedCategoryImageSource(
        record.SubcategoryImage ??
          record.SubCategoryImage ??
          record.subcategoryImage,
      ) ?? { uri: "" },
    });
  }

  // HTTP succeeded — empty list is a valid catalogue state (cacheable).
  return { ok: true, subcategories };
}

/** GET /api/values/productimages?company={company}&ProductId={ProductId} — Image2–4. */
export async function fetchProductImages(
  productId: string,
  company: string = PRODUCTS_COMPANY,
  options?: { signal?: AbortSignal },
): Promise<ProductImagesApiResult> {
  const trimmedCompany = company.trim();
  const trimmedId = productId.trim();
  if (!trimmedCompany) {
    return {
      ok: false,
      message: "Set EXPO_PUBLIC_PRODUCTS_COMPANY to load product images.",
    };
  }
  if (!trimmedId) {
    return { ok: false, message: "ProductId is required." };
  }

  const response = await getJson(
    PRODUCT_IMAGES_API.list,
    { company: trimmedCompany, ProductId: trimmedId },
    { signal: options?.signal, timeoutMs: PRODUCT_IMAGES_TIMEOUT_MS },
  );

  if (isCancelledApiResult(response) || options?.signal?.aborted) {
    return { ok: false, message: "Request cancelled.", cancelled: true };
  }
  if (response.status === 0) {
    return {
      ok: false,
      message:
        serverMessage(response.body) ?? "Unable to connect. Please try again.",
    };
  }
  if (response.status < 200 || response.status >= 300) {
    return {
      ok: false,
      message:
        serverMessage(response.body) ??
        `Product images request failed (${response.status}).`,
    };
  }

  const rows = extractRows(response.body);
  const images: ImageSource[] = [];
  const seen = new Set<string>();
  const push = (value: unknown) => {
    const source = normalizeProductImageSource(value);
    if (
      !source ||
      typeof source !== "object" ||
      !("uri" in source) ||
      typeof source.uri !== "string"
    ) {
      return;
    }
    const key = source.cacheKey ?? recyclingKeyForImageUri(source.uri);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    images.push(source);
  };

  for (const row of rows) {
    const record = asRecord(row);
    if (!record) {
      if (typeof row === "string") {
        push(row);
      }
      continue;
    }
    push(record.Image2 ?? record.image2);
    push(record.Image3 ?? record.image3);
    push(record.Image4 ?? record.image4);
    push(record.Image1 ?? record.image1);
    push(record.ImageUrl ?? record.imageUrl ?? record.Image ?? record.image);
  }

  return { ok: true, images };
}

function hasUsableUri(image: ImageSource | undefined): boolean {
  return (
    typeof image === "object" &&
    image != null &&
    "uri" in image &&
    typeof image.uri === "string" &&
    image.uri.trim().length > 0
  );
}

/** Merge API category rows onto UI Category chips (keeps product-derived fallbacks). */
export function mergeCategoriesWithProducts(
  apiCategories: readonly LiveCategoryRecord[],
  productDerived: readonly Category[],
): Category[] {
  if (apiCategories.length === 0) {
    return [...productDerived];
  }
  const byId = new Map<string, Category>();
  for (const row of productDerived) {
    byId.set(row.id, row);
  }
  for (const row of apiCategories) {
    const existing = byId.get(row.id);
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      image: hasUsableUri(row.image)
        ? row.image
        : (existing?.image ?? row.image),
    });
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Ensure GET /categories parents appear in the home/category tree. */
export function mergeRemoteCategoriesIntoTree(
  tree: readonly LiveCategoryParent[],
  apiCategories: readonly LiveCategoryRecord[],
): LiveCategoryParent[] {
  if (apiCategories.length === 0) {
    return [...tree];
  }
  const byId = new Map(
    tree.map((parent) => [
      parent.id,
      { ...parent, children: [...parent.children] },
    ]),
  );
  for (const row of apiCategories) {
    const existing = byId.get(row.id);
    if (!existing) {
      byId.set(row.id, {
        id: row.id,
        name: row.name,
        image: row.image,
        children: [
          {
            id: row.id,
            parentId: row.id,
            name: row.name,
            image: row.image,
            productCount: 0,
          },
        ],
      });
      continue;
    }
    if (hasUsableUri(row.image)) {
      existing.image = row.image;
    }
    existing.name = row.name;
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
