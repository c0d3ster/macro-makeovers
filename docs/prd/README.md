# Product requirements

PRDs for the post-launch features. Each file is self-contained: problem, scope, requirements, data, open questions, tasks.

## Business model (decided)

- **Free:** every recipe, filters, servings scaler, accounts, personalization, reviews.
- **Paid, one plan:** meal planning, grocery list and ordering, and the book download. A small monthly price.
- **Later, if needed:** a hard copy book tier and a more comprehensive planning tier. Nothing in these PRDs should block that, but none of it is built now.
- **Later, partner channel:** ForgeFit (a separate personal training app that reads Garmin data) will sell a higher tier that includes MacroMakeovers, and pay this business per user. Data flows from ForgeFit to here (for example weight, resting calories, and average activity burn). It needs its own PRD once ForgeFit has a stable API. For now, PRD 01 keeps entitlements source-agnostic and PRD 02 records the source of weight, resting calories, and activity burn so a partner can supply them later. This site does not track daily intake.

## Order

| #   | PRD                                                    | Depends on | Why this order                                       |
| --- | ------------------------------------------------------ | ---------- | ---------------------------------------------------- |
| 01  | [Accounts and subscription](./01-accounts-subscription.md) | none       | Revenue gate. Everything paid hangs off it.          |
| 02  | [Personalization](./02-personalization.md)             | 01         | Free hook that makes the planner useful.             |
| 03  | [Ingredient normalization](./03-ingredient-normalization.md) | none | Hard prerequisite for planner and cart. Can start now. |
| 04  | [Meal planner](./04-meal-planner.md)                   | 01, 02, 03 | Core paid feature.                                   |
| 05  | [Grocery list and ordering](./05-grocery-ordering.md)  | 03, 04     | Second paid feature. Output of the planner.          |
| 06  | [Reviews](./06-reviews.md)                             | 01         | Free engagement. Lowest priority until there is traffic. |
| 07  | [Launch and advertising](./07-launch.md)               | 01 minimum | Gets paying users. Can overlap with 02 to 05.        |

03 has no dependencies and 01 only needs the existing schema, so they can run in parallel.

## Shared rules

- GraphQL only for API access. Secrets live in hosting env, never in the repo.
- Macro ratios read carbs, fat, protein (C/F/P), with protein given full weight in copy.
- Gating is enforced on the server (resolvers and RLS), never only in the UI.
- Nutrition numbers are estimates. Keep the disclaimer wherever a total is shown.
