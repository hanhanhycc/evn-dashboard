/** dd/MM/yyyy <-> yyyy-MM-dd helpers, all in local time. */

export const todayIso = (): string => {
  const d = new Date();
  return iso(d);
};

export const iso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const minusDaysIso = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

export const startOfMonthIso = (offsetMonths = 0): string => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMonths);
  return iso(d);
};

export const endOfMonthIso = (offsetMonths = 0): string => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMonths + 1);
  d.setDate(0);
  return iso(d);
};

export const toApiDate = (isoStr: string): string => {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-');
  return `${d}/${m}/${y}`;
};

export const fromApiDate = (s: string): string => {
  if (!s) return '';
  const [d, m, y] = s.split('/');
  return `${y}-${m}-${d}`;
};

export const fmtNum = (n: number | string | undefined, max = 2): string =>
  Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: max });

export const fmtMoney = (n: number): string =>
  Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' ₫';

export const daysBetween = (isoFrom: string, isoTo: string): number => {
  if (!isoFrom || !isoTo) return 0;
  const a = new Date(isoFrom).getTime();
  const b = new Date(isoTo).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
};
