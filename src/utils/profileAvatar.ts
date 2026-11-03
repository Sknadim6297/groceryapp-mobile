import type { ProfileGender } from '@/types/customerProfile';

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
