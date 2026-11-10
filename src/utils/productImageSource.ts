import type { ImageSource } from 'expo-image';

const INVALID_LITERALS = /^(system\.byte\[\]|null|undefined|nan)$/i;
const DATA_URI = /^data:image\/[a-z0-9.+-]+;base64,/i;
const HTTP_URL = /^https?:\/\//i;
/** Loose Base64 (allows whitespace); length gate avoids treating short filenames as images. */
const BASE64_BODY = /^[A-Za-z0-9+/=\s]+$/;

/**
 * Category / subcategory chips are small UI surfaces. Multi-MB Base64 icons from ERP
 * inflate React state and decode cost — skip oversized inline payloads (URLs always kept).
 * Measured live payload had CategoryImage / SubcategoryImage fields up to ~4.4MB each.
 */
export const MAX_INLINE_CATEGORY_IMAGE_CHARS = 250_000;

export type ProductImageMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

/**
 * Turns API image fields (URL, data URI, or raw Base64) into an Expo Image `{ uri, cacheKey }` source.
 * Returns null for System.Byte[], filenames, empty, or invalid values — never invents bytes.
 */
export function normalizeProductImageSource(value: unknown): ImageSource | null {
  const uri = normalizeProductImageUri(value);
  if (!uri) {
    return null;
  }
  return { uri, cacheKey: recyclingKeyForImageUri(uri) };
}

/**
 * Like normalizeProductImageSource, but drops oversized inline Base64 (keeps HTTP URLs).
 * Used for CategoryImage / SubcategoryImage so product cards are not holding 4MB category icons.
 */
export function normalizeBoundedCategoryImageSource(value: unknown): ImageSource | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (
      trimmed.length > MAX_INLINE_CATEGORY_IMAGE_CHARS &&
      !HTTP_URL.test(trimmed) &&
      !DATA_URI.test(trimmed.slice(0, 32))
    ) {
      return null;
    }
    if (DATA_URI.test(trimmed) && trimmed.length > MAX_INLINE_CATEGORY_IMAGE_CHARS + 32) {
      return null;
    }
  }
  return normalizeProductImageSource(value);
}

/** Browser / RN compatible URI string, or null when unavailable. */
export function normalizeProductImageUri(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed || INVALID_LITERALS.test(trimmed)) {
    return null;
  }
  if (HTTP_URL.test(trimmed)) {
    return trimmed;
  }
  if (DATA_URI.test(trimmed)) {
    return trimmed.replace(/\s+/g, '');
  }

  const compact = trimmed.replace(/\s+/g, '');
  if (compact.length < 32 || !BASE64_BODY.test(compact)) {
    // Filenames like "photo.jpg" or garbage — not a loadable remote/data image.
    return null;
  }

  const mime = detectBase64ImageMime(compact);
  if (!mime) {
    return null;
  }
  return `data:${mime};base64,${compact}`;
}

export type CollectProductImageOptions = {
  /**
   * List endpoint mode: only primary card image (Image1 / ImageUrl).
   * Gallery Image2–4 come from GET productimages.
   */
  primaryOnly?: boolean;
};

/**
 * Collect Image1..Image4 (and common aliases) as normalized sources.
 * Image1 is first when present. Duplicates are dropped.
 */
export function collectProductImageSources(
  record: Record<string, unknown>,
  options?: CollectProductImageOptions,
): ImageSource[] {
  const sources: ImageSource[] = [];
  const seen = new Set<string>();

  const push = (value: unknown) => {
    const source = normalizeProductImageSource(value);
    if (!source || typeof source !== 'object' || !('uri' in source) || typeof source.uri !== 'string') {
      return;
    }
    const key = source.cacheKey ?? recyclingKeyForImageUri(source.uri);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    sources.push(source);
  };

  push(record.ImageUrl ?? record.imageUrl ?? record.Image ?? record.image ?? record.Photo ?? record.photo);
  push(record.Image1 ?? record.image1);
  if (!options?.primaryOnly) {
    push(record.Image2 ?? record.image2);
    push(record.Image3 ?? record.image3);
    push(record.Image4 ?? record.image4);

    const list = record.Images ?? record.images ?? record.ImageUrls ?? record.imageUrls;
    if (Array.isArray(list)) {
      for (const item of list) {
        if (typeof item === 'string') {
          push(item);
        } else if (item && typeof item === 'object' && !Array.isArray(item)) {
          const nested = item as Record<string, unknown>;
          push(nested.Url ?? nested.url ?? nested.ImageUrl ?? nested.imageUrl ?? nested.Image1);
        }
      }
    }
  }

  return sources;
}

/**
 * Short stable key for expo-image recycling / cacheKey.
 * For data URIs, fingerprints length + head/mid/tail samples so ERP image replacements
 * invalidate cache without appending random timestamps on every request.
 */
export function recyclingKeyForImageUri(uri: string): string {
  if (HTTP_URL.test(uri)) {
    return uri.length > 180 ? `${uri.slice(0, 120)}…${uri.length}` : uri;
  }
  if (uri.startsWith('data:')) {
    const semi = uri.indexOf(';');
    const mime = semi > 5 ? uri.slice(5, semi) : 'image';
    const comma = uri.indexOf(',');
    const body = comma >= 0 ? uri.slice(comma + 1) : uri;
    const len = body.length;
    const head = body.slice(0, 48);
    const mid = body.slice(Math.max(0, Math.floor(len / 2) - 12), Math.floor(len / 2) + 12);
    const tail = body.slice(-48);
    return `data:${mime}:${len}:${fnv1a(`${head}|${mid}|${tail}`)}`;
  }
  return `img:${uri.length}:${fnv1a(uri.slice(0, 64))}`;
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function detectBase64ImageMime(compactBase64: string): ProductImageMime | null {
  // Prefer magic from decoded header bytes when available.
  const header = decodeBase64Prefix(compactBase64, 16);
  if (header) {
    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
      return 'image/jpeg';
    }
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) {
      return 'image/png';
    }
    if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
      return 'image/gif';
    }
    if (
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46 &&
      header.length >= 12 &&
      header[8] === 0x57 &&
      header[9] === 0x45 &&
      header[10] === 0x42 &&
      header[11] === 0x50
    ) {
      return 'image/webp';
    }
  }

  // Fallback: well-known Base64 signatures (no full decode).
  if (compactBase64.startsWith('/9j/')) {
    return 'image/jpeg';
  }
  if (compactBase64.startsWith('iVBOR')) {
    return 'image/png';
  }
  if (compactBase64.startsWith('R0lGOD')) {
    return 'image/gif';
  }
  if (compactBase64.startsWith('UklGR')) {
    return 'image/webp';
  }
  return null;
}

function decodeBase64Prefix(compactBase64: string, byteLength: number): Uint8Array | null {
  try {
    const charsNeeded = Math.ceil((byteLength * 4) / 3) + 4;
    const slice = compactBase64.slice(0, charsNeeded);
    if (typeof globalThis.atob === 'function') {
      const binary = globalThis.atob(slice);
      const out = new Uint8Array(Math.min(byteLength, binary.length));
      for (let i = 0; i < out.length; i += 1) {
        out[i] = binary.charCodeAt(i);
      }
      return out;
    }
    // Node / Metro without atob
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Buffer } = require('buffer') as { Buffer: { from: (s: string, enc: string) => Uint8Array } };
    const buf = Buffer.from(slice, 'base64');
    return buf.length > 0 ? Uint8Array.from(buf.slice(0, byteLength)) : null;
  } catch {
    return null;
  }
}
