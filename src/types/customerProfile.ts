/**
 * Local cache of profile fields collected in Edit Profile.
 * Address / Anniversary / GST are not edited here (address syncs via delivery location).
 */

/** Optional drawer chrome only — not part of customer/update. */
export type ProfileGender = 'male' | 'female';

/** Built-in avatar presets (local chrome). Not sent to customer/update. */
export type ProfileAvatarPresetId = 'sunny' | 'leaf' | 'basket' | 'spice';

export const PROFILE_AVATAR_PRESETS: {
  id: ProfileAvatarPresetId;
  label: string;
  emoji: string;
  wash: string;
}[] = [
  { id: 'sunny', label: 'Sunny', emoji: '🌞', wash: '#FEF3C7' },
  { id: 'leaf', label: 'Fresh', emoji: '🌿', wash: '#DCFCE7' },
  { id: 'basket', label: 'Basket', emoji: '🧺', wash: '#FFEDD5' },
  { id: 'spice', label: 'Spice', emoji: '🌶️', wash: '#FEE2E2' },
];

export type CustomerProfile = {
  ownerKey: string;
  mobile: string;
  name: string;
  email: string;
  dateOfBirth: string;
  updatedAt: number;
};

/** Editable draft — Mobile is session-owned. */
export type CustomerProfileDraft = {
  name: string;
  email: string;
  dateOfBirth: string;
};
