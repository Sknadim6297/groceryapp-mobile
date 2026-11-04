import {
  PROFILE_AVATAR_PRESETS,
  type ProfileAvatarPresetId,
  type ProfileGender,
} from '@/types/customerProfile';

/** Cartoon emoji avatar. Only `male` uses the male face; everything else uses female. */
export function profileAvatarEmoji(gender: ProfileGender | null | undefined): string {
  return gender === 'male' ? '👨' : '👩';
}

export function parseProfileGender(value: unknown): ProfileGender | undefined {
  if (value === 'male' || value === 'female') {
    return value;
  }
  return undefined;
}

export function parseProfileAvatarPreset(value: unknown): ProfileAvatarPresetId | null {
  if (value === 'sunny' || value === 'leaf' || value === 'basket' || value === 'spice') {
    return value;
  }
  return null;
}

export function profileAvatarPreset(id: ProfileAvatarPresetId | null | undefined) {
  return PROFILE_AVATAR_PRESETS.find((preset) => preset.id === id) ?? null;
}

/**
 * Stable, readable customer-id display for the Profile screen.
 * Prefers the real customerId; falls back to mobile digits. Never invents a card number.
 */
export function formatProfileIdDisplay(customerId: string | null | undefined, mobile: string): string {
  const raw = (customerId ?? '').replace(/\D/g, '') || mobile.replace(/\D/g, '');
  if (raw.length === 0) {
    return 'Not assigned';
  }
  return raw.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
