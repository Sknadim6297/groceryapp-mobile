import type { Href } from 'expo-router';

/** Account / side-menu destinations for wallet, invite, returns, complaints. */
export const accountRoutes = {
  wallet: '/wallet' as Href,
  invite: '/invite' as Href,
  returns: '/returns' as Href,
  complaints: '/complaints' as Href,
  complaintNew: '/complaints/new' as Href,
  settings: '/settings' as Href,
  transactions: '/transactions' as Href,
  help: '/help' as Href,
  privacy: '/privacy' as Href,
  terms: '/terms' as Href,
} as const;

export function complaintDetailsHref(id: string): Href {
  return { pathname: '/complaints/[id]', params: { id } };
}
