import { OTP_LENGTH } from '@/types/auth';

/**
 * Pulls a standalone OTP from an SMS body without guessing among rival numbers.
 * Drops a trailing Android SMS Retriever app-hash token when present.
 * Never logs the message or code — call sites must keep the same rule.
 */
export function extractSmsOtp(message: string, length: number = OTP_LENGTH): string | null {
  if (typeof message !== 'string' || message.length === 0 || length < 4 || length > 8) {
    return null;
  }

  const withoutTrailingHash = message.replace(/(?:\r?\n)?[A-Za-z0-9+/=]{11}\s*$/m, '').trim();
  const escapedLength = String(length);
  // Standalone digits only — not glued to letters or other digits (e.g. A123456B).
  const pattern = new RegExp(`(?<![A-Za-z0-9])(\\d{${escapedLength}})(?![A-Za-z0-9])`, 'g');
  const matches = withoutTrailingHash.match(pattern);
  if (!matches || matches.length === 0) {
    return null;
  }

  const unique = Array.from(new Set(matches));
  if (unique.length !== 1) {
    return null;
  }

  return unique[0] ?? null;
}
