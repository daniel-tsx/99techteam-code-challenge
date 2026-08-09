# Problem 1 — Three Ways to Sum to `n`

This problem asks for three unique implementations of a function that returns:

```text
1 + 2 + ... + n
```

The goal is not only to provide three syntactically different versions, but to demonstrate three genuinely different approaches and make their trade-offs explicit.

## Assumptions

The challenge states that `n` is an integer and that the result will be smaller than `Number.MAX_SAFE_INTEGER`.

I interpret the summation as the sum of positive integers from `1` through `n`.

For `n <= 0`, the result is `0`.

I intentionally do not add extra runtime validation for non-integer input because the challenge already defines `n` as an integer. In a real public API or other untrusted boundary, I would validate the input contract explicitly.

## Approach A — Iterative

The first implementation accumulates the result with a loop.

```js
var sum_to_n_a = function (n) {
  let sum = 0;

  for (let i = 1; i <= n; i++) {
    sum += i;
  }

  return sum;
};
```

### Complexity

- Time: `O(n)`
- Space: `O(1)`

### Notes

This is the most straightforward implementation. It is easy to understand and does not allocate additional memory as `n` grows.

It is still linear, however, so the amount of work increases directly with the size of the input.

---

## Approach B — Arithmetic Series Formula

The second implementation uses the closed-form formula for the sum of the first `n` positive integers.

```js
var sum_to_n_b = function (n) {
  if (n <= 0) return 0;

  return (n * (n + 1)) / 2;
};
```

### Complexity

- Time: `O(1)`
- Space: `O(1)`

### Notes

This is the implementation I would choose for production under the constraints of this challenge.

The number of operations does not increase with `n`; the result is computed with a fixed amount of arithmetic work.

The challenge guarantees that the final result stays within JavaScript's safe integer range, so using `number` is appropriate here. If exact results beyond `Number.MAX_SAFE_INTEGER` were required, I would use `BigInt` or another exact integer representation instead.

---

## Approach C — Recursive

The third implementation expresses the same recurrence recursively.

```js
var sum_to_n_c = function (n) {
  if (n <= 0) return 0;

  return n + sum_to_n_c(n - 1);
};
```

### Complexity

- Time: `O(n)`
- Space: `O(n)`

### Notes

This is intentionally included as a genuinely different implementation rather than another variation of a loop.

It is not the approach I would use for large inputs in JavaScript because every recursive call consumes stack space. A sufficiently large `n` will hit the runtime's call-stack limit long before the numeric limit defined by the challenge.

For that reason, recursion is useful here to demonstrate the trade-off, but not as the preferred production solution.

## Why These Three Approaches?

I intentionally did not use variants such as:

```text
for loop
while loop
Array.from(...).reduce(...)
```

as the three solutions.

Although they look different syntactically, they all represent essentially the same linear accumulation strategy.

The submitted approaches instead demonstrate three different models:

1. iterative accumulation,
2. direct mathematical computation,
3. recursive decomposition.

This makes the trade-offs in runtime, memory usage, and practical suitability clearer.

## Comparison

| Approach | Time | Extra Space | Practical Use |
| --- | --- | --- | --- |
| Iterative | `O(n)` | `O(1)` | Simple and reliable |
| Formula | `O(1)` | `O(1)` | Preferred solution |
| Recursive | `O(n)` | `O(n)` | Demonstrates recursion, but stack-limited |

## Edge Cases

Representative cases include:

```js
sum_to_n(0) === 0;
sum_to_n(1) === 1;
sum_to_n(5) === 15;
sum_to_n(100) === 5050;
```

Under the assumption documented above:

```js
sum_to_n(-1) === 0;
```

If negative integers were meant to follow a different mathematical definition, I would clarify that contract rather than silently inventing different behavior.

## Production Choice

For this exact problem, I would use the arithmetic formula.

It is both the simplest and the most efficient implementation:

```js
return n > 0 ? (n * (n + 1)) / 2 : 0;
```

The iterative and recursive implementations are included because the challenge explicitly asks for three unique solutions, not because all three would be equally appropriate in production.
