# PRD 05: Grocery list and ordering (paid)

## Problem

A plan is only useful if the groceries show up. Members need one clean list and a quick way to buy it.

## Goal

From a plan, a paid member gets a merged shopping list grouped by aisle and can send it to a grocery service to check out.

## Scope

**In**

- Merged list from a plan: same item combined, quantities summed and unit-converted, grouped by aisle.
- Check off items, mark pantry items as already owned, add custom items.
- Copy or share the list as text.
- Cart handoff to one retailer, starting with Instacart (a shopping list or recipe page link flow).

**Out**

- Direct checkout, payments, or delivery handled by us.
- Multiple retailers in v1.
- Price comparison. The existing `docs/cost-estimates.md` stays informational.

## Requirements

1. Paid only, same gate as the planner.
2. The list is computed from structured ingredients (PRD 03). Lines that cannot merge stay separate and visible, never silently dropped.
3. Optional and "to taste" items are shown unchecked and flagged.
4. Pantry staples (salt, oil, common spices) can be hidden by default, with a toggle.
5. Cart handoff sends the list to the retailer and returns a link. Failure shows a clear message and the copy option still works.
6. If the retailer program requires an application, that approval is a launch dependency. Plan the copy and share path so the feature is useful without it.
7. If the handoff earns affiliate revenue, disclose it on the page.

## Data

`shopping_lists(id, plan_id, created_at)` and `shopping_list_items(id, list_id, canonical_id, name, quantity, unit, aisle, checked, is_pantry, source_entries[])`. Items can be derived on the fly at first. Persist only the check state and custom items.

## Success metrics

- Plans that produce a list.
- Lists that use the cart handoff.
- Cart handoff completion, if the partner reports it.
- Affiliate revenue per paying member, if applicable.

## Risks and open questions

- Instacart developer access is application-based. Apply early, because approval timing is outside our control. Check current terms before designing around it.
- Product matching. Ingredient names such as "chicken thigh, boneless" must map to something orderable. Let the retailer search handle matching in v1 and avoid building a catalog.
- Package sizes versus recipe amounts (a recipe uses half a can). Decide if the list shows "needed" amounts only. Recommend yes.

## Tasks

1. Merge and unit conversion logic with tests.
2. Shopping list UI with check state, pantry toggle, and custom items.
3. Share and copy formats.
4. Retailer application and cart handoff integration.
5. Affiliate disclosure copy, if applicable.
