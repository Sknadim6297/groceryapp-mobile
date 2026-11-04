/**
 * Stable demo referral code derived from a signed-in mobile / customer id.
 * Not a live referral program — preview sharing only.
 */
export function buildDemoReferralCode(seed: string): string | null {
  const digits = seed.replace(/\D/g, '');
  const letters = seed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const base = (letters.slice(0, 4) + digits.slice(-6)).padEnd(6, '0').slice(0, 8);
  if (base.replace(/0/g, '').length === 0 && digits.length < 4) {
    return null;
  }
  return `MB-${base}`;
}

export function buildDemoInviteMessage(code: string): string {
  return `Join me on MayapurBazaar for fresh groceries. Use my invite code ${code}. (Demo invite — rewards are not live yet.)`;
}
