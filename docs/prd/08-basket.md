# PRD 08: Basket (free)

## Problem

Cooking two or three recipes in the same stretch is how this book works, but every recipe page prices and lists its ingredients alone. People have to merge the lists by hand and cannot see that buying recipes together costs less than buying each one separately.

## Goal

Anyone can add recipes to a basket, see one pooled shopping list, and see what the trip costs, what it works out to per serving, and how much bundling saves. Paid members can send the basket to a grocery service (PRD 05).

## Naming

**Basket**, not cart. The basket is where recipes get bundled and priced. The cart belongs to the grocery service, and "Send to cart" is the handoff (PRD 05). Keep the two words separate in UI and code.

## Scope

**In**

- "Add to basket" on recipe cards and on the recipe page (the right column reserved for extras). A basket icon with a recipe count in the site header.
- `/basket` page:
  - Recipes in the trip, each with a batch count (1 to 3) and remove. A Clear action.
  - One summary line: trip cost, cost per serving, and the saving over buying each recipe separately.
  - The pooled shopping list, grouped by store section.
  - One bundle suggestion: the recipe that would save the most if added to the current basket.
  - "Send to cart", which opens PRD 05 for paid members and an upgrade prompt for everyone else.
- Pantry staples hidden by default, with a toggle.
- Check off items while shopping.
- Copy the list as plain text.
- Alternate builds of the same recipe (for example bulgogi with ribeye or with flank) are mutually exclusive. Adding one replaces the other.
- Saved to the browser when signed out, saved to the account when signed in. Free.
- A "Cook these together" section on the home page, from the same bundle ranking.

**Out**

- Custom items added by hand. Later.
- Store-specific or live prices. Prices are a dated snapshot.
- Several saved baskets or trip history. One active basket for now.
- The meal planner (PRD 04). It fills the basket later, it is not part of it.

## Cost model

Two numbers, and both stay:

- **Trip cost:** whole packs bought, rounded up once across all recipes in the basket. Items sold per lb are priced by exact weight. This is what the receipt shows, and the bundling saving only shows up here.
- **Per serving (prorated):** the share of each pack the recipes actually use, divided by servings. This is how the cost estimates and the `$` tiers on recipe pages are calculated, so the basket must show the same number. It adds up recipe by recipe, so it never shows a saving.
- **Saved by bundling:** the sum of each recipe's trip cost bought alone, minus the pooled trip cost.
- Leftovers: the trip cost minus the prorated cost. Show it as a short note only when short-shelf-life items (herbs, spinach, avocado and similar) make up a meaningful part, for example "$3 of herbs and spinach may go unused".
- Label every cost an estimate, with the date of the price snapshot.

## Requirements

1. The pricing math is pure, tested functions in `src/libs/basket`: pool lines, pack rounding, prorated cost, savings, leftovers, and bundle ranking. The rules match `docs/shopping-list-data.md`.
2. v1 data comes from `docs/basket-data.json`, moved into typed data keyed by recipe slug. Each price item gets a `category` (produce, meat and seafood, dairy and eggs, bakery, pantry, spices, frozen) for grouping.
3. A test fails if a basket entry's slug has no published recipe. Recipes without basket data do not show "Add to basket".
4. Signed-out baskets live in browser storage. On sign-in, the browser basket merges into the account basket (recipes combined, the higher batch count kept), then browser storage clears.
5. List lines read like a receipt: "2 × 16 oz tub cottage cheese" with the cost on the right. Tapping a line shows which recipes use it. Short-shelf-life items get a small marker.
6. Store names from the price research stay out of the UI. One line under the list says prices are the lowest found across several stores on the snapshot date.
7. Mobile first. No wide tables. The list is stacked rows on small screens.
8. Macro display follows the site rules (C/F/P order, protein given full weight) anywhere the basket shows nutrition.
9. The bundle ranking covers pairs and trios of published recipes. That is a few hundred combinations, so it can run in the browser or be cached at build time.

## Data

- v1 prices and recipe lines: typed data in the repo, from `docs/basket-data.json`.
- `baskets(id, user_id, include_pantry, updated_at)`, one per user for now.
- `basket_entries(basket_id, recipe_id, batches)` and `basket_checks(basket_id, item_key)`.
- RLS: a member reads and writes only their own basket.
- Once PRD 03 lands, recipe lines come from structured ingredients mapped to price items, and the hand-written lines in the data file retire.

## Success metrics

- Share of recipe page visitors who add to the basket.
- Baskets with two or more recipes.
- Basket to "Send to cart" clicks, and the upgrade prompt to checkout rate from that click.
- Sign-ups that start from the basket.

## Risks and open questions

- Drift. The owner edits recipes live, and the hand-written basket lines will not follow those edits until PRD 03. The slug test catches missing recipes, not changed amounts. Consider a check that flags a recipe edited after its basket lines were last updated.
- Stale prices. Decide how often the snapshot gets refreshed and show its date.
- Alternate builds (`9a`, `11a` in the data) need real recipe slugs before they can show up.
- Whether the summary line also shows total protein for the trip. It fits the book, but keep the line short.

## Tasks

1. Typed basket data with categories, and the slug coverage test.
2. Pricing and bundle functions with tests.
3. Basket provider (browser storage), "Add to basket" buttons, and the header count.
4. `/basket` page: recipes, summary line, grouped list, pantry toggle, check off, copy as text.
5. Bundle suggestion on `/basket` and "Cook these together" on the home page.
6. Account basket: migration, GraphQL, RLS, and the merge on sign-in.
7. "Send to cart" button wired to the upgrade prompt until PRD 05 ships.
