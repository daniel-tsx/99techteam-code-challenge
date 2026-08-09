# 99Tech Frontend Code Challenge

My solutions for the [99Tech Code Challenge](https://github.com/99techteam/code-challenge), covering frontend Problems 1–3.

The repository intentionally keeps each problem independent. The amount of tooling and structure used for each solution reflects the scope of the problem rather than applying the same application setup everywhere.

## Solutions

| Problem | Solution | Approach |
| --- | --- | --- |
| [Problem 1 — Three Ways to Sum to `n`](src/problem1) | JavaScript | Three distinct approaches: iterative, arithmetic formula, and recursion, with complexity and trade-off analysis. |
| [Problem 2 — Fancy Form](src/problem2) | Vite + React + TypeScript | A runnable currency swap form using the challenge-provided pricing feed, with validation, loading/error states, responsive UI, and accessibility considerations. |
| [Problem 3 — Messy React](src/problem3) | React + TypeScript refactor | Code review and refactoring focused on correctness, type safety, unnecessary computation, React patterns, and maintainability. |

Each problem contains its own README with the reasoning, assumptions, and technical decisions behind the solution.

## Repository Structure

```text
src/
├── problem1/
│   ├── solution.js
│   └── README.md
├── problem2/
│   ├── README.md
│   ├── package.json
│   └── src/
└── problem3/
    ├── WalletPage.refactored.tsx
    └── README.md
```

## Running Problem 2

Problem 2 is the only solution that requires a runnable application.

Requirements:

- Node.js 20+
- npm

From the repository root:

```bash
cd src/problem2
npm install
npm run dev
```

To verify the production build:

```bash
npm run lint
npm run build
```

## AI Usage

I used AI coding tools while completing this challenge, as I do in my normal development workflow.

I used AI primarily to accelerate mechanical implementation, explore alternatives, and review the solution for issues I might have missed. I did not treat generated code as the final answer by default.

I remained responsible for the engineering decisions in the submitted solution, including:

- deciding the scope of each problem,
- choosing the implementation approach and level of abstraction,
- defining the React state model and component boundaries,
- deciding which dependencies were justified,
- reviewing generated code for correctness and unnecessary complexity,
- identifying and fixing interaction and asynchronous edge cases,
- validating assumptions against the problem requirements,
- and deciding when the solution was complete rather than continuing to add features.

For example, in Problem 2 I kept calculated values such as the exchange rate and receive amount as derived values instead of duplicating them in state, and I reviewed asynchronous interactions to prevent price refreshes from overlapping with submission.

For Problem 3, AI-assisted review was useful for generating possible observations, but I classified the findings myself and distinguished actual correctness/type-safety issues from performance considerations and subjective style preferences.

My view is that AI can accelerate implementation and review, but it does not transfer engineering ownership. I reviewed the final submitted code and should be able to explain and defend the decisions behind every solution.

## Engineering Approach

I treated the three tasks differently based on what each problem was intended to evaluate.

### Keep simple problems simple

Problem 1 does not need application infrastructure or additional dependencies. The focus is on the algorithms, their complexity, and the trade-offs between the three implementations.

### Invest in user-facing behavior where it matters

Problem 2 is the UI-focused exercise, so most of the implementation effort is spent on behavior and usability:

- clear input validation,
- derived state instead of duplicated state,
- pricing request loading, refresh, error, and retry behavior,
- prevention of invalid currency pairs,
- responsive layout,
- keyboard interaction and accessibility,
- graceful handling of missing token assets,
- simulated asynchronous submission.

The pricing endpoint supplied by the challenge is used directly. The swap submission is simulated because no transaction backend is provided.

### Refactor for correctness before style

Problem 3 prioritizes actual correctness and maintainability issues over subjective style preferences.

The review distinguishes between:

- correctness bugs,
- TypeScript/type-safety issues,
- unnecessary computation,
- React dependency/state problems,
- readability improvements,
- and minor stylistic choices.

The refactor intentionally stays close to the supplied code instead of introducing abstractions that are not justified by the scope.

## Scope

I intentionally avoided adding infrastructure that does not materially help solve the challenge, such as:

- a backend service,
- global state management,
- a large form library,
- Storybook,
- or additional application scaffolding around isolated problems.

The goal is to keep each solution easy to review while still demonstrating the engineering decisions behind it.

## Notes

The original challenge instructions and problem statements are available in the upstream repository:

https://github.com/99techteam/code-challenge
