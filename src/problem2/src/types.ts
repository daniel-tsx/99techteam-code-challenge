export type Token = {
  symbol: string;
  /** USD per token. */
  price: number;
  /** ISO timestamp of the quote this price came from. */
  quotedAt: string;
};
