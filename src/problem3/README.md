# Problem 3 — Messy React

This solution focuses on identifying the correctness issues, computational inefficiencies, and React/TypeScript anti-patterns in the provided component, then refactoring it without introducing unnecessary abstractions.

The refactored implementation is provided separately in `wallet-page.tsx`.

## Issues Identified

### 1. `WalletBalance` does not define `blockchain`

The component reads `balance.blockchain`, but the original `WalletBalance` interface only defines:

```ts
interface WalletBalance {
  currency: string;
  amount: number;
}
```

This is a TypeScript correctness issue. The interface should reflect the actual shape returned by `useWalletBalances()`.

---

### 2. `getPriority` uses `any`

```ts
const getPriority = (blockchain: any): number => {
```

Using `any` removes useful compile-time checking. The blockchain value should use an explicit domain type when the set of supported blockchains is known, or at minimum `string` when the data comes from an external source.

---

### 3. Priority values use magic numbers

Values such as `100`, `50`, `20`, and especially `-99` are embedded directly in the logic.

```ts
default:
  return -99;
```

The `-99` value is then used as a sentinel elsewhere in the component. This makes the intent harder to understand and couples the filtering logic to an arbitrary number.

A lookup object or explicit unsupported state makes the relationship between blockchain and priority clearer.

---

### 4. `lhsPriority` is undefined

Inside the filter:

```ts
const balancePriority = getPriority(balance.blockchain);

if (lhsPriority > -99) {
```

`lhsPriority` does not exist in this scope. The intended variable appears to be `balancePriority`.

This is a correctness issue and would fail type checking.

---

### 5. The balance filter appears to contain reversed logic

The original code keeps balances when:

```ts
balance.amount <= 0
```

For a wallet balance list, the expected behavior is usually to display supported balances with a positive amount.

Assuming that is the intended behavior, the condition should be:

```ts
balance.amount > 0
```

This is an assumption because the business requirement is not explicitly provided in the challenge.

---

### 6. The filter is unnecessarily nested

The original predicate uses nested `if` statements and an explicit fallback:

```ts
if (...) {
  if (...) {
    return true;
  }
}

return false;
```

This can be expressed as a single boolean condition, which is easier to read and verify.

---

### 7. `useMemo` has an unnecessary dependency

`sortedBalances` depends on:

```ts
[balances, prices]
```

but `prices` is not used in the filtering or sorting computation.

As a result, every price update causes the entire filter and sort operation to run again even when the balances have not changed.

The dependency list should only include values used by the memoized computation:

```ts
[balances]
```

`useMemo` itself is not inherently a problem here. Filtering and sorting are derived work, and memoization may be reasonable depending on the size and stability of `balances`. The issue is the incorrect dependency list and the surrounding implementation.

---

### 8. `getPriority` is recreated on every render

`getPriority` is static application logic and does not depend on component state or props.

Keeping it inside the component recreates the function on every render. The performance impact is very small in this example, but moving static data and helpers outside the component better communicates that they are not render-specific.

---

### 9. Priority lookup is repeated during sorting

The sort comparator repeatedly calls `getPriority` for both elements:

```ts
const leftPriority = getPriority(lhs.blockchain);
const rightPriority = getPriority(rhs.blockchain);
```

Sorting invokes the comparator multiple times, so these lookups are repeated.

For the small `switch` in the original code this is not a major performance issue, but a static priority lookup object makes the code simpler and more declarative.

---

### 10. The sort comparator does not explicitly return `0`

The comparator returns `-1` or `1` but has no return value when the priorities are equal.

A comparator should explicitly handle equality. The logic can also be simplified to:

```ts
rightPriority - leftPriority
```

which naturally returns `0` when both priorities are equal.

---

### 11. `formattedBalances` is calculated but never used

The component creates:

```ts
const formattedBalances = sortedBalances.map(...)
```

but later renders from `sortedBalances` instead.

This causes an unnecessary `O(n)` pass and allocates a new array that is never consumed.

The formatting should either be performed where it is used or the render should use `formattedBalances`.

---

### 12. `FormattedWalletBalance` is used with the wrong data

The render code maps over `sortedBalances` but annotates each item as:

```ts
FormattedWalletBalance
```

However, `sortedBalances` contains `WalletBalance` objects and does not contain the `formatted` property.

This makes the type annotation inconsistent with the actual data flow.

---

### 13. There are duplicate transformation passes

The original code:

1. filters balances,
2. sorts balances,
3. maps them into `formattedBalances`,
4. then maps `sortedBalances` again to create rows.

The formatting pass is therefore redundant.

Keeping one clear transformation/rendering path reduces both computation and cognitive overhead.

---

### 14. `toFixed()` is used without an explicit precision

```ts
balance.amount.toFixed()
```

Without an argument, `toFixed()` formats the number with zero decimal places.

That can be misleading for token balances. For example, `0.42` would display as `"0"`.

The desired precision should be explicit or delegated to a shared number-formatting utility if one exists in the application.

---

### 15. The empty `Props` interface adds no behavior

```ts
interface Props extends BoxProps {}
```

Because no additional properties are introduced, a type alias is simpler:

```ts
type Props = BoxProps;
```

This is a minor readability improvement rather than a correctness issue.

---

### 16. `children` is destructured but not used

```ts
const { children, ...rest } = props;
```

The component never renders `children`.

If the component is not intended to render nested content, there is no reason to destructure it. If it is intended to behave like a normal container, then `{children}` should be rendered.

---

### 17. `React.FC` is unnecessary here

```ts
const WalletPage: React.FC<Props> = ...
```

`React.FC` is valid, but it does not provide any benefit for this component. A normal typed function component is simpler:

```ts
const WalletPage = (props: Props) => {
```

This is a style choice, not a serious anti-pattern.

---

## Refactoring Decisions

The refactor intentionally stays close to the original component rather than introducing additional hooks, services, or abstractions.

The main changes are:

- Correct the `WalletBalance` type so it includes `blockchain`.
- Replace `any` with an explicit blockchain type where appropriate.
- Replace the `switch` and `-99` sentinel with a static priority lookup.
- Fix the undefined `lhsPriority` reference.
- Filter supported balances using a clear boolean predicate.
- Assume that only positive balances should be rendered.
- Keep the sort memoized but remove the unused `prices` dependency.
- Use a comparator that naturally handles equal priorities.
- Remove the unused `formattedBalances` transformation.
- Format amounts only where the formatted value is actually needed.
- Keep price-dependent calculations outside `sortedBalances`, because price changes should not trigger another filter/sort operation.
- Remove unused prop destructuring and unnecessary component typing.

## Assumptions

1. `useWalletBalances()` returns balances containing a `blockchain` field in addition to `currency` and `amount`.
2. Only balances with a positive amount should be displayed.
3. Unsupported blockchains should be excluded from the rendered balance list.
4. The blockchain priority order in the original implementation represents the intended business ordering.
5. `prices[currency]` contains the USD price for a currency, as implied by the original code.
6. The surrounding hooks and UI components are assumed to keep their existing APIs; the refactor only addresses the supplied component.
7. The exact number-formatting rules are not provided, so the refactored implementation uses an explicit precision as an example rather than treating it as a domain requirement.

## Complexity

Let `n` be the number of wallet balances.

- Filtering: `O(n)`
- Sorting: `O(n log n)`
- Rendering: `O(n)`

The overall complexity is therefore dominated by sorting:

```text
O(n log n)
```

The refactor does not attempt to optimize beyond this because ordering the balances by priority inherently requires sorting unless the data is already provided in priority order.

The main performance improvements are instead removing redundant work:

- price updates no longer retrigger balance filtering and sorting,
- the unused `formattedBalances` pass is removed,
- static priority data is moved outside the render path.

## Notes

I intentionally avoided splitting this small component into multiple custom hooks or utility layers. The main problems in the original implementation are correctness, duplicated work, type safety, and readability; adding more abstractions would not materially improve the solution at this scope.
