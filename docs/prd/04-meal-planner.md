# PRD 04: Meal planner (paid)

## Problem

Members who like the recipes still have to work out a week of meals that hits their macros by hand.

## Goal

A paid member builds a weekly plan from the recipes, sees daily macro totals against their targets, and gets a merged shopping list.

## Scope

**In**

- Plan view for a week (7 days, meals per day from the profile).
- Add a recipe to a day and meal slot, with a servings amount.
- Daily and weekly totals for calories, carbs, fat, protein, shown as C/F/P and compared to the member's targets.
- Auto-suggest: fill empty slots with recipes that fit the remaining macros. Start simple (filter and rank), not an optimizer.
- Swap a recipe, duplicate a day, repeat last week.
- Leftovers: a recipe cooked once can fill several slots (batch cooking is how this book works).
- Merged ingredient list for the plan, handed to PRD 05.
- Saved plans, with one active plan per week.

**Out**

- Carb cycling, training-day plans, a second planning tier. Later.
- Custom foods and tracking intake against the plan.
- Sharing plans between members.

## Requirements

1. Paid only. Free members see a preview with sample data and an upgrade prompt. The preview does not need real planner logic.
2. Totals use per-serving nutrition from the default variant, scaled by servings. Allow choosing another variant where a recipe has one.
3. A plan works without a profile, using default targets, and nudges the member to set one.
4. Servings math is shared with the recipe page scaler.
5. Mobile first. Planning happens on a phone in a store aisle or a couch.
6. Plan data is private to the member (RLS on user id).

## Data

`meal_plans(id, user_id, week_start, name)` and `meal_plan_entries(id, plan_id, day, slot, recipe_id, nutrition_variant_id, servings)`.

## Success metrics

- Paid members who create a plan in the first week.
- Plans per active paid member per month.
- Plans that reach the grocery list step.
- Paid retention for planners versus non-planners.

## Risks and open questions

- Only 14 recipes. A week of varied meals is thin, so the planner depends on recipe growth. The launch target is 25 recipes. Make sure repeats and leftovers feel intentional.
- Snacks, breakfast, and sides. The book is mostly dinners, so the catalog may not cover every slot. Decide if slots are optional.
- Whether auto-suggest is in v1 or v2. Recommend v2, and ship manual planning first.

## Tasks

1. Migration, models, GraphQL types, and plan service.
2. Totals and target comparison logic with tests.
3. Plan UI: week grid, add and swap, servings.
4. Paid gating and the free preview.
5. Auto-suggest (v2).
