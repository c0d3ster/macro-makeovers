# PRD 08: Basket (free)

**Status:** The browser basket is shipped: `/basket`, "Add to basket" on cards and recipe pages, builds and servings (#57, #59), and "Cook these together" on the home page. Basket data lives in the database with each recipe (task 8). Open: the account basket (task 6), the real "Send to cart" (PRD 05), and a drift check. Requirements and tasks below are marked **Done**, **Changed** (shipped differently, and the text now matches the code), or **Open**.

## Problem

Cooking two or three recipes in the same stretch is how this book works, but every recipe page prices and lists its ingredients alone. People have to merge the lists by hand and cannot see that buying recipes together costs less than buying each one separately.

## Goal

Anyone can add recipes to a basket, see one pooled shopping list, and see what the trip costs, what each recipe works out to per serving, and how much bundling saves. Paid members can send the basket to a grocery service (PRD 05).

## Naming

**Basket**, not cart. The basket is where recipes get bundled and priced. The cart belongs to the grocery service, and "Send to cart" is the handoff (PRD 05). Keep the two words separate in UI and code.

## Scope

**In**

- "Add to basket" on recipe cards (a round button on the photo) and on the recipe page, under the ingredients. A basket icon with a recipe count in the site header.
- `/basket` page:
  - Recipes in the trip, each with a servings stepper (1 to 24, the same range as the recipe page), its cost per serving in this trip, and remove. A Clear action.
  - A summary: the trip cost before tax, and what the trip saves against buying every recipe as written. When it saves anything, a small table sets "This trip" against "Normally" for the register total and what is left over.
  - The pooled shopping list, grouped by store section.
  - One bundle suggestion: the recipe that would save the most if added to the current basket.
  - "Send to cart", which opens PRD 05 for paid members. Until PRD 05 ships it is a placeholder that says ordering is coming with the paid plan.
- Pantry staples hidden by default, with a toggle.
- Check off items while shopping.
- Copy the list as plain text.
- Builds of the same recipe (for example the turkey or beef Taco Grillers) are mutually exclusive. Adding one replaces the other. See PRD 09.
- Saved to the browser when signed out, saved to the account when signed in. Free.
- A "Cook these together" section on the home page, from the same bundle ranking.

**Out**

- Custom items added by hand. Later.
- Store-specific or live prices. Prices are a dated snapshot.
- Several saved baskets or trip history. One active basket for now.
- The meal planner (PRD 04). It fills the basket later, it is not part of it.

## Cost model

- **Trip cost:** the cheapest mix of pack sizes that covers what every recipe in the basket needs, bought once across all of them. Items sold per lb are priced by exact weight. This is what the receipt shows, and the bundling saving only shows up here.
- **Prorated cost:** a recipe's share of the smallest pack size that covers what it uses (a bigger size wins when it costs at most 10 percent more). This is how the cost estimates and the `$` tiers on recipe pages are calculated. It is derived from the lines and prices, never stored, and an import warns when a listed build lands in a different tier than it says.
- **Per serving in the basket:** each recipe's part of the pooled trip at the register, divided by its servings. A recipe starts at its own trip's price and takes its part of what pooling saves on each item it shares. So it reads higher than the recipe page, and a note under the list says why.
- **Saved:** every recipe bought as written (on its own trip, at its own servings, scaled to the servings in the basket, and for the same build) minus the pooled trip. One number covers both pooling and cooking more servings than the recipe makes.
- **Leftovers:** what the trip buys but the recipes do not use. When short-shelf-life items left over come to at least a dollar, a note names them: "About $3 of cilantro and spinach may spoil before you use them."
- Label every cost an estimate, with the date of the price snapshot.

## Requirements

1. **Done.** The pricing math is pure, tested functions in `src/libs/basket/basketMath.ts`: pool lines, pack sizes, prorated cost, savings against recipes as written, per-recipe shares, leftovers, and bundle ranking. The rules match `docs/shopping-list-data.md`.
2. **Changed.** Price data lives in the database: `basket_items` and `basket_item_sizes` are the price book, each with a `section` (produce, meat, dairy, bakery, frozen, pantry, spices) for grouping, `pantry` and `perishable` flags, optional larger sizes, and where and when its price was found (`price_source`, `is_estimate`, `priced_on`). Each recipe carries its `basketLines` (`recipe_basket_lines`) and per-build changes (`recipe_build_basket_lines`, PRD 09) through import. The basket math takes the catalog as an argument, loaded on the server by `BasketRepository`.
3. **Changed.** Import rejects a line whose item key is not in the price book, a build change on a recipe with no lines, and a build left with nothing to buy. Build keys are checked by the import schema. A test checks every seed line names a seed item and every seed recipe's tier matches its prices. Recipes without basket lines do not show "Add to basket".
4. **Open.** Signed-out baskets live in browser storage (done). On sign-in, the browser basket merges into the account basket (recipes combined, the higher servings kept), then browser storage clears (open).
5. **Changed.** Each list line shows the item name, what to buy under it ("1 × 8 oz block", "1.5 lb"), and the cost on the right. A short-shelf-life item says "short shelf life", and an item two or more recipes use says "shared by" and names them. Checked items strike through.
6. **Changed.** One line under the list says costs are estimates from the lowest prices found at national chains and Martin's on the snapshot date, and that recipe pages count only what a recipe uses. Other store names stay out of the UI.
7. Mobile first. No wide tables. The list is stacked rows on small screens.
8. Macro display follows the site rules (C/F/P order, protein given full weight) anywhere the basket shows nutrition. The basket shows no nutrition today.
9. **Changed.** "Cook these together" ranks every pair of published recipes with basket data and shows the best pairs that do not share a recipe. The `/basket` suggestion tries adding each recipe not already in the basket. Trios are not ranked.

## Data

- Prices and recipe lines: in the database (requirement 2). The seed copy is `content/basket/items.json` and the seed recipes' `basketLines`, written with `pnpm basket:sync`. The note under the list shows the range of `priced_on` dates.
- Browser storage (`macro-makeovers-basket-v1`): entries of `{ slug, build?, servings }`, the pantry toggle, and checked item keys. Repeats and bad servings are dropped on read. Recipes that lost their basket data drop out on `/basket`, which has the catalog, so a catalog that fails to load never empties a saved basket.
- Account basket, not built: `baskets(id, user_id, include_pantry, updated_at)`, one per user for now. `basket_entries(basket_id, recipe_id, build_key, servings)` and `basket_checks(basket_id, item_key)`.
- RLS: a member reads and writes only their own basket.
- Once PRD 03 lands, recipe lines come from structured ingredients mapped to price items, and the hand-written `basketLines` retire.

## Success metrics

- Share of recipe page visitors who add to the basket.
- Baskets with two or more recipes.
- Basket to "Send to cart" clicks, and the upgrade prompt to checkout rate from that click.
- Sign-ups that start from the basket.

## Risks and open questions

- Drift. The lines now live on the recipe, so an edit shows them beside the ingredients and the tier warning catches large changes, but nothing ties a line to an ingredient until PRD 03.
- Builds without price lines. A build with no entry in the data shops like the recipe. That is right for builds that only change portions, but a new build that buys something different needs its own lines. The flank lines (`9a` in `docs/basket-data.json`) are now the bulgogi `flank` build, and the Costco lines (`11a`) the Pollo Asado `costco` build.
- Sides and sauces. A dish's lines already include the side or sauce it uses (the corn pico on the Taco Grillers, the mango salsa on Pollo Asado), scaled to the amount each build uses: the rice bowl carries 1.5 pico servings per serving. The pico and salsa also have entries of their own, marked `component`, so they can be shopped alone but never come up as a pairing or a suggestion. When lines come from recipes (PRD 03), they have to follow component links and their build scopes, or the trip will miss or double those items.
- Stale prices. Decide how often the snapshot gets refreshed. Its date shows under the list.
- Whether the summary also shows total protein for the trip. It fits the book, but keep the line short.

## Tasks

1. **Done.** Typed basket data with sections, and the slug coverage test.
2. **Done.** Pricing and bundle functions with tests.
3. **Done.** Basket provider (browser storage), "Add to basket" buttons, and the header count.
4. **Done.** `/basket` page: recipes, summary, grouped list, pantry toggle, check off, copy as text.
5. **Done.** Bundle suggestion on `/basket` and "Cook these together" on the home page.
6. **Open.** Account basket: migration, GraphQL, RLS, and the merge on sign-in.
7. **Done.** "Send to cart" button, as a placeholder until PRD 05 ships. It does not show the upgrade prompt yet, since PRD 01's checkout is not built.
8. **Done.** Basket data in the database: tables, `basketLines` on import and the connector (`list_basket_items`, `save_basket_items`), the admin Basket section, and `pnpm basket:sync` for the seed and backfill data.
