import { formatRupee } from '@/utils/cartBill';
import { parseProductUnit, type ParsedProductUnit } from '@/utils/parseProductUnit';

export type UnitPriceResult = {
  /** Human label e.g. "₹80 / kg" */
  label: string;
  /** Price in INR per base unit (kg, L, or piece). */
  perBase: number;
  base: 'kg' | 'L' | 'pc';
};

function fromParsed(price: number, parsed: ParsedProductUnit): UnitPriceResult | null {
  if (!Number.isFinite(price) || price < 0) {
    return null;
  }
  if (parsed.kind === 'mass') {
    if (parsed.grams <= 0) {
      return null;
    }
    const perBase = (price / parsed.grams) * 1000;
    return { label: `${formatRupee(perBase)} / kg`, perBase, base: 'kg' };
  }
  if (parsed.kind === 'volume') {
    if (parsed.millilitres <= 0) {
      return null;
    }
    const perBase = (price / parsed.millilitres) * 1000;
    return { label: `${formatRupee(perBase)} / L`, perBase, base: 'L' };
  }
  if (parsed.count <= 0) {
    return null;
  }
  const perBase = price / parsed.count;
  return { label: `${formatRupee(perBase)} / pc`, perBase, base: 'pc' };
}

/** Unit price only when package size can be parsed reliably. Never guesses. */
export function computeUnitPrice(price: number, unitLabel: string | null | undefined): UnitPriceResult | null {
  const parsed = parseProductUnit(unitLabel);
  if (!parsed) {
    return null;
  }
  return fromParsed(price, parsed);
}
