import type { RegisteredCustomer } from '@/types/customerApi';

import { formatIndiaMobileDisplay, isValidIndiaMobile } from '@/utils/phoneValidation';

/** Name from the registration response. An unsigned session has no customer name. */
export function registeredDisplayName(account: RegisteredCustomer | null): string {
  const name = account?.name.trim() ?? '';
  return name.length > 0 ? name : 'Your account';
}

/** Mobile from the registration response. Login drafts are not part of this record. */
export function registeredDisplayPhone(account: RegisteredCustomer | null): string {
  const mobile = account?.mobile.trim() ?? '';
  if (isValidIndiaMobile(mobile)) {
    return `+91 ${formatIndiaMobileDisplay(mobile)}`;
  }
  return mobile.length > 0 ? mobile : 'No phone number yet';
}
