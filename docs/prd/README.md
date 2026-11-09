# Product requirements

PRDs for the post-launch features. Each file is self-contained: problem, scope, requirements, data, open questions, tasks.

## Business model (decided)

- **Free:** every recipe, filters, servings scaler, accounts, personalization, the basket (pooled shopping list, costs, bundle savings) saved to the account, favorites, and reviews.
- **Paid, one plan:** meal planning with leftover-aware suggestions, ordering ("Send to cart" from the basket), and the book download. 5 dollars a month. Store price comparison from our own price checks per chain is planned for this plan (PRD 05).
- **Excluded for now:** early access to new recipes. Every recipe stays free.
- **Naming:** the basket is ours, where recipes get bundled and priced. The cart belongs to the grocery service. "Send to cart" is the handoff.
- **Later, if needed:** a hard copy book tier and a more comprehensive planning tier. Nothing in these PRDs should block that, but none of it is built now.
- **Later, partner channel:** ForgeFit (a separate personal training app that reads Garmin data) will sell a higher tier that includes MacroMakeovers, and pay this business per user. Data flows from ForgeFit to here (for example weight, resting calories, and average activity burn). It needs its own PRD once ForgeFit has a stable API. For now, PRD 01 keeps entitlements source-agnostic and PRD 02 records the source of weight, resting calories, and activity burn so a partner can supply them later. This site does not track daily intake.

## Order

| #   | PRD                                                    | Depends on | Why this order                                       |
| --- | ------------------------------------------------------ | ---------- | ---------------------------------------------------- |
| 01  | [Accounts and subscription](./01-accounts-subscription.md) | none       | Revenue gate. Everything paid hangs off it.          |
| 02  | [Personalization](./02-personalization.md)             | 01         | Free hook that makes the planner useful.             |
| 03  | [Ingredient normalization](./03-ingredient-normalization.md) | none | Prerequisite for the planner and for basket lines that follow recipe edits. Can start now. |
| 08  | [Basket](./08-basket.md)                               | none (01 for account saving) | Free hook and the shopping list. Runs on the price data that exists today. |
| 04  | [Meal planner](./04-meal-planner.md)                   | 01, 02, 03, 08 | Core paid feature. Fills the basket.             |
| 05  | [Grocery ordering](./05-grocery-ordering.md)           | 01, 08     | Second paid feature. "Send to cart" from the basket. |
| 06  | [Favorites and reviews](./06-reviews.md)               | 01         | Free engagement, later. Favorites first, reviews once there is traffic. |
| 07  | [Launch and advertising](./07-launch.md)               | 01, 08 minimum | Gets paying users. Can overlap with 02 to 05.    |

03, 08, and 01 have no blocking dependencies, so they can run in parallel. 08 is numbered last because it was added later, but it builds early. Grocery service options are compared in [`docs/grocery-services.md`](../grocery-services.md).

## Shared rules

- GraphQL only for API access. Secrets live in hosting env, never in the repo.
- Macro ratios read carbs, fat, protein (C/F/P), with protein given full weight in copy.
- Gating is enforced on the server (resolvers and RLS), never only in the UI.
- Nutrition numbers are estimates. Keep the disclaimer wherever a total is shown.
