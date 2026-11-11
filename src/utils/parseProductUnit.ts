export type ParsedProductUnit =
  | { kind: 'mass'; grams: number }
  | { kind: 'volume'; millilitres: number }
  | { kind: 'each'; count: number };

/**
 * Parse display `unit` strings into a reliable size.
 * Returns null when size/unit cannot be determined without guessing.
 *
 * Accepts: "1 kg", "500 g", "1 L", "250 ml", "1 pc", "12 pcs"
 */
export function parseProductUnit(raw: string | null | undefined): ParsedProductUnit | null {
  if (!raw) {
    return null;
  }
  const text = raw.trim().toLowerCase().replace(/,/g, '');
  if (!text) {
    return null;
  }

  const mass = text.match(/^(\d+(?:\.\d+)?)\s*(kg|g|gm|gram|grams|kilogram|kilograms)\b/);
  if (mass?.[1] && mass[2]) {
    const n = Number(mass[1]);
    if (!Number.isFinite(n) || n <= 0) {
      return null;
    }
    const unit = mass[2];
    const grams = unit.startsWith('kg') || unit.startsWith('kilogram') ? n * 1000 : n;
    return { kind: 'mass', grams };
  }

  const volume = text.match(/^(\d+(?:\.\d+)?)\s*(l|lt|ltr|litre|liter|litres|liters|ml|millilitre|milliliter)\b/);
  if (volume?.[1] && volume[2]) {
    const n = Number(volume[1]);
    if (!Number.isFinite(n) || n <= 0) {
      return null;
    }
    const unit = volume[2];
    const millilitres =
      unit === 'ml' || unit.startsWith('millilit') ? n : n * 1000;
    return { kind: 'volume', millilitres };
  }

  const each = text.match(/^(\d+(?:\.\d+)?)\s*(pc|pcs|piece|pieces|unit|units)\b/);
  if (each?.[1]) {
    const n = Number(each[1]);
    if (!Number.isFinite(n) || n <= 0) {
      return null;
    }
    return { kind: 'each', count: n };
  }

  return null;
}
