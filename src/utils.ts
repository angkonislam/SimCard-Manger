import { PRODUCT_BRAND_COLORS } from './constants';

export const getBrandColor = (product: string, fallbackIdx: number): string => {
  if (PRODUCT_BRAND_COLORS[product]) return PRODUCT_BRAND_COLORS[product];
  const fallback = ['#10b981','#06b6d4','#a855f7','#f97316','#14b8a6','#d946ef','#22d3ee','#4ade80'];
  return fallback[fallbackIdx % fallback.length];
};

export const getMonthKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
};

export const formatMonthLabel = (yyyyMM: string): string => {
  const [y, m] = yyyyMM.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

export const getPrevMonthLabel = (): string => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

export const localDateStr = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

export const getInitials = (name: string = ''): string => {
  if (!name) return '';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export const buildWAGroup = (id: string, name: string): string =>
  name.trim() ? `ACT_${id}⚡(${name.trim()})🔥` : '';

// 90-day rolling-window cutoff. Returns true if iso timestamp is within 90 days of now.
// Empty/invalid timestamps → keep (return true).
export const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
export function isWithin90Days(iso?: string): boolean {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return true;
  return Date.now() - t <= NINETY_DAYS_MS;
}
