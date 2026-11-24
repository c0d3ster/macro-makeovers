# Product requirements

PRDs for the post-launch features. Each file is self-contained: problem, scope, requirements, data, open questions, tasks.

## Business model (decided)

Three plans: Free, Fit, and Studio. This table is the source of truth for which plan gets what. The other PRDs point here instead of restating it.

| | Free | Fit, $5 a month | Studio, $20 a month |
| --- | --- | --- | --- |
| Every book recipe, filters, servings scaler | ✓ | ✓ | ✓ |
| Goal presets with the book's ratios (today's goal filters) | ✓ | ✓ | ✓ |
| The basket (pooled list, costs, bundle savings), saved to the account | ✓ | ✓ | ✓ |
| Favorites and reviews | ✓ | ✓ | ✓ |
| Personal targets from goal weight, resting calories, activity (PRD 02) | | ✓ | ✓ |
| Per-meal fit and servings suggestions for those targets (PRD 02) | | ✓ | ✓ |
| Meal planner from book recipes, leftover-aware (PRD 04) | | ✓ | ✓ |
| Send to cart (PRD 05) | | ✓ | ✓ |
| Book download (PRD 01) | | ✓ | ✓ |
| Makeovers from a link, pasted recipe, or dish name (PRD 10) | | | ✓ |
| Generate a recipe from an idea or goal (PRD 10) | | | ✓ |
| Personal library of generated recipes (PRD 10) | | | ✓ |
| Planner that also uses library recipes and fills gaps with new ones (PRD 10) | | | ✓ |
| Member access through the Claude connector (PRD 10) | | | ✓ |

- **The line between plans is cost to run.** Free is browsing the book. Fit fits the book to the member and gets it into a cart, all formula and data work with almost no cost per member. Studio creates new recipes, which costs a model call each time.
- **Pitches:** Fit is "the book, fit to your body, in your cart." Studio is "any recipe, made over your way."
- **Order:** Fit launches first. Studio starts once Fit has paying members and the book has 50+ recipes.
- **Excluded for now:** early access to new recipes. Every book recipe stays free.
- **Naming:** the basket is ours, where recipes get bundled and priced. The cart belongs to the grocery service. "Send to cart" is the handoff.
- **Later, if needed:** a hard copy book offer. Nothing in these PRDs should block that, but none of it is built now.
- **Later, partner channel:** ForgeFit (a separate personal training app that reads Garmin data) will sell a higher tier that includes MacroMakeovers, and pay this business per user. Data flows from ForgeFit to here (for example weight, resting calories, and average activity burn). It needs its own PRD once ForgeFit has a stable API. For now, PRD 01 keeps entitlements source-agnostic and PRD 02 records the source of weight, resting calories, and activity burn so a partner can supply them later. This site does not track daily intake.

## Order

| #   | PRD                                                    | Depends on | Why this order                                       | Status |
| --- | ------------------------------------------------------ | ---------- | ---------------------------------------------------- | ------ |
| 01  | [Accounts and plans](./01-accounts-subscription.md) | none       | Revenue gate. Everything paid hangs off it.          | Sign-up live (Google and email, tested Nov 13). Subscription built (tasks 2 to 7): Stripe Checkout, Portal, webhook, `hasPaidAccess`, gated book, pricing page, emails. Waiting on Stripe setup and `db:push`. |
| 02  | [Personalization](./02-personalization.md)             | 01         | Fit's headline feature, and what makes the planner useful. | Not started. Goal filters exist without a profile. |
| 03  | [Ingredient normalization](./03-ingredient-normalization.md) | none | Prerequisite for the planner and for basket lines that follow recipe edits. Can start now. | Not started. |
| 08  | [Basket](./08-basket.md)                               | none (01 for account saving) | Free hook and the shopping list. Runs on the price data that exists today. | Browser basket shipped. Account basket open. |
| 04  | [Meal planner](./04-meal-planner.md)                   | 01, 02, 03, 08 | Core Fit feature. Fills the basket.              | Not started. |
| 05  | [Grocery ordering](./05-grocery-ordering.md)           | 01, 08     | Fit feature. "Send to cart" from the basket.     | Built, shipping dark (#74). Kroger, Walmart and Instacart adapters, picker, gating seam, handoff log. Waiting on grocer API approval and PRD 01's `hasPaidAccess`; Walmart also needs item ids. |
| 06  | [Favorites and reviews](./06-reviews.md)               | 01         | Free engagement, later. Favorites first, reviews once there is traffic. | Not started. |
| 07  | [Launch and advertising](./07-launch.md)               | 01, 08 minimum | Gets paying users. Can overlap with 02 to 05.    | Not checked. |
| 09  | [Builds](./09-builds.md)                               | none       | Lets filters and the basket use every build, not only the default. Before 02 and 04, which judge fit per build. | Shipped. |
| 10  | [Studio](./10-studio.md)                               | 01, 02, 03, 04 | The $20 plan. Needs Fit members and 50+ recipes first. | Planned, not started. |

03, 08, 09, and 01 have no blocking dependencies, so they can run in parallel. 08 is numbered last because it was added later, but it builds early. Grocery service options are compared in [`docs/grocery-services.md`](../grocery-services.md).

Courses (breakfast, appetizer, main, side, sauce) and components (a dish linking the sides and sauces it uses) shipped in #64 without a PRD of their own. PRD 09 covers how they touch builds, and PRDs 02, 03, 04, and 08 note where they matter.

## Shared rules

- GraphQL only for API access. Secrets live in hosting env, never in the repo.
- Macro ratios read carbs, fat, protein (C/F/P), with protein given full weight in copy.
- Gating is enforced on the server (resolvers and RLS), never only in the UI.
- Each PRD names its plan in the title (Free, Fit, or Studio). The plan table above decides it.
- Nutrition numbers are estimates. Keep the disclaimer wherever a total is shown.
