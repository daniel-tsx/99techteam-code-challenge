/** Digits, with at most one decimal point. Also matches '' and '.'. */
export const AMOUNT_PATTERN = /^\d*(\.\d*)?$/;

/** Guards against amounts where float maths stops being meaningful. */
export const MAX_AMOUNT = 1e12;

// Locales are pinned so formatting does not drift with the visitor's machine.
const LOCALE = 'en-US';

export function formatTokenAmount(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '0';

  const magnitude = Math.abs(value);
  if (magnitude < 0.0001) {
    return new Intl.NumberFormat(LOCALE, { maximumSignificantDigits: 4 }).format(value);
  }

  const maximumFractionDigits = magnitude >= 1000 ? 2 : magnitude >= 1 ? 4 : 6;
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits }).format(value);
}

export function formatUsd(value: number): string {
  const magnitude = Math.abs(value);
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: magnitude > 0 && magnitude < 0.01 ? 6 : 2,
  }).format(value);
}

export function formatQuoteDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
