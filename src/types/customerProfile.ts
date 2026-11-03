/** Optional avatar gender for drawer/profile chrome. Not required for auth. */
export type ProfileGender = 'male' | 'female';

export type CustomerProfile = {
  ownerKey: string;
  mobile: string;
  name: string;
  email: string;
  dateOfBirth: string;
  updatedAt: number;
};

export type CustomerProfileDraft = {
  name: string;
  email: string;
  dateOfBirth: string;
};
