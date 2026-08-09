# Problem 2 — Fancy Form

A currency swap form built with React, TypeScript, and Vite.

## Technical Decisions

### Pricing

The application uses the pricing endpoint provided by the challenge rather than bundled mock data.

The response is normalized before reaching the UI:

- invalid quotes are discarded,
- currencies without usable prices are omitted,
- duplicate currency quotes are deduplicated using the most recent quote.

The endpoint currently returns historical snapshot data rather than live market prices, so the UI displays the quote timestamp and does not describe the values as real-time rates.

The swap submission itself is simulated with a short asynchronous delay, as suggested by the challenge.

### State Model

Only user-controlled state is stored where possible:

- input amount,
- selected pay/receive currencies,
- pricing request state,
- submission state.

Values such as the selected token objects, exchange rate, receive amount, and USD value are derived from that state rather than synchronized through additional state or effects.

For example:

```ts
const rate =
  payToken && receiveToken
    ? payToken.price / receiveToken.price
    : null;

const receiveAmount =
  rate !== null && isAmountUsable
    ? amountValue * rate
    : null;
```

This avoids duplicated state and synchronization bugs.

### Data Fetching

Pricing is fetched in the browser because this is a client-side Vite application and the supplied endpoint does not require credentials.

The request uses `AbortController` so an obsolete request does not update the component after cleanup.

Loading, refresh, failure, and retry states are handled explicitly.

### Token Selection

The two sides of the swap are prevented from containing the same currency. Selecting the currency already used by the opposite side swaps the pair instead of rejecting the interaction.

The token selector also supports:

- search,
- keyboard navigation,
- visible selection state,
- missing-icon fallback.

### Accessibility and UX

The implementation includes:

- semantic form controls,
- keyboard-accessible token selection,
- visible focus behavior,
- loading and disabled states,
- validation feedback,
- focus management after submission,
- responsive layout.

## Scope

I intentionally did not add:

- a backend,
- wallet/blockchain integration,
- a form library,
- global state management,
- or a real swap transaction.

Those additions would not materially improve the requirements of this challenge.

## Assumptions

- The price endpoint supplied by the challenge is the source of truth for available currencies.
- Only currencies with valid prices are considered tradable.
- The provided prices are indicative quotes, not guaranteed executable market prices.
- Submission is simulated because no transaction backend is provided.
