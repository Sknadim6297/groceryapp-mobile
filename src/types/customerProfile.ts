/** Optional avatar gender for drawer/profile chrome. Not required for auth. */
export type ProfileGender = 'male' | 'female';

/** Built-in avatar presets for “Choose An Existing Avatar”. */
export type ProfileAvatarPresetId = 'sunny' | 'leaf' | 'basket' | 'spice';

export type CustomerProfile = {
  ownerKey: string;
  mobile: string;
  name: string;
  email: string;
  dateOfBirth: string;
  updatedAt: number;
  /** Local photo URI from camera / gallery. Cleared when a preset is chosen. */
  avatarUri?: string | null;
  /** Built-in avatar preset. Cleared when a photo URI is set. */
  avatarPreset?: ProfileAvatarPresetId | null;
};

export type CustomerProfileDraft = {
  name: string;
  email: string;
  dateOfBirth: string;
  avatarUri?: string | null;
  avatarPreset?: ProfileAvatarPresetId | null;
};

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
