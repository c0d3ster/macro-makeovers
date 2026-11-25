# PRD 02: Shopping

**Plan:** The basket is Free. Send to cart is Fit.

**Status:** Phases 1 and 2 shipped. Phase 3 not started. Phase 4 built, shipping dark. Phase 5 later.

| Phase | What | Status |
| --- | --- | --- |
| 1 | Browser basket | Shipped (#57, #59) |
| 2 | Basket data in the database | Shipped |
| 3 | Account basket | Not started |
| 4 | Send to cart | Built, shipping dark (#74). Waiting on grocer approval and Walmart item ids |
| 5 | Basket lines from recipes | Later. Needs PRD 03 phase 2 |

## Problem

Cooking two or three recipes in the same stretch is how this book works, but every recipe page prices and lists its ingredients alone. People have to merge the lists by hand and cannot see that buying recipes together costs less than buying each one separately.

The basket (phase 1) gives everyone a pooled shopping list, but the groceries still have to be bought. Fit members should be able to send the basket to a grocery service and check out there.

## Goal

Anyone can add recipes to a basket, see one pooled shopping list, and see what the trip costs, what each recipe works out to per serving, and how much bundling saves. Fit members can send the basket to a grocery service (phase 4).

From the basket, a member taps "Send to cart", picks a grocer, and lands in that grocer's cart or shopping list with the items ready to check out.

## Naming

**Basket**, not cart. The basket is where recipes get bundled and priced. The cart belongs to the grocery service, and "Send to cart" is the handoff (phase 4). Keep the two words separate in UI and code.

## Cost model

- **Trip cost:** the cheapest mix of pack sizes that covers what every recipe in the basket needs, bought once across all of them. Items sold per lb are priced by exact weight. This is what the receipt shows, and the bundling saving only shows up here.
- **Prorated cost:** a recipe's share of the smallest pack size that covers what it uses (a bigger size wins when it costs at most 10 percent more). This is how the cost estimates and the `$` tiers on recipe pages are calculated. It is derived from the lines and prices, never stored, and an import warns when a listed build lands in a different tier than it says.
- **Per serving in the basket:** each recipe's part of the pooled trip at the register, divided by its servings. A recipe starts at its own trip's price and takes its part of what pooling saves on each item it shares. So it reads higher than the recipe page, and a note under the list says why.
- **Saved:** every recipe bought as written (on its own trip, at its own servings, scaled to the servings in the basket, and for the same build) minus the pooled trip. One number covers both pooling and cooking more servings than the recipe makes.
- **Leftovers:** what the trip buys but the recipes do not use. When short-shelf-life items left over come to at least a dollar, a note names them: "About $3 of cilantro and spinach may spoil before you use them."
- Label every cost an estimate, with the date of the price snapshot.

## Phases 1 to 3: The basket

**Status:** Phases 1 and 2 shipped, phase 3 not started. Requirements and tasks are marked **Done**, **Changed** (shipped differently, and the text now matches the code), or **Open**.

Phase 1 is tasks 1 to 5 and 7. Phase 2 is task 8. Phase 3 is task 6 and requirement 4.

### Scope

**In**

- "Add to basket" on recipe cards (a round button on the photo) and on the recipe page, under the ingredients. A basket icon with a recipe count in the site header.
- `/basket` page:
  - Recipes in the trip, each with a servings stepper (1 to 24, the same range as the recipe page), its cost per serving in this trip, and remove. A Clear action.
  - A summary: the trip cost before tax, and what the trip saves against buying every recipe as written. When it saves anything, a small table sets "This trip" against "Normally" for the register total and what is left over.
  - The pooled shopping list, grouped by store section.
  - One bundle suggestion: the recipe that would save the most if added to the current basket.
  - "Send to cart", which hands off to phase 4 for Fit members.
- Pantry staples hidden by default, with a toggle.
- Check off items while shopping.
- Copy the list as plain text.
- Builds of the same recipe (for example the turkey or beef Taco Grillers) are mutually exclusive. Adding one replaces the other. See the builds spec.
- Saved to the browser when signed out, saved to the account when signed in. Free.
- A "Cook these together" section on the home page, from the same bundle ranking.

**Out**

- Custom items added by hand. Later.
- Store-specific or live prices. Prices are a dated snapshot.
- Several saved baskets or trip history. One active basket for now.
- The meal planner (PRD 03 phase 3). It fills the basket later, it is not part of it.

### Requirements

1. **Done.** The pricing math is pure, tested functions in `src/libs/basket/basketMath.ts`: pool lines, pack sizes, prorated cost, savings against recipes as written, per-recipe shares, leftovers, and bundle ranking. The rules match `docs/shopping-list-data.md`.
2. **Changed.** Price data lives in the database: `basket_items` and `basket_item_sizes` are the price book, each with a `section` (produce, meat, dairy, bakery, frozen, pantry, spices) for grouping, `pantry` and `perishable` flags, optional larger sizes, and where and when its price was found (`price_source`, `is_estimate`, `priced_on`). Each recipe carries its `basketLines` (`recipe_basket_lines`) and per-build changes (`recipe_build_basket_lines`, the builds spec) through import. The basket math takes the catalog as an argument, loaded on the server by `BasketRepository`.
3. **Changed.** Import rejects a line whose item key is not in the price book, a build change on a recipe with no lines, and a build left with nothing to buy. Build keys are checked by the import schema. A test checks every seed line names a seed item and every seed recipe's tier matches its prices. Recipes without basket lines do not show "Add to basket".
4. **Open.** Signed-out baskets live in browser storage (done). On sign-in, the browser basket merges into the account basket (recipes combined, the higher servings kept), then browser storage clears (open).
5. **Changed.** Each list line shows the item name, what to buy under it ("1 × 8 oz block", "1.5 lb"), and the cost on the right. A short-shelf-life item says "short shelf life", and an item two or more recipes use says "shared by" and names them. Checked items strike through.
6. **Changed.** One line under the list says costs are estimates from the lowest prices found at national chains and Martin's on the snapshot date, and that recipe pages count only what a recipe uses. Other store names stay out of the UI.
7. Mobile first. No wide tables. The list is stacked rows on small screens.
8. Macro display follows the site rules (C/F/P order, protein given full weight) anywhere the basket shows nutrition. The basket shows no nutrition today.
9. **Changed.** "Cook these together" ranks every pair of published recipes with basket data and shows the best pairs that do not share a recipe. The `/basket` suggestion tries adding each recipe not already in the basket. Trios are not ranked.

### Data

- Prices and recipe lines: in the database (requirement 2). The seed copy is `content/basket/items.json` and the seed recipes' `basketLines`, written with `pnpm basket:sync`. The note under the list shows the range of `priced_on` dates.
- Browser storage (`macro-makeovers-basket-v1`): entries of `{ slug, build?, servings }`, the pantry toggle, and checked item keys. Repeats and bad servings are dropped on read. Recipes that lost their basket data drop out on `/basket`, which has the catalog, so a catalog that fails to load never empties a saved basket.
- Account basket, not built: `baskets(id, user_id, include_pantry, updated_at)`, one per user for now. `basket_entries(basket_id, recipe_id, build_key, servings)` and `basket_checks(basket_id, item_key)`.
- RLS: a member reads and writes only their own basket.
- Once PRD 03 phase 2 lands, recipe lines come from structured ingredients mapped to price items, and the hand-written `basketLines` retire.

### Tasks

1. **Done.** Typed basket data with sections, and the slug coverage test.
2. **Done.** Pricing and bundle functions with tests.
3. **Done.** Basket provider (browser storage), "Add to basket" buttons, and the header count.
4. **Done.** `/basket` page: recipes, summary, grouped list, pantry toggle, check off, copy as text.
5. **Done.** Bundle suggestion on `/basket` and "Cook these together" on the home page.
6. **Open.** Account basket: migration, GraphQL, RLS, and the merge on sign-in.
7. **Done.** "Send to cart" button, as a placeholder until phase 4 ships. It does not show the upgrade prompt yet, since PRD 01's checkout is not built.
8. **Done.** Basket data in the database: tables, `basketLines` on import and the connector (`list_basket_items`, `save_basket_items`), the admin Basket section, and `pnpm basket:sync` for the seed and backfill data.

## Phase 4: Send to cart

**Status:** Built, shipping dark until each grocer's keys are set (#74). Applications to Instacart, Kroger, and Walmart went in on 2026-11-15.

### Approach: multi-grocer (decided)

The member chooses where to shop instead of us picking one service for everyone. Direct retailer carts (for example Kroger and Walmart) keep checkout totals close to in-store prices, so the basket's cost estimates stay honest. An aggregator (for example Instacart) adds reach and pays the most per order, but its markups and fees push the checkout total above our estimates. Offering both keeps the revenue without forcing anyone onto one service. Which grocers launch first, and which is the default, comes from `docs/grocery-services.md`.

### Scope

**In**

- "Send to cart" on `/basket`, which opens a grocer picker. The shopping list, pantry toggle, check off, and copy as text are free and live in phase 1.
- One adapter per grocer behind a shared interface: input is the basket's pooled items, output is a handoff URL or a cart write plus a list of unmatched lines.
- Start with two grocers, one direct retailer cart and one aggregator, and add more as adapters.
- Remember the member's last grocer and store, and preselect it next time.
- Mapping each basket price item to each grocer's search term or product.
- Affiliate disclosure on the picker for every grocer that earns revenue.
- A short note on the picker for grocers that may charge more than in-store prices.

**Out**

- Direct checkout, payments, or delivery handled by us.
- Live price comparison across grocers.

### Requirements

1. Fit and Studio, through `hasPaidAccess` (PRD 01). Free members see the button with an upgrade prompt, so the feature is visible.
2. The handoff sends what the basket would buy: whole packs, pantry items only when the pantry toggle is on, checked-off items left out.
3. Lines that cannot be matched stay visible in the handoff result, never silently dropped.
4. Failure shows a clear message, and copy as text from the basket still works.
5. If a grocer requires an application, approval is a launch dependency for that grocer only. The free basket and the other grocers ship without it.
6. For each grocer, check whether its terms allow gating its links behind a paywall, allow offering a competitor next to it, and what disclosure they require.
7. Adding a grocer means adding an adapter and its item mapping, with no change to the basket or the picker.

### Data

- A mapping from basket item key to each grocer's search term, product id, or UPC, stored with the basket data.
- `member_grocer(user_id, grocer, store_id)` for the remembered choice.
- A `cart_handoffs(id, user_id, grocer, item_count, unmatched_count, created_at)` log for metrics.

### Tasks

1. **Done.** Pick the launch grocers from the research and apply for access. Applications went in on 2026-11-15. Waiting on approval.
2. **Done.** Adapter interface and the grocer picker.
3. **Done.** Adapters with item mappings: Kroger, Walmart, and Instacart.
4. **Done.** Gating, the upgrade prompt, and the remembered grocer.
5. **Done.** Disclosure copy, markup notes, and handoff logging.
6. **Open.** Turn each grocer on (below).

### Build notes (2026-11-15)

- **Code:** adapters, item mappings and grocer copy in `src/libs/grocery`. `GroceryService` and
  `GroceryResolver` serve `groceryHandoffOptions`, `groceryStores(zip)` and `sendBasketToGrocer`.
  The picker is `SendToCart` on `/basket`. Kroger sign-in is `/api/grocery/kroger/connect` and
  `/callback`.
- **Data:** `member_grocer` (remembered grocer, store and zip) and `cart_handoffs` (grocer,
  outcome, error code, item and unmatched counts; no item names) in migration
  `20261115010000_create_grocery_handoff.sql`. Kroger member tokens are not stored in the
  database: they sit in a sealed httpOnly cookie on the member's device.
- **Gating:** every paid call goes through `checkPaidAccess` in `src/libs/paidAccess.ts`. Until
  PRD 01's `hasPaidAccess` merges, it lets only the owner through. Free members see the button and
  an upgrade prompt.
- **Default grocer:** last choice, else Kroger pickup if a Kroger-family store is within 10 miles
  of the zip, else Walmart pickup. Instacart is never preselected.

**Before turning each grocer on**

- Kroger: confirm the API paths and fields in `krogerApi.ts` against the developer portal (its
  docs render client-side, so they were written from the public API as commonly used). Register
  the redirect URI. Check how random-weight items take a quantity: the adapter rounds pounds up
  to whole units.
- Instacart: get the brand kit for the 22px logo and colors on the "Shop on Instacart" button,
  and record the flow for the production review.
- Walmart: curate `WALMART_ITEM_IDS` in `itemMappings.ts`; Walmart is not offered until at least
  one id is mapped. Test that the link with `storeId` fills a pickup cart.
- All: replace the body of `checkPaidAccess` with PRD 01's `hasPaidAccess`, and link the upgrade
  prompt to the pricing page once it exists.

## Phase 5: Basket lines from recipes

**Status:** Later. Starts once PRD 03 phase 2 has structured every published recipe.

Map canonical ingredients to basket price items so basket lines are derived from recipes and the hand-written `basketLines` retire. Derived lines have to follow each line's build scope (some builds already carry their own line changes, see [`docs/builds.md`](../builds.md)) and include the sides and sauces a dish links as components, which the hand-written lines fold in today. Add a drift check that compares derived lines with the hand-written ones before the switch.

## Success metrics

**Basket**

- Share of recipe page visitors who add to the basket.
- Baskets with two or more recipes.
- Basket to "Send to cart" clicks, and the upgrade prompt to checkout rate from that click.
- Sign-ups that start from the basket.

**Send to cart**

- Paid members who use the handoff.
- Handoffs by grocer, and the share of unmatched lines per grocer.
- Handoff completion, if the grocer reports it.
- Affiliate revenue per paying member, if applicable.
- Upgrades that start from the "Send to cart" prompt.

## Risks and open questions

**Basket**

- Drift. The lines now live on the recipe, so an edit shows them beside the ingredients and the tier warning catches large changes, but nothing ties a line to an ingredient until PRD 03 phase 2.
- Builds without price lines. A build with no entry in the data shops like the recipe. That is right for builds that only change portions, but a new build that buys something different needs its own lines. The flank lines (`9a` in `docs/basket-data.json`) are now the bulgogi `flank` build, and the Costco lines (`11a`) the Pollo Asado `costco` build.
- Sides and sauces. A dish's lines already include the side or sauce it uses (the corn pico on the Taco Grillers, the mango salsa on Pollo Asado), scaled to the amount each build uses: the rice bowl carries 1.5 pico servings per serving. The pico and salsa also have entries of their own, marked `component`, so they can be shopped alone but never come up as a pairing or a suggestion. When lines come from recipes (PRD 03 phase 2), they have to follow component links and their build scopes, or the trip will miss or double those items.
- Stale prices. Decide how often the snapshot gets refreshed. Its date shows under the list.
- Whether the summary also shows total protein for the trip. It fits the book, but keep the line short.

**Send to cart**

- Gating versus affiliate revenue. If a grocer pays per order, a paid gate means fewer orders. Decide with the numbers in `docs/grocery-services.md`. This may differ per grocer.
- Which grocer is the default. Revenue favors the aggregator, while honest totals favor a direct cart.
- Developer access may be application-based. Apply early, because approval timing is outside our control.
- Product matching. Aggregators match from a search term. Direct carts need a product or UPC per item and store, which is more work per grocer. PRD 03 phase 2 makes the item names cleaner.
- Maintenance grows with each grocer. Keep the launch set small.
