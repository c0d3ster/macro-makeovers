# PRD 05: Grocery ordering (paid)

## Problem

The basket (PRD 08) gives everyone a pooled shopping list, but the groceries still have to be bought. Paid members should be able to send the basket to a grocery service and check out there.

## Goal

From the basket, a member taps "Send to cart", picks a grocer, and lands in that grocer's cart or shopping list with the items ready to check out.

## Approach: multi-grocer (decided)

The member chooses where to shop instead of us picking one service for everyone. Direct retailer carts (for example Kroger and Walmart) keep checkout totals close to in-store prices, so the basket's cost estimates stay honest. An aggregator (for example Instacart) adds reach and pays the most per order, but its markups and fees push the checkout total above our estimates. Offering both keeps the revenue without forcing anyone onto one service. Which grocers launch first, and which is the default, comes from `docs/grocery-services.md`.

## Scope

**In**

- "Send to cart" on `/basket`, which opens a grocer picker. The shopping list, pantry toggle, check off, and copy as text are free and live in PRD 08.
- One adapter per grocer behind a shared interface: input is the basket's pooled items, output is a handoff URL or a cart write plus a list of unmatched lines.
- Start with two grocers, one direct retailer cart and one aggregator, and add more as adapters.
- Remember the member's last grocer and store, and preselect it next time.
- Mapping each basket price item to each grocer's search term or product.
- Affiliate disclosure on the picker for every grocer that earns revenue.
- A short note on the picker for grocers that may charge more than in-store prices.

**Out**

- Direct checkout, payments, or delivery handled by us.
- Store price comparison from grocer APIs (below).

**Planned, not built: store price comparison.** The basket's estimated total at each chain, side by
side, so members shop at the cheapest. Members save more than the $5 plan costs if one chain is
about 2 to 5% cheaper on a typical basket. The grocer APIs can't feed it on their current public
terms (`docs/grocery-services.md`, "Store price comparison"):

- Kroger's Acceptable Use bans comparing prices among retailers, and its terms ban keeping prices
  past the cache header. Needs a Kroger partnership.
- Walmart's API is for advertising Walmart.com products. Comparison needs written permission, and
  per-store prices are unconfirmed.
- Instacart returns no prices and bars comparing baskets across retailers. Instacart stays "see
  your total on Instacart", with nearby retailers named but not priced.

Decided: no permission requests for now, revisit when we're bigger. The picker offers checkout at
each grocer independent of price. The comparison uses member receipt prices from PRD 09, labeled
with their date range and coverage, never prices from a grocer API. Keep it behind
`hasPaidAccess`, compare equivalent items (same size and type, any brand), and say the totals are
shelf price estimates before coupons and fees.

## Requirements

1. Paid only, through `hasPaidAccess` (PRD 01). Free members see the button with an upgrade prompt, so the feature is visible.
2. The handoff sends what the basket would buy: whole packs, pantry items only when the pantry toggle is on, checked-off items left out.
3. Lines that cannot be matched stay visible in the handoff result, never silently dropped.
4. Failure shows a clear message, and copy as text from the basket still works.
5. If a grocer requires an application, approval is a launch dependency for that grocer only. The free basket and the other grocers ship without it.
6. For each grocer, check whether its terms allow gating its links behind a paywall, allow offering a competitor next to it, and what disclosure they require.
7. Adding a grocer means adding an adapter and its item mapping, with no change to the basket or the picker.

## Data

- A mapping from basket item key to each grocer's search term, product id, or UPC, stored with the basket data.
- `member_grocer(user_id, grocer, store_id)` for the remembered choice.
- A `cart_handoffs(id, user_id, grocer, item_count, unmatched_count, created_at)` log for metrics.

## Success metrics

- Paid members who use the handoff.
- Handoffs by grocer, and the share of unmatched lines per grocer.
- Handoff completion, if the grocer reports it.
- Affiliate revenue per paying member, if applicable.
- Upgrades that start from the "Send to cart" prompt.

## Risks and open questions

- Gating versus affiliate revenue. If a grocer pays per order, a paid gate means fewer orders. Decide with the numbers in `docs/grocery-services.md`. This may differ per grocer.
- Which grocer is the default. Revenue favors the aggregator, while honest totals favor a direct cart.
- Developer access may be application-based. Apply early, because approval timing is outside our control.
- Product matching. Aggregators match from a search term. Direct carts need a product or UPC per item and store, which is more work per grocer. PRD 03 makes the item names cleaner.
- Maintenance grows with each grocer. Keep the launch set small.
- Kroger's primary logos are only allowed when the integration isn't monetized. "Send to cart" is
  paid, so use Kroger's integration logo.

## Tasks

1. Pick the launch grocers from the research and apply for access.
2. Adapter interface and the grocer picker.
3. First two adapters with item mappings.
4. Gating, the upgrade prompt, and the remembered grocer.
5. Disclosure copy, markup notes, and handoff logging.
