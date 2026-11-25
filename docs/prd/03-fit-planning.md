# PRD 03: Fit planning

**Plan:** Fit. Free keeps today's goal presets.

**Status:** Not started. Goal filters with fixed ratios and fit badges already ship free.

| Phase | What | Status |
| --- | --- | --- |
| 1 | Personal targets | Not started |
| 2 | Ingredient normalization | Not started. Can start now, in parallel with phase 1 |
| 3 | Meal planner | Not started. Needs phases 1 and 2, and PRD 02 phase 1 |
| 4 | Planner auto-suggest | Later |

The order is the dependency chain. Targets make a plan meaningful, structured ingredients make a plan's shopping list correct, and the planner uses both.

## Problem

Every visitor sees the same recipes with the same filters. People want to know which recipes fit their goal and their body, without doing the math.

Members who like the recipes still have to work out a week of meals that hits their macros by hand.

## Goal

Fit fits the book to the member's body and turns it into a week of meals. A member sets their goal and stats once, sees which recipes fit them, plans a week from those recipes, and sends it to the basket.

## Phase 1: Personal targets

**Status:** Not started. There is no member profile yet. The grid already has goal and macro target filters with fit badges (`src/libs/recipes/recipeGoals.ts` and `recipeFit.ts`), driven by fixed per-goal ratios, and they judge each recipe by its best-fitting build (see [`docs/builds.md`](../builds.md)).

### Goal

A Fit member sets a goal and a goal weight once, and can optionally add their calorie burn for a more accurate result. The site then adjusts its filters and recipe highlights to match. This is Fit's headline feature and feeds the planner (phase 3).

The split with Free: everyone keeps today's goal presets (pick recomp or bulk, see recipes ranked by the book's ratios). Fit turns "fits a recomp goal" into "fits you," with targets from the member's own weight and burn.

This is not a calorie tracker. The site only covers recipes, not every meal in someone's day, so it does not track daily intake. Calorie burn is a one-time setting that sharpens the ratios, and everything has a default if the member skips it.

### Scope

**In**

- Profile with two required inputs, goal and goal weight, and two optional ones, resting calories and average activity burn. Goals start as balanced, fat loss, recomp, and bulk, and are expected to grow (for example pure bulk and clean bulk as separate goals).
- Each goal is defined by grams per pound of goal weight for protein and for fat, plus a calorie adjustment for the goal (a deficit, maintenance, or surplus).
- Target calories are total daily burn plus the goal's adjustment. Total burn is resting calories plus average activity burn. Protein and fat grams come from weight and the goal. Carbs are the remainder of the target calories after fat and protein are converted to calories (9 and 4 per gram). That gives the member's target C/F/P percentages, and the site keeps displaying ratios, now personalized.
- Resting calories: two people at the same weight can have very different resting burn, so the member can enter their own. If they do not, a default is estimated from weight.
- Average activity burn: the member picks an activity level preset, which fills the number as a percent of resting calories, or types an exact daily number. Presets: light 10 percent, moderate 15 percent, active 20 percent, with moderate as the default. Most people sit at 15 to 20 percent at most.
- The daily grams at the member's weight are shared across a few meals a day to give a per-meal range.
- Browse filters start preset to the member's range, with a clear "fits my goal" toggle to turn it off.
- Recipe pages show whether a recipe fits, per serving, with protein given full weight next to C/F/P. Where a recipe misses, suggest a servings amount that gets closer.
- Units setting (lb or kg).

**Out**

- Tracking or logging daily intake or daily totals.
- Carb cycling and training-day plans. Later.
- Wearable or tracker sync. Later, through the ForgeFit seam below.
- Medical advice. Show the nutrition disclaimer next to anything derived from weight or calories.

### Requirements

1. The profile is optional and Fit only, through `hasPaidAccess` (PRD 01). Without it, or on Free, the site works exactly as today with the goal presets. Free members see the profile form with an upgrade prompt, so the feature is visible.
2. Goals are data, not code paths: a table or constant mapping each goal to protein grams per pound, fat grams per pound, and a calorie adjustment, so adding or retuning a goal needs no logic change. Illustrative protein and fat values to confirm: pure bulk 1.2 and 0.5, clean bulk 1.0 and 0.4, recomp about 0.3 fat. For Fit members this model replaces today's hard-coded book ratios. Free keeps the presets.
3. One pure function turns goal, goal weight, and the optional burn inputs into target calories, grams, C/F/P percents, and a per-meal range for protein and fat. The planner reuses it. The number of meals it divides across is a constant (proposed: 3), not a member input.
4. Defaults keep the function total when inputs are missing:
   - No resting calories: estimate from goal weight with one global constant (11 calories per pound, see open questions).
   - Resting set but no activity chosen: use the moderate preset.
   - Activity without resting calories: apply the preset percent to the estimated resting value.
   - The preset percents, the weight constant, and the goal adjustments live in one place so they are easy to tune.
5. The UI shows total burn and target calories, labels each number "default" or "yours", and lets the member switch back to the default. Choosing a preset fills the burn right away and shows it in calories. Typing a number by hand switches the level to "custom".
6. Filter presets only set protein and fat bounds. They never hide recipes with no way back: the toggle is always visible, and the member can change the bounds by hand.
7. Protein stays a first-class number, shown alongside C/F/P and not treated as a leftover.
8. A recipe "fit" is computed from per-serving nutrition, for the build that fits best, the same way the grid's goal filter already does. builds spec requirement 13 replaces the old rule here, which used the default only. Goal matching covers the dish courses (breakfast, appetizer, main). Sides and sauces are not judged on their own, since a dish's build macros already include the components it uses.
9. The profile form validates ranges and rejects absurd values.
10. Members can delete their profile data.
11. Goal weight, resting calories, and activity burn each record their source: `manual`, `default`, or `partner`. A partner write never overwrites a `manual` value, and the member sees where each value came from. This keeps the door open for ForgeFit (see PRD 01 and the README) to send weight, resting calories, and a real average activity burn, through GraphQL with a scoped credential and not through the form. No partner work is built now.

### Data

`member_profiles(user_id, goal, goal_weight_kg, resting_calories, activity_level, activity_calories, units)` plus a source column for each overridable value.

- `resting_calories` is nullable. Null means use the default.
- `activity_level` is light, moderate, active, or custom, and is nullable (default applied in code).
- `activity_calories` is stored only for custom or partner values. Preset values are computed from resting calories, so they follow it when it changes.
- Targets and ranges are computed, not stored.

A separate table keeps the auth-linked `users` row small.

### Success metrics

- Share of new sign-ups that complete the profile.
- Share of completers who add their own resting calories or activity level.
- Profile completers who return within 7 days versus those who do not.
- Profile completers who start checkout versus those who do not.

### Risks and open questions

- Health claims. Keep language to "recipe fit based on your goal and burn", with a disclaimer, and avoid anything that sounds like a prescription.
- Confirm the grams-per-pound values per goal for protein and fat.
- Confirm the calorie adjustment for each goal (deficit for fat loss, maintenance for balanced and recomp, surplus for bulks), as a percent of total burn.
- Default resting estimate: 11 calories per pound of goal weight (about 24 per kg), from a general resting burn chart by weight. The chart works out to 10.8 to 10.9 per pound from 100 to 200 lbs, which is 1 calorie per kg per hour. At 200 lbs that is about 2,200 a day, so the 10, 15, and 20 percent presets add roughly 220, 330, and 440. It ignores muscle mass, age, and sex, so label it an estimate. It will be off for individuals, which is why the member can enter their own.
- The estimate uses goal weight, since that is the weight we ask for. For someone cutting, goal weight is below current weight, so the default runs a little low. Decide whether to also ask for current weight, or accept the error.
- Confirm the preset names and percents (light 10, moderate 15, active 20).
- Fit is judged on protein and fat grams per meal plus how close the recipe's own C/F/P is to the member's target ratio. Decide how much weight carbs get in "fits my goal", since carbs are the loosest of the three.
- How a per-meal range is derived from the daily figure (even split across 3 meals is the proposal).
- Whether fat should be a ceiling only (fat loss), a range, or left unfiltered for some goals.
- Whether a calorie filter is wanted at all. Default is no.

### Tasks

1. Migration, model, GraphQL type and mutation for the profile.
2. Target function (burn, goal adjustment, grams, C/F/P percents, per-meal range) with defaults and tests.
3. Profile form on the account page, with activity presets and the default labels.
4. Browse filter presets and the "fits my goal" toggle.
5. "Fits your goal" block on recipe pages.

## Phase 2: Ingredient normalization

**Status:** Not started. There is no canonical ingredients table. `ingredients` already has nullable `quantity`, `unit`, `name`, and `category` columns next to `raw_text`, plus the build scope columns from the builds spec.

### Problem

Ingredients are stored mostly as free text (`raw`). The implementation plan names parsing quality as the biggest risk. The basket (PRD 02 phase 1) runs on hand-written ingredient lines for now, and those do not follow recipe edits. The basket, the meal planner, and ordering can all stay correct only if quantities, units, and names are structured and consistent.

### Goal

Every published recipe has structured ingredients that merge cleanly across recipes and map to purchasable products.

### Scope

**In**

- Fill `quantity`, `unit`, `name`, and `category` (aisle) for every ingredient in every published recipe.
- A canonical ingredient list so "parmesan", "grated parmesan", and "Parmigiano" resolve to one item.
- Unit conversion rules for merging (cups to ounces for known items, grams to ounces).
- Import validation that requires structured fields for new recipes.
- A review step so the owner confirms parsed results before publish.

**Out**

- Product-level mapping to a grocery service. That belongs to PRD 02 phase 4.

- Brand selection.

Follow-on: deriving basket lines from structured ingredients is PRD 02 phase 5.

### Requirements

1. Parsing runs through the existing import path. An LLM pass proposes structure, and the owner confirms in the editor.
2. Each parsed ingredient keeps `raw` as the display source of truth.
3. Canonical ingredients table with name, aliases, default aisle, and default unit.
4. Optional and "to taste" items are flagged so they do not inflate lists.
5. A script reports unparsed and low-confidence lines across all recipes.
6. Existing published recipes are backfilled and checked by hand against the book. The seed set in `content/recipes` is 16 recipes: 14 dishes and 2 sauces.
7. Servings scaling uses the structured quantity, with sensible rounding (no "0.37 eggs").

### Data

`canonical_ingredients(id, name, aliases[], aisle, default_unit)` and `ingredients.canonical_id`. Keep the migration backwards compatible so recipes with only `raw` still render.

### Success metrics

- Percent of ingredient lines with quantity, unit, and canonical id (target 100 percent for published recipes).
- Merge accuracy on a sample of 5 two-recipe plans checked by hand.

### Risks and open questions

- Quantities like "1 can", "a handful", and ranges. Decide a unit vocabulary for these.
- Who owns the canonical list long term. Recommend the owner approves new entries in the editor.
- Bulk conversion is one-off work, so budget a review pass of roughly an hour per few recipes.

### Tasks

1. Canonical ingredient migration and seed.
2. Parser step in the import function plus tests.
3. Editor UI for reviewing parsed fields.
4. Backfill and review the existing published recipes.
5. Coverage report script.

## Phase 3: Meal planner

**Status:** Not started. Builds (see [`docs/builds.md`](../builds.md)) and courses with components (#64) shipped since this was written, so the planner picks a build per entry and the basket hand-off sends servings, not batches.

### Goal

A Fit member builds a weekly plan from the recipes, sees how each meal fits their goal, and sends the week to the basket (PRD 02 phase 1) for one shopping list.

### Scope

**In**

- Plan view for a week (7 days, meals per day from the profile).
- Add a recipe to a day and meal slot, with a servings amount.
- Per-meal fit for each planned recipe, using the per-meal protein and fat range from phase 1. Macros show in C/F/P order, with protein given full weight. Day and week sums are shown for reference only, because the plan covers recipes, not everything the member eats, so there is no daily target to hit.
- Swap a recipe, duplicate a day, repeat last week.
- Leftovers: a recipe cooked once can fill several slots (batch cooking is how this book works).
- Send the plan to the basket (PRD 02 phase 1). Each planned recipe becomes a basket entry with its build and servings (the basket counts servings, not batches), so the pooled list, costs, and "Send to cart" come from the basket.
- Leftover-aware suggestions: using the basket's leftover math, suggest recipes that use up what a plan leaves behind (half a tub of cottage cheese, the rest of the cilantro), with short-shelf-life items first.
- Saved plans, with one active plan per week.

**Out**

- Carb cycling and training-day plans. Later.
- Studio additions: library recipes in plans and generated fill-ins for empty slots (PRD 04).
- Custom foods and tracking intake against the plan.
- Sharing plans between members.

### Requirements

1. Fit and Studio, through `hasPaidAccess` (PRD 01). Free members see a preview with sample data and an upgrade prompt. The preview does not need real planner logic.
2. Totals use per-serving nutrition from the chosen build (see [`docs/builds.md`](../builds.md)), scaled by servings. The default build is preselected, and the member can pick another where a recipe has one. Note that the basket keeps one build per recipe, so a plan with two builds of one recipe cannot send both as it works today.
3. A plan works without a profile, with no fit indicators, and nudges the member to set a goal and goal weight.
4. Servings math is shared with the recipe page scaler, and pricing and leftover math are shared with the basket (`src/libs/basket`).
5. Mobile first. Planning happens on a phone in a store aisle or a couch.
6. Plan data is private to the member (RLS on user id).

### Data

`meal_plans(id, user_id, week_start, name)` and `meal_plan_entries(id, plan_id, day, slot, recipe_id, build_key, servings)`. Builds are keyed per recipe (`recipe_builds.key`), and makeover rows no longer live in `recipe_nutrition`, so there is no nutrition variant id to point at.

### Success metrics

- Fit members who create a plan in the first week.
- Plans per active Fit member per month.
- Plans sent to the basket.
- Leftover suggestions added to a plan.
- Fit retention for planners versus non-planners.

### Risks and open questions

- Few recipes. The seed set is 14 dishes and 2 sauces, so a week of varied meals is thin and the planner depends on recipe growth. The launch target is 25 recipes. Make sure repeats and leftovers feel intentional.
- Snacks, breakfast, and sides. The book is mostly dinners, so the catalog may not cover every slot. Decide if slots are optional. Recipes now carry a course (breakfast, appetizer, main, side, sauce, and a build can override it), so slots can filter by course. A dish's build macros already include the sides and sauces it links as components, so adding one of those to the same meal would count it twice.

### Tasks

1. Migration, models, GraphQL types, and plan service.
2. Per-meal fit logic and reference sums with tests.
3. Plan UI: week grid, add and swap, servings.
4. Paid gating and the free preview.
5. Send to basket.
6. Leftover-aware suggestions.

## Phase 4: Planner auto-suggest

**Status:** Later. Ship manual planning (phase 3) first.

Fill empty slots with recipes that fit the remaining macros. Start simple (filter and rank), not an optimizer. Studio extends this with library recipes and generated fill-ins (PRD 04 phase 3).
