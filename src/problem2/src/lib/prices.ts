import type { Token } from '../types';

const PRICES_URL = 'https://interview.switcheo.com/prices.json';
const ICONS_URL = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens';

/** A few icons in the token-icons repo are not spelled the way the feed spells them. */
const ICON_NAMES: Record<string, string> = {
  RATOM: 'rATOM',
  STATOM: 'stATOM',
  STEVMOS: 'stEVMOS',
  STLUNA: 'stLUNA',
  STOSMO: 'stOSMO',
};

type PriceRecord = {
  currency?: string;
  date?: string;
  price?: number;
};

/**
 * The feed is a list of quotes, not a list of tokens: a currency can appear more
 * than once (BUSD does) and a quote can be missing a usable price. Keep the most
 * recent quote per currency and drop anything we cannot price — an unpriced token
 * has no exchange rate, so it does not belong in the form.
 */
export async function fetchTokens(signal?: AbortSignal): Promise<Token[]> {
  const response = await fetch(PRICES_URL, { signal });
  if (!response.ok) {
    throw new Error(`The price feed responded with ${response.status}.`);
  }

  const records: PriceRecord[] = await response.json();
  const latest = new Map<string, Token>();

  for (const record of records) {
    if (!record.currency || typeof record.price !== 'number' || !(record.price > 0)) continue;

    const token: Token = { symbol: record.currency, price: record.price, quotedAt: record.date ?? '' };
    const existing = latest.get(token.symbol);
    // ISO timestamps compare correctly as strings.
    if (!existing || token.quotedAt > existing.quotedAt) latest.set(token.symbol, token);
  }

  return [...latest.values()].sort((a, b) =>
    a.symbol.localeCompare(b.symbol, 'en', { sensitivity: 'base' }),
  );
}

export function tokenIconUrl(symbol: string): string {
  return `${ICONS_URL}/${ICON_NAMES[symbol.toUpperCase()] ?? symbol}.svg`;
}
