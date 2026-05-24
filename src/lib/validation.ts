// Shared form validators. Return error message or null.

export const isEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const isPhone = (v: string): boolean =>
  /^[0-9+\-\s()]{7,20}$/.test(v.trim());

export const required = (v: unknown, label = 'Field'): string | null => {
  if (v === null || v === undefined) return `${label} is required`;
  if (typeof v === 'string' && !v.trim()) return `${label} is required`;
  return null;
};

export const minLen = (v: string, n: number, label = 'Field'): string | null => {
  if (v.trim().length < n) return `${label} must be at least ${n} characters`;
  return null;
};

export const validEmail = (v: string, label = 'Email'): string | null => {
  if (!v.trim()) return `${label} is required`;
  if (!isEmail(v)) return `${label} is not valid`;
  return null;
};

export const validPhone = (v: string, label = 'Phone'): string | null => {
  if (!v.trim()) return null; // optional
  if (!isPhone(v)) return `${label} is not valid`;
  return null;
};

export const positiveNumber = (v: number | string, label = 'Value'): string | null => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(n)) return `${label} must be a number`;
  if (n < 0) return `${label} cannot be negative`;
  return null;
};

export const inRange = (v: number, min: number, max: number, label = 'Value'): string | null => {
  if (v < min || v > max) return `${label} must be between ${min} and ${max}`;
  return null;
};

// Combine: returns first non-null error or null
export const combine = (...errors: (string | null)[]): string | null =>
  errors.find(e => e !== null) ?? null;
