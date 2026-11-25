# Product requirements

Five PRDs, one per outcome. Each PRD is split into phases, and each phase has its own status, scope, and tasks, so a phase can be planned and shipped on its own.

## Format

- A PRD opens with its plan (Free, Fit, or Studio), a one-line status, and a phase table.
- Shared sections (problem, goal, data, metrics, risks) sit at the PRD level. Each `## Phase N` section has a `**Status:**` line, then whatever it needs: scope, requirements, data, tasks.
- Phase statuses: **Shipped**, **Built** (done, waiting on a launch step), **Built, shipping dark**, **In progress**, **Not started**, **Later**.
- Tasks are marked **Done**, **Changed** (shipped differently, and the text now matches the code), or **Open** once work starts.
- Refer to work as "PRD 03 phase 2". Within a PRD, "phase 2" is enough.
- Shipped specs that other work builds on move out of `docs/prd` into `docs/` as reference: [`docs/builds.md`](../builds.md).

## Business model (decided)

Three plans: Free, Fit, and Studio. This table is the source of truth for which plan gets what. The other PRDs point here instead of restating it.

| | Free | Fit, $5 a month | Studio, $20 a month |
| --- | --- | --- | --- |
| Every book recipe, filters, servings scaler | ✓ | ✓ | ✓ |
| Goal presets with the book's ratios (today's goal filters) | ✓ | ✓ | ✓ |
| The basket (pooled list, costs, bundle savings), saved to the account | ✓ | ✓ | ✓ |
| Favorites and reviews | ✓ | ✓ | ✓ |
| Personal targets from goal weight, resting calories, activity (PRD 03 phase 1) | | ✓ | ✓ |
| Per-meal fit and servings suggestions for those targets (PRD 03 phase 1) | | ✓ | ✓ |
| Meal planner from book recipes, leftover-aware (PRD 03 phase 3) | | ✓ | ✓ |
| Send to cart (PRD 02 phase 4) | | ✓ | ✓ |
| Book download (PRD 01 phase 1) | | ✓ | ✓ |
| Makeovers from a link, pasted recipe, or dish name (PRD 04) | | | ✓ |
| Generate a recipe from an idea or goal (PRD 04) | | | ✓ |
| Personal library of generated recipes (PRD 04) | | | ✓ |
| Planner that also uses library recipes and fills gaps with new ones (PRD 04) | | | ✓ |
| Member access through the Claude connector (PRD 04) | | | ✓ |

- **The line between plans is cost to run.** Free is browsing the book. Fit fits the book to the member and gets it into a cart, all formula and data work with almost no cost per member. Studio creates new recipes, which costs a model call each time.
- **Pitches:** Fit is "the book, fit to your body, in your cart." Studio is "any recipe, made over your way."
- **Order:** Fit launches first. Studio starts once Fit has paying members and the book has 50+ recipes.
- **Excluded for now:** early access to new recipes. Every book recipe stays free.
- **Naming:** the basket is ours, where recipes get bundled and priced. The cart belongs to the grocery service. "Send to cart" is the handoff.
- **Later, if needed:** a hard copy book offer. Nothing in these PRDs should block that, but none of it is built now.
- **Later, partner channel:** ForgeFit (a separate personal training app that reads Garmin data) will sell a higher tier that includes MacroMakeovers, and pay this business per user. Data flows from ForgeFit to here (for example weight, resting calories, and average activity burn). It gets its own spec once ForgeFit has a stable API. For now, PRD 01 phase 3 keeps entitlements source-agnostic and PRD 03 phase 1 records the source of weight, resting calories, and activity burn so a partner can supply them later. This site does not track daily intake.

## PRDs

| # | PRD | Plan | Phases | Status |
| --- | --- | --- | --- | --- |
| 01 | [Plans and billing](./01-plans-billing.md) | Free (the gate) | 1 Accounts and Fit subscription, 2 Studio plan level, 3 Partner entitlement | 1 built, launch steps open (Stripe setup, Resend, public release). 2 not started. 3 later |
| 02 | [Shopping](./02-shopping.md) | Free basket, Fit Send to cart | 1 Browser basket, 2 Basket data in the database, 3 Account basket, 4 Send to cart, 5 Basket lines from recipes | 1 and 2 shipped. 3 not started. 4 built, shipping dark (#74). 5 later |
| 03 | [Fit planning](./03-fit-planning.md) | Fit | 1 Personal targets, 2 Ingredient normalization, 3 Meal planner, 4 Auto-suggest | Not started. 4 later |
| 04 | [Studio](./04-studio.md) | Studio | 1 Makeover engine and rules, 2 Library, caps, and cache, 3 Studio planner and connector access | Not started. Needs Fit members and 50+ recipes |
| 05 | [Launch and growth](./05-launch-growth.md) | Free | 1 Launch and advertising, 2 Favorites, 3 Reviews | 1 in progress. 2 not started. 3 later |

## Order

1. **Now, in parallel:** PRD 01 phase 1 launch steps, PRD 02 phase 3 (account basket), PRD 03 phases 1 and 2. None block each other.
2. **Then:** PRD 03 phase 3 (meal planner), which needs PRD 03 phases 1 and 2 and the basket. PRD 02 phase 4 goes live as each grocer is approved.
3. **Launch:** PRD 05 phase 1 once its gates are met: PRD 01 phase 1, the basket, at least one Fit feature beyond the book, and 25 recipes.
4. **After launch:** PRD 05 phase 2 (favorites), PRD 02 phase 5, PRD 03 phase 4.
5. **Once Fit has paying members and 50+ recipes:** PRD 01 phase 2, then PRD 04.

Grocery service options are compared in [`docs/grocery-services.md`](../grocery-services.md), and the market in [`docs/meal-planning-market.md`](../meal-planning-market.md).

Courses (breakfast, appetizer, main, side, sauce) and components (a dish linking the sides and sauces it uses) shipped in #64 without a PRD of their own. [`docs/builds.md`](../builds.md) covers how they touch builds, and PRDs 02 and 03 note where they matter.

## Shared rules

- GraphQL only for API access. Secrets live in hosting env, never in the repo.
- Macro ratios read carbs, fat, protein (C/F/P), with protein given full weight in copy.
- Gating is enforced on the server (resolvers and RLS), never only in the UI.
- Each PRD names its plan at the top (Free, Fit, or Studio). The plan table above decides it.
- Nutrition numbers are estimates. Keep the disclaimer wherever a total is shown.
