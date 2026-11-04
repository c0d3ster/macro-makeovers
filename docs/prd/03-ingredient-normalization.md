# PRD 03: Ingredient normalization

## Problem

Ingredients are stored mostly as free text (`raw`). The implementation plan names parsing quality as the biggest risk. A meal planner can merge grocery lists and a cart can order items only if quantities, units, and names are structured and consistent.

## Goal

Every published recipe has structured ingredients that merge cleanly across recipes and map to purchasable products.

## Scope

**In**

- Fill `quantity`, `unit`, `name`, and `category` (aisle) for every ingredient in every published recipe.
- A canonical ingredient list so "parmesan", "grated parmesan", and "Parmigiano" resolve to one item.
- Unit conversion rules for merging (cups to ounces for known items, grams to ounces).
- Import validation that requires structured fields for new recipes.
- A review step so the owner confirms parsed results before publish.

**Out**

- Product-level mapping to a retailer catalog. That belongs to PRD 05.
- Brand selection.

## Requirements

1. Parsing runs through the existing import path. An LLM pass proposes structure, and the owner confirms in the editor.
2. Each parsed ingredient keeps `raw` as the display source of truth.
3. Canonical ingredients table with name, aliases, default aisle, and default unit.
4. Optional and "to taste" items are flagged so they do not inflate lists.
5. A script reports unparsed and low-confidence lines across all recipes.
6. Existing 14 recipes are backfilled and checked by hand against the book.
7. Servings scaling uses the structured quantity, with sensible rounding (no "0.37 eggs").

## Data

`canonical_ingredients(id, name, aliases[], aisle, default_unit)` and `ingredients.canonical_id`. Keep the migration backwards compatible so recipes with only `raw` still render.

## Success metrics

- Percent of ingredient lines with quantity, unit, and canonical id (target 100 percent for published recipes).
- Merge accuracy on a sample of 5 two-recipe plans checked by hand.

## Risks and open questions

- Quantities like "1 can", "a handful", and ranges. Decide a unit vocabulary for these.
- Who owns the canonical list long term. Recommend the owner approves new entries in the editor.
- Bulk conversion is one-off work, so budget a review pass of roughly an hour per few recipes.

## Tasks

1. Canonical ingredient migration and seed.
2. Parser step in the import function plus tests.
3. Editor UI for reviewing parsed fields.
4. Backfill and review the 14 existing recipes.
5. Coverage report script.
