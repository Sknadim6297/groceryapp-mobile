import { homeLayout } from '@/constants/theme';

/** Safe content column width. Avoids maxWidth:0 during web SSR when window width is 0. */
export function contentColumnWidth(windowWidth: number, maxWidth = homeLayout.maxWidth): number {
  if (!Number.isFinite(windowWidth) || windowWidth <= 0) {
    return maxWidth;
  }
  return Math.min(windowWidth, maxWidth);
}
