const INDIA_MOBILE_LENGTH = 10;
const INDIA_MOBILE_PATTERN = /^[6-9]\d{9}$/;

export function sanitizeIndiaMobile(value: string): string {
  return value.replace(/\D/g, '').slice(0, INDIA_MOBILE_LENGTH);
}

export function isValidIndiaMobile(value: string): boolean {
  return INDIA_MOBILE_PATTERN.test(value);
}

export function getIndiaMobileError(value: string): string | null {
  if (value.length === 0 || isValidIndiaMobile(value)) {
    return null;
  }

  if (value.length < INDIA_MOBILE_LENGTH) {
    return 'Enter all 10 digits of the mobile number.';
  }

  return 'Indian mobile numbers start with 6, 7, 8, or 9.';
}

export function formatIndiaMobileDisplay(value: string): string {
  if (value.length <= 5) {
    return value;
  }

  return `${value.slice(0, 5)} ${value.slice(5)}`;
}
