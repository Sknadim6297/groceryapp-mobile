import { ADDRESS_API } from '@/constants/api';
import { getJson, postJson } from '@/services/api/http';
import { hasSuccessStatus, safeServerMessage } from '@/services/api/interpretCustomerResponse';
import { isDevOtpEnabled } from '@/services/devOtp';
import type {
  ParsedRemoteAddress,
  RemoteAddressBlock,
  RemoteAddressSlot,
  UpdateAddressRequest,
} from '@/types/customerAddressApi';
import type { SavedAddress } from '@/types/savedAddress';
import { addressFieldsFromSavedAddress } from '@/utils/customerAddressPayload';
import { isValidIndiaMobile } from '@/utils/phoneValidation';
import { normalizePostalCode } from '@/utils/savedAddressValidation';

export type AddressApiResult =
  | { ok: true; message: string | null }
  | { ok: false; message: string };

export type AddressDetailsResult =
  | { ok: true; addresses: ParsedRemoteAddress[]; message: string | null }
  | { ok: false; message: string };

const FAILURE_STATUS = /^(false|fail|failed|error|invalid)$/i;
const SERVER_HOME_ID = 'server-home';
const SERVER_BILLING_ID = 'server-billing';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
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

function looksLikeFailure(body: unknown): boolean {
  const record = asRecord(Array.isArray(body) ? body[0] : body);
  if (!record) {
    return false;
  }
  const status = textField(record.Status, record.status);
  return Boolean(status && FAILURE_STATUS.test(status));
}

function parseAddressBlock(value: unknown): Omit<ParsedRemoteAddress, 'slot'> | null {
  if (typeof value === 'string') {
    const addressLine1 = value.trim();
    if (addressLine1.length < 5) {
      return null;
    }
    return {
      addressLine1,
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    };
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const addressLine1 =
    textField(
      record.Address,
      record.address,
      record.AddressLine,
      record.addressLine,
      record.AddressLine1,
      record.addressLine1,
      record.HomeAddress,
      record.BillingAddress,
    ) ?? '';
  const city = textField(record.City, record.city) ?? '';
  const state = textField(record.State, record.state) ?? '';
  const postalCode = normalizePostalCode(
    textField(record.Pincode, record.PinCode, record.pincode, record.postalCode, record.Zip, record.zip) ?? '',
  );
  const country = textField(record.Country, record.country) ?? 'India';

  if (addressLine1.length < 5 && city.length < 2) {
    return null;
  }

  return {
    addressLine1: addressLine1 || [city, state, postalCode].filter(Boolean).join(', '),
    city,
    state,
    postalCode,
    country,
  };
}

function collectRemoteAddresses(body: unknown): ParsedRemoteAddress[] {
  const out: ParsedRemoteAddress[] = [];
  const seen = new Set<string>();

  function push(slot: RemoteAddressSlot, raw: unknown) {
    const parsed = parseAddressBlock(raw);
    if (!parsed) {
      return;
    }
    const key = `${slot}:${parsed.addressLine1.toLowerCase()}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    out.push({ slot, ...parsed });
  }

  const roots: unknown[] = Array.isArray(body) ? body : [body];
  for (const root of roots) {
    const record = asRecord(root);
    if (!record) {
      continue;
    }
    if (record.HomeAddress != null || record.homeAddress != null) {
      push('home', record.HomeAddress ?? record.homeAddress);
    }
    if (record.BillingAddress != null || record.billingAddress != null) {
      push('billing', record.BillingAddress ?? record.billingAddress);
    }
    // Flat customer address fields (same shape as register/update).
    if (record.Address != null || record.City != null) {
      push('home', record);
    }
  }

  return out;
}

/** Map a saved address onto the remote Address / City / State / Pincode block. */
export function savedAddressToRemoteBlock(address: SavedAddress): RemoteAddressBlock {
  const fields = addressFieldsFromSavedAddress(address);
  return fields;
}

/** Build POST UpdateAddress body from the local address book. */
export function buildUpdateAddressRequest(
  mobile: string,
  addresses: readonly SavedAddress[],
): { ok: true; body: UpdateAddressRequest } | { ok: false; message: string } {
  if (!isValidIndiaMobile(mobile)) {
    return { ok: false, message: 'Enter a valid 10-digit mobile number.' };
  }
  if (addresses.length === 0) {
    return { ok: false, message: 'Add an address before syncing.' };
  }

  const home =
    addresses.find((address) => address.label === 'Home') ??
    addresses.find((address) => address.isDefault) ??
    addresses[0];
  const billing =
    addresses.find((address) => address.label === 'Work' && address.id !== home.id) ??
    addresses.find((address) => address.isDefault && address.id !== home.id) ??
    home;

  const body: UpdateAddressRequest = {
    Mobile: mobile,
    HomeAddress: savedAddressToRemoteBlock(home),
  };
  if (billing) {
    body.BillingAddress = savedAddressToRemoteBlock(billing);
  }
  return { ok: true, body };
}

/** Convert remote slots into SavedAddress rows with stable server ids. */
export function remoteAddressesToSaved(addresses: readonly ParsedRemoteAddress[]): SavedAddress[] {
  const now = Date.now();
  const hasHome = addresses.some((item) => item.slot === 'home');
  const out: SavedAddress[] = [];
  for (const remote of addresses) {
    const city = remote.city.trim();
    const state = remote.state.trim();
    const postalCode = remote.postalCode.length === 6 ? remote.postalCode : '';
    // Local book requires city / state / 6-digit PIN — skip incomplete remote rows.
    if (remote.addressLine1.trim().length < 5 || city.length < 2 || state.length < 2 || postalCode.length !== 6) {
      continue;
    }
    const isHome = remote.slot === 'home';
    out.push({
      id: isHome ? SERVER_HOME_ID : SERVER_BILLING_ID,
      label: isHome ? 'Home' : 'Work',
      addressLine1: remote.addressLine1.trim(),
      city,
      state,
      postalCode,
      country: remote.country.trim() || 'India',
      source: 'saved',
      isDefault: isHome || (!hasHome && out.length === 0),
      updatedAt: now,
    });
  }
  return out;
}

/**
 * Merge server Home/Billing into the local book without wiping Other addresses.
 * Server rows use stable ids `server-home` / `server-billing`.
 */
export function mergeRemoteAddressesIntoBook(
  local: readonly SavedAddress[],
  remote: readonly ParsedRemoteAddress[],
): SavedAddress[] {
  if (remote.length === 0) {
    return [...local];
  }
  const remoteSaved = remoteAddressesToSaved(remote);
  const byId = new Map(local.map((address) => [address.id, address]));
  for (const next of remoteSaved) {
    const previous = byId.get(next.id);
    byId.set(next.id, previous ? { ...previous, ...next, isDefault: previous.isDefault || next.isDefault } : next);
  }
  let merged = [...byId.values()];
  if (!merged.some((address) => address.isDefault) && merged.length > 0) {
    const preferHome = merged.find((address) => address.id === SERVER_HOME_ID) ?? merged[0];
    merged = merged.map((address) => ({ ...address, isDefault: address.id === preferHome.id }));
  }
  return merged;
}

/** GET /api/values/AddressDetails?Mobile={Mobile} */
export async function fetchAddressDetails(mobile: string): Promise<AddressDetailsResult> {
  const trimmed = mobile.trim();
  if (!isValidIndiaMobile(trimmed)) {
    return { ok: false, message: 'Enter a valid 10-digit mobile number.' };
  }
  if (isDevOtpEnabled()) {
    return { ok: true, addresses: [], message: 'Live address fetch skipped in Development OTP mode.' };
  }

  const response = await getJson(ADDRESS_API.details, { Mobile: trimmed });
  if (response.status === 0) {
    return { ok: false, message: safeServerMessage(response.body) ?? 'Unable to connect. Please try again.' };
  }
  if (response.status < 200 || response.status >= 300) {
    return {
      ok: false,
      message: safeServerMessage(response.body) ?? `Address details failed (${response.status}).`,
    };
  }

  if (looksLikeFailure(response.body)) {
    const message = safeServerMessage(response.body) ?? 'Address details were not returned.';
    // Unknown / new customer — treat as empty remote book, not a hard failure.
    if (/customer not found/i.test(message)) {
      return { ok: true, addresses: [], message };
    }
    return { ok: false, message };
  }

  return {
    ok: true,
    addresses: collectRemoteAddresses(response.body),
    message: hasSuccessStatus(response.body) ? safeServerMessage(response.body) : null,
  };
}

/** POST /api/values/UpdateAddress */
export async function updateAddress(body: UpdateAddressRequest): Promise<AddressApiResult> {
  if (isDevOtpEnabled()) {
    return { ok: false, message: 'Live address update is blocked while Development OTP mode is on.' };
  }
  if (!body.Mobile?.trim() || !isValidIndiaMobile(body.Mobile.trim())) {
    return { ok: false, message: 'Enter a valid 10-digit mobile number.' };
  }
  if (body.HomeAddress == null && body.BillingAddress == null) {
    return { ok: false, message: 'Please provide HomeAddress or BillingAddress.' };
  }

  const response = await postJson(ADDRESS_API.update, {
    ...body,
    Mobile: body.Mobile.trim(),
  });
  if (response.status === 0) {
    return { ok: false, message: safeServerMessage(response.body) ?? 'Unable to connect. Please try again.' };
  }
  if (response.status < 200 || response.status >= 300) {
    return {
      ok: false,
      message: safeServerMessage(response.body) ?? `Address update failed (${response.status}).`,
    };
  }
  const message = safeServerMessage(response.body);
  if (looksLikeFailure(response.body)) {
    return {
      ok: false,
      message: message ?? 'The server did not confirm the address update.',
    };
  }
  if (hasSuccessStatus(response.body) || /success|updated|saved/i.test(message ?? '')) {
    return { ok: true, message };
  }
  return {
    ok: false,
    message: message ?? 'The server did not confirm the address update.',
  };
}
