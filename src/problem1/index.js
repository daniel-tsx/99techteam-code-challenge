/**
 * Assumption:
 * The summation is defined as 1 + 2 + ... + n.
 * For n <= 0, the result is 0.
 */

/**
 * Iterative approach
 * Time: O(n)
 * Space: O(1)
 */
var sum_to_n_a = function (n) {
  let sum = 0;

  for (let i = 1; i <= n; i++) {
    sum += i;
  }

  return sum;
};

/**
 * Arithmetic progression formula
 * Time: O(1)
 * Space: O(1)
 */
var sum_to_n_b = function (n) {
  if (n <= 0) return 0;

  return (n * (n + 1)) / 2;
};

/**
 * Recursive approach
 * Time: O(n)
 * Space: O(n)
 *
 * Included as a distinct implementation, although it is not suitable
 * for very large n because of the JavaScript call stack limit.
 */
var sum_to_n_c = function (n) {
  if (n <= 0) return 0;

  return n + sum_to_n_c(n - 1);
};