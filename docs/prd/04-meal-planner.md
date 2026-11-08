# PRD 04: Meal planner (paid)

## Problem

Members who like the recipes still have to work out a week of meals that hits their macros by hand.

## Goal

A paid member builds a weekly plan from the recipes, sees how each meal fits their goal, and sends the week to the basket (PRD 08) for one shopping list.

## Scope

**In**

- Plan view for a week (7 days, meals per day from the profile).
- Add a recipe to a day and meal slot, with a servings amount.
- Per-meal fit for each planned recipe, using the per-meal protein and fat range from PRD 02. Macros show in C/F/P order, with protein given full weight. Day and week sums are shown for reference only, because the plan covers recipes, not everything the member eats, so there is no daily target to hit.
- Auto-suggest: fill empty slots with recipes that fit the remaining macros. Start simple (filter and rank), not an optimizer.
- Swap a recipe, duplicate a day, repeat last week.
- Leftovers: a recipe cooked once can fill several slots (batch cooking is how this book works).
- Send the plan to the basket (PRD 08). Each planned recipe becomes a basket entry with its batch count, so the pooled list, costs, and "Send to cart" come from the basket.
- Leftover-aware suggestions: using the basket's leftover math, suggest recipes that use up what a plan leaves behind (half a tub of cottage cheese, the rest of the cilantro), with short-shelf-life items first.
- Saved plans, with one active plan per week.

**Out**

- Carb cycling, training-day plans, a second planning tier. Later.
- Custom foods and tracking intake against the plan.
- Sharing plans between members.

## Requirements

1. Paid only. Free members see a preview with sample data and an upgrade prompt. The preview does not need real planner logic.
2. Totals use per-serving nutrition from the default variant, scaled by servings. Allow choosing another variant where a recipe has one.
3. A plan works without a profile, with no fit indicators, and nudges the member to set a goal and goal weight.
4. Servings math is shared with the recipe page scaler, and pricing and leftover math are shared with the basket (`src/libs/basket`).
5. Mobile first. Planning happens on a phone in a store aisle or a couch.
6. Plan data is private to the member (RLS on user id).

## Data

`meal_plans(id, user_id, week_start, name)` and `meal_plan_entries(id, plan_id, day, slot, recipe_id, nutrition_variant_id, servings)`.

## Success metrics

- Paid members who create a plan in the first week.
- Plans per active paid member per month.
- Plans sent to the basket.
- Leftover suggestions added to a plan.
- Paid retention for planners versus non-planners.

## Risks and open questions

- Only 14 recipes. A week of varied meals is thin, so the planner depends on recipe growth. The launch target is 25 recipes. Make sure repeats and leftovers feel intentional.
- Snacks, breakfast, and sides. The book is mostly dinners, so the catalog may not cover every slot. Decide if slots are optional.
- Whether auto-suggest is in v1 or v2. Recommend v2, and ship manual planning first.

## Tasks

1. Migration, models, GraphQL types, and plan service.
2. Per-meal fit logic and reference sums with tests.
3. Plan UI: week grid, add and swap, servings.
4. Paid gating and the free preview.
5. Send to basket.
6. Leftover-aware suggestions.
7. Auto-suggest (v2).
