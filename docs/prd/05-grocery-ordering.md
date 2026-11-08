# PRD 05: Grocery ordering (paid)

## Problem

The basket (PRD 08) gives everyone a pooled shopping list, but the groceries still have to be bought. Paid members should be able to send the basket to a grocery service and check out there.

## Goal

From the basket, a paid member taps "Send to cart" and lands in a grocery service's cart or shopping list with the items ready to check out.

## Scope

**In**

- "Send to cart" on `/basket`. The shopping list, pantry toggle, check off, and copy as text are free and live in PRD 08.
- Cart handoff to one grocery service first. Which one is decided from `docs/grocery-services.md`.
- Mapping each basket price item to a search term or product the service can match.
- Affiliate disclosure on the page if the handoff earns revenue.

**Out**

- Direct checkout, payments, or delivery handled by us.
- Several services in v1. Leave room to add a second.
- Price comparison across services.

## Requirements

1. Paid only, through `hasPaidAccess` (PRD 01). Free members see the button with an upgrade prompt, so the feature is visible.
2. The handoff sends what the basket would buy: whole packs, pantry items only when the pantry toggle is on, checked-off items left out.
3. Lines that cannot be matched stay visible in the handoff result, never silently dropped.
4. Failure shows a clear message, and copy as text from the basket still works.
5. If the service requires an application, approval is a launch dependency for this PRD only. The free basket ships without it.
6. Check whether the service's terms allow gating its links behind a paywall, and what disclosure they require.

## Data

A mapping from basket item key to the service's search term or product id, stored with the basket data. A `cart_handoffs(id, user_id, service, item_count, created_at)` log for metrics.

## Success metrics

- Paid members who use the handoff.
- Handoff completion, if the service reports it.
- Affiliate revenue per paying member, if applicable.
- Upgrades that start from the "Send to cart" prompt.

## Risks and open questions

- Gating versus affiliate revenue. If the service pays per order, a paid gate means fewer orders. Decide with the numbers in `docs/grocery-services.md`.
- Developer access may be application-based. Apply early, because approval timing is outside our control.
- Product matching. Let the service's search handle matching in v1 and avoid building a catalog. PRD 03 makes the item names cleaner.

## Tasks

1. Pick the first service and apply for access.
2. Item to search term mapping for every basket item.
3. Handoff integration behind `hasPaidAccess`.
4. Upgrade prompt on the button for free members.
5. Disclosure copy and handoff logging.
