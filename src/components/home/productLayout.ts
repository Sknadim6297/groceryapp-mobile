import { homeLayout } from '@/constants/theme';

/** Narrowest card that still fits a 2-line name, price, and ADD control. */
export const PRODUCT_CARD_MIN = 120;
/** Home and Shop show two cards across. */
export const PRODUCT_ROW_COLUMNS = 2;

export function homeContentWidth(windowWidth: number): number {
  return Math.min(windowWidth, homeLayout.maxWidth);
}

/** Two cards across when each one stays at least PRODUCT_CARD_MIN wide. */
export function productColumns(windowWidth: number, preferred: number, horizontalPadding: number, gap: number): number {
  const available = homeContentWidth(windowWidth) - horizontalPadding;
  const fit = Math.max(1, Math.floor((available + gap) / (PRODUCT_CARD_MIN + gap)));
  const wanted = Math.min(PRODUCT_ROW_COLUMNS, Math.max(1, preferred));
  return Math.min(wanted, fit);
}

export function productCardWidth(windowWidth: number, columns: number, horizontalPadding: number, gap: number): number {
  const available = homeContentWidth(windowWidth) - horizontalPadding;
  const safeColumns = Math.max(1, columns);
  return Math.floor((available - gap * (safeColumns - 1)) / safeColumns);
}

/** Horizontal shelf uses the same two-across width as the home grid. */
export function shelfCardWidth(windowWidth: number): number {
  const columns = productColumns(windowWidth, PRODUCT_ROW_COLUMNS, 24, 8);
  return productCardWidth(windowWidth, columns, 24, 8);
}
