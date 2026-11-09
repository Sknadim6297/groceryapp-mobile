/**
 * Read-only CMS seed dry-run.
 * Compares content/seed/presentation-catalog.json against live ERP products.
 * Never writes to the ERP database or uploads images.
 *
 * Usage: npx tsx scripts/content-seed/dry-run-import.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { mapProductRecord } from '../../src/services/productsApi';
import type { PresentationCatalogSeed } from '../../src/content/presentationCatalogTypes';
import { normalizeCatalogLabel } from '../../src/utils/normalizeCatalogLabel';

const ROOT = path.resolve(__dirname, '../..');
const SEED_PATH = path.join(ROOT, 'content/seed/presentation-catalog.json');
const REPORT_DIR = path.join(ROOT, 'content/seed/reports');
const COMPANY = process.env.EXPO_PUBLIC_PRODUCTS_COMPANY?.trim() || '8787888888';
const API = `https://api.supertrading.online/api/values/products?company=${encodeURIComponent(COMPANY)}`;

type Action =
  | 'would-insert'
  | 'would-link-existing'
  | 'would-skip-duplicate'
  | 'missing-asset'
  | 'asset-ok'
  | 'live-unmapped';

type Row = {
  kind: 'field' | 'category' | 'banner' | 'asset' | 'live-field' | 'live-category';
  id: string;
  name: string;
  action: Action;
  detail: string;
};

function loadSeed(): PresentationCatalogSeed {
  return JSON.parse(readFileSync(SEED_PATH, 'utf8')) as PresentationCatalogSeed;
}

function assetExists(rel: string): boolean {
  return existsSync(path.join(ROOT, rel));
}

async function fetchLive() {
  const response = await fetch(API);
  if (!response.ok) {
    throw new Error(`Live products HTTP ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!Array.isArray(body)) {
    throw new Error('Expected products array');
  }
  const products = body
    .map((row) => mapProductRecord(row))
    .filter((row): row is NonNullable<typeof row> => row != null);

  const fields = new Map<string, string>();
  const categories = new Map<string, { name: string; field: string }>();
  for (const product of products) {
    const field = product.category?.trim();
    if (!field) {
      continue;
    }
    fields.set(normalizeCatalogLabel(field), field);
    const subcategory = product.subcategory?.trim();
    if (subcategory) {
      categories.set(normalizeCatalogLabel(subcategory), { name: subcategory, field });
    }
  }
  return { products, fields, categories };
}

function aliasesHit(
  aliases: string[],
  live: Map<string, string> | Map<string, { name: string; field: string }>,
): string | null {
  for (const alias of aliases) {
    const key = normalizeCatalogLabel(alias);
    const hit = live.get(key);
    if (!hit) {
      continue;
    }
    return typeof hit === 'string' ? hit : hit.name;
  }
  return null;
}

async function run() {
  const seed = loadSeed();
  const live = await fetchLive();
  const rows: Row[] = [];
  const usedLiveFields = new Set<string>();
  const usedLiveCategories = new Set<string>();

  for (const field of seed.fields) {
    const linked = aliasesHit(field.erpAliases, live.fields);
    if (linked) {
      usedLiveFields.add(normalizeCatalogLabel(linked));
      rows.push({
        kind: 'field',
        id: field.id,
        name: field.name,
        action: 'would-link-existing',
        detail: `Match live Field "${linked}" via alias; upsert image/sort only (no product changes)`,
      });
    } else {
      rows.push({
        kind: 'field',
        id: field.id,
        name: field.name,
        action: 'would-insert',
        detail: 'No live Field alias match — insert into CMS / catalog master after approval',
      });
    }
    rows.push({
      kind: 'asset',
      id: field.id,
      name: field.imageAsset,
      action: assetExists(field.imageAsset) ? 'asset-ok' : 'missing-asset',
      detail: assetExists(field.imageAsset)
        ? 'Local asset present; remote URL pending managed storage upload'
        : 'Local file missing',
    });
  }

  for (const category of seed.categories) {
    const linked = aliasesHit(category.erpAliases, live.categories);
    if (linked) {
      usedLiveCategories.add(normalizeCatalogLabel(linked));
      rows.push({
        kind: 'category',
        id: category.id,
        name: category.name,
        action: 'would-link-existing',
        detail: `Match live Subcategory "${linked}" via alias; upsert image/sort only`,
      });
    } else {
      rows.push({
        kind: 'category',
        id: category.id,
        name: category.name,
        action: 'would-insert',
        detail: 'Presentation-only until ERP products publish this Subcategory',
      });
    }
    rows.push({
      kind: 'asset',
      id: category.id,
      name: category.imageAsset,
      action: assetExists(category.imageAsset) ? 'asset-ok' : 'missing-asset',
      detail: assetExists(category.imageAsset)
        ? 'Local asset present; remote URL pending managed storage upload'
        : 'Local file missing',
    });
  }

  for (const banner of seed.banners) {
    rows.push({
      kind: 'banner',
      id: banner.id,
      name: banner.title,
      action: 'would-insert',
      detail: `CMS HomeBanner target=${banner.targetType}:${banner.targetId ?? 'none'}`,
    });
    rows.push({
      kind: 'asset',
      id: banner.id,
      name: banner.imageAsset,
      action: assetExists(banner.imageAsset) ? 'asset-ok' : 'missing-asset',
      detail: assetExists(banner.imageAsset)
        ? 'Local asset present; remote URL pending managed storage upload'
        : 'Local file missing',
    });
  }

  for (const [key, name] of live.fields) {
    if (usedLiveFields.has(key)) {
      continue;
    }
    rows.push({
      kind: 'live-field',
      id: key,
      name,
      action: 'live-unmapped',
      detail: 'Live ERP Field has no presentation seed alias — keep ERP record; add alias if needed',
    });
  }
  for (const [key, value] of live.categories) {
    if (usedLiveCategories.has(key)) {
      continue;
    }
    rows.push({
      kind: 'live-category',
      id: key,
      name: value.name,
      action: 'live-unmapped',
      detail: `Live Subcategory under "${value.field}" has no seed alias — keep ERP record`,
    });
  }

  const summary = {
    mode: 'dry-run',
    databaseWrites: 0,
    company: COMPANY,
    liveProducts: live.products.length,
    liveFields: live.fields.size,
    liveCategories: live.categories.size,
    proposedFields: seed.fields.length,
    proposedCategories: seed.categories.length,
    proposedBanners: seed.banners.length,
    wouldInsertFields: rows.filter((row) => row.kind === 'field' && row.action === 'would-insert').length,
    wouldLinkFields: rows.filter((row) => row.kind === 'field' && row.action === 'would-link-existing')
      .length,
    wouldInsertCategories: rows.filter((row) => row.kind === 'category' && row.action === 'would-insert')
      .length,
    wouldLinkCategories: rows.filter(
      (row) => row.kind === 'category' && row.action === 'would-link-existing',
    ).length,
    missingAssets: rows.filter((row) => row.action === 'missing-asset').length,
    assetOk: rows.filter((row) => row.action === 'asset-ok').length,
    liveUnmapped: rows.filter((row) => row.action === 'live-unmapped').length,
    blockers: [
      'No ERP catalog write/upload APIs (GET /catalog/categories, /catalog/home, /fields → 404)',
      'Separate CMS service or ERP content APIs required before any database import',
      'Managed image storage not available — local assets only in this dry-run',
    ],
    generatedAt: new Date().toISOString(),
  };

  mkdirSync(REPORT_DIR, { recursive: true });
  const stamp = summary.generatedAt.replace(/[:.]/g, '-');
  const reportPath = path.join(REPORT_DIR, `dry-run-${stamp}.json`);
  const latestPath = path.join(REPORT_DIR, 'dry-run-latest.json');
  const manifestPath = path.join(ROOT, 'content/seed/asset-manifest.json');

  const assetManifest = {
    generatedAt: summary.generatedAt,
    note: 'Proposed remote paths are placeholders for approved storage. Do not use as live URLs yet.',
    items: [
      ...seed.fields.map((field) => ({
        id: field.id,
        kind: 'field' as const,
        localPath: field.imageAsset,
        exists: assetExists(field.imageAsset),
        proposedRemotePath: `/content/fields/${field.slug}.jpg`,
        remoteUrl: null,
      })),
      ...seed.categories.map((category) => ({
        id: category.id,
        kind: 'category' as const,
        localPath: category.imageAsset,
        exists: assetExists(category.imageAsset),
        proposedRemotePath: `/content/categories/${category.slug}.jpg`,
        remoteUrl: null,
      })),
      ...seed.banners.map((banner) => ({
        id: banner.id,
        kind: 'banner' as const,
        localPath: banner.imageAsset,
        exists: assetExists(banner.imageAsset),
        proposedRemotePath: `/content/banners/${banner.id.replace(/^pres-banner-/, '')}.jpg`,
        remoteUrl: null,
      })),
    ],
  };

  const payload = { summary, rows };
  writeFileSync(reportPath, JSON.stringify(payload, null, 2));
  writeFileSync(latestPath, JSON.stringify(payload, null, 2));
  writeFileSync(manifestPath, JSON.stringify(assetManifest, null, 2));

  console.log('content-seed dry-run: ok');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`report=${path.relative(ROOT, latestPath)}`);
  console.log(`manifest=${path.relative(ROOT, manifestPath)}`);
}

void run();
