import { PRODUCTS_API } from '@/constants/api';
import { PRODUCTS_COMPANY } from '@/constants/liveData';
import { getJson } from '@/services/api/http';
import type { DemoProduct } from '@/types/catalog';
import { hasSuccessStatus } from '@/services/api/interpretCustomerResponse';
import { collectProductImageSources, normalizeProductImageSource } from '@/utils/productImageSource';

export type ProductsApiResult =
  | { ok: true; products: DemoProduct[]; rawCount: number }
  | { ok: false; message: string };

const FAILURE_STATUS = /^(false|fail|failed|error|invalid)$/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function firstRecord(body: unknown): Record<string, unknown> | null {
  if (Array.isArray(body)) {
    return asRecord(body[0]);
  }
  return asRecord(body);
}

function textField(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
}

function numberField(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value.replace(/,/g, '').trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function boolField(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
        return true;
      }
      if (normalized === 'false' || normalized === '0' || normalized === 'no') {
        return false;
      }
    }
    if (typeof value === 'number') {
      if (value === 1) {
        return true;
      }
      if (value === 0) {
        return false;
      }
    }
  }
  return undefined;
}

function isStatusEnvelope(record: Record<string, unknown>): boolean {
  const status = textField(record.Status, record.status);
  if (!status) {
    return false;
  }
  const hasProductShape =
    textField(record.Id, record.id, record.ProductId, record.productId, record.Name, record.name, record.ProductName) !=
    null;
  return !hasProductShape;
}

/**
 * Maps one API object onto DemoProduct only when id, name, and price are present.
 * Does not invent prices, stock, or images.
 */
export function mapProductRecord(value: unknown): DemoProduct | null {
  const record = asRecord(value);
  if (!record || isStatusEnvelope(record)) {
    return null;
  }

  const id = textField(record.Id, record.id, record.ProductId, record.productId, record.SKU, record.Sku, record.Code);
  const name = textField(record.Name, record.name, record.ProductName, record.productName, record.Title, record.title);
  const price = numberField(
    record.Price,
    record.price,
    record.SellingPrice,
    record.sellingPrice,
    record.Rate,
    record.rate,
    record.Amount,
  );

  if (!id || !name || price === null || price < 0) {
    return null;
  }

  const brand = textField(record.Brand, record.brand);
  const category = textField(record.Category, record.category);
  const subcategory = textField(
    record.SubCategory,
    record.Subcategory,
    record.subCategory,
    record.SubCategoryName,
    record.subcategory,
  );
  const categoryImage = normalizeProductImageSource(
    record.CategoryImage ?? record.categoryImage ?? record.CategoryImg,
  );
  const subcategoryImage = normalizeProductImageSource(
    record.SubcategoryImage ??
      record.SubCategoryImage ??
      record.subcategoryImage ??
      record.SubcategoryImg,
  );
  const unit =
    textField(record.Unit, record.unit, record.PackSize, record.packSize, record.Size, record.size) ?? brand ?? '';
  const compareAt = numberField(record.MRP, record.Mrp, record.mrp, record.CompareAt, record.compareAt);
  const discountPercent = numberField(record.DiscountPercent, record.discountPercent);
  const discountLabel =
    textField(record.DiscountLabel, record.discountLabel, record.OfferLabel, record.offerLabel) ??
    (discountPercent != null && discountPercent > 0 ? `${Math.round(discountPercent)}% OFF` : null);
  let available = boolField(
    record.Available,
    record.available,
    record.InStock,
    record.inStock,
    record.StockAvailable,
    record.stockAvailable,
  );
  const stock = numberField(record.AvailableStock, record.availableStock, record.Stock, record.stock);
  if (available === undefined && stock !== null) {
    available = stock > 0;
  }

  const sources = collectProductImageSources(record);
  if (sources.length === 0) {
    // Placeholder — CatalogImage shows the grey fallback for empty / failed uris.
    sources.push({ uri: '' });
  }

  const product: DemoProduct = {
    id,
    name,
    unit,
    price,
    image: sources[0]!,
    images: sources.length > 1 ? sources : [sources[0]!, sources[0]!],
  };

  if (compareAt != null && compareAt > price) {
    product.compareAt = compareAt;
  }
  if (discountLabel) {
    product.discountLabel = discountLabel;
  }
  if (available !== undefined) {
    product.available = available;
  }
  if (category) {
    product.category = category;
  }
  if (subcategory) {
    product.subcategory = subcategory;
  }
  if (categoryImage) {
    product.categoryImage = categoryImage;
  }
  if (subcategoryImage) {
    product.subcategoryImage = subcategoryImage;
  }
  if (brand) {
    product.brand = brand;
  }

  return product;
}

function serverMessage(body: unknown): string | null {
  const record = firstRecord(body);
  if (!record) {
    return typeof body === 'string' && body.trim() ? body.trim().slice(0, 180) : null;
  }
  return textField(record.Message, record.message, record.ExceptionMessage, record.title);
}

function looksLikeFailure(body: unknown): boolean {
  const record = firstRecord(body);
  if (!record) {
    return false;
  }
  if (isStatusEnvelope(record)) {
    const status = textField(record.Status, record.status);
    if (status && FAILURE_STATUS.test(status)) {
      return true;
    }
    if (status && status.toLowerCase() === 'success') {
      return false;
    }
    // Status present without product fields and not Success → treat as failure envelope.
    if (status && !hasSuccessStatus(body)) {
      return true;
    }
  }
  return false;
}

function extractCandidateRecords(body: unknown): unknown[] {
  if (Array.isArray(body)) {
    return body;
  }
  const record = asRecord(body);
  if (!record) {
    return [];
  }
  for (const key of ['data', 'Data', 'products', 'Products', 'items', 'Items', 'result', 'Result']) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return nested;
    }
  }
  return [record];
}

/** GET /api/values/products?company={company} */
export async function fetchProducts(company: string = PRODUCTS_COMPANY): Promise<ProductsApiResult> {
  const trimmed = company.trim();
  if (!trimmed) {
    return {
      ok: false,
      message: 'Set EXPO_PUBLIC_PRODUCTS_COMPANY to load live products.',
    };
  }

  const response = await getJson(PRODUCTS_API.list, { company: trimmed });
  if (response.status === 0) {
    return {
      ok: false,
      message: serverMessage(response.body) ?? 'Unable to connect. Please try again.',
    };
  }
  if (response.status < 200 || response.status >= 300) {
    return {
      ok: false,
      message: serverMessage(response.body) ?? `Products request failed (${response.status}).`,
    };
  }

  if (looksLikeFailure(response.body)) {
    return {
      ok: false,
      message: serverMessage(response.body) ?? 'The server did not return products for this company.',
    };
  }

  const candidates = extractCandidateRecords(response.body);
  const products: DemoProduct[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const mapped = mapProductRecord(candidate);
    if (!mapped || seen.has(mapped.id)) {
      continue;
    }
    seen.add(mapped.id);
    products.push(mapped);
  }

  if (products.length === 0) {
    return {
      ok: false,
      message:
        serverMessage(response.body) ??
        'No product records with id, name, and price were returned. Ask the backend for a published JSON sample.',
    };
  }

  return { ok: true, products, rawCount: candidates.length };
}
