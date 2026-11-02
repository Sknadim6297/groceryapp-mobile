import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ProfileDraft = {
  fullName: string;
  email: string;
  dateOfBirth: string | null;
};

type ProfileDraftContextValue = ProfileDraft & {
  setFullName: (value: string) => void;
  setEmail: (value: string) => void;
  setDateOfBirth: (value: string | null) => void;
  clearDraft: () => void;
};

const ProfileDraftContext = createContext<ProfileDraftContextValue | null>(null);

export function ProfileDraftProvider({ children }: { children: ReactNode }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);
  const clearDraft = useCallback(() => {
    setFullName('');
    setEmail('');
    setDateOfBirth(null);
  }, []);
  const value = useMemo(
    () => ({
      fullName,
      email,
      dateOfBirth,
      setFullName,
      setEmail,
      setDateOfBirth,
      clearDraft,
    }),
    [fullName, email, dateOfBirth, clearDraft],
  );

  return <ProfileDraftContext.Provider value={value}>{children}</ProfileDraftContext.Provider>;
}

export function useProfileDraft(): ProfileDraftContextValue {
  const value = useContext(ProfileDraftContext);

  if (!value) {
    throw new Error('useProfileDraft must be used within ProfileDraftProvider');
  }

  return value;
}
