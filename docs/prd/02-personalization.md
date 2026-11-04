# PRD 02: Personalization

## Problem

Every visitor sees the same recipes with the same numbers. People want to know what fits their goal and their protein target.

## Goal

A signed-in member sets a goal and body info once. The site then shows recipes and portions in terms of their targets. This is free and feeds the paid planner.

## Scope

**In**

- Profile with two inputs: goal (balanced, fat loss, recomp, bulk) and goal weight. The daily protein target in grams can be overridden.
- Daily protein and fat targets set by weight (grams per pound of goal weight, per goal), with carbs and calories filled in from the book's goal ratios. The member can override any number.
- Recipe pages show "fits your plan": per-serving macros against the member's per-meal share, and a suggested servings amount.
- Browse filters get a "fits my goal" toggle.
- Units setting (lb or kg).

**Out**

- Carb cycling and training-day plans. Later.
- Wearable or tracker sync.
- Medical advice. Show the nutrition disclaimer next to targets.

## Requirements

1. Profile is optional. Without it the site works exactly as today.
2. Targets come from one pure function, so the planner reuses it. Inputs: goal, goal weight, protein override, meals per day.
3. Protein stays a first-class target, shown alongside C/F/P and not treated as a leftover.
4. A recipe "fit" is computed from per-serving nutrition variants. Where a recipe has several variants (for example fully loaded), use the default one.
5. The profile form validates ranges and rejects absurd values.
6. Members can delete their profile data.

## Data

Add to `users` or a `member_profiles` table: `goal`, `goal_weight_kg`, `protein_target_g`, `calorie_target`, `meals_per_day`, `units`. Prefer a separate table so the auth-linked `users` row stays small.

## Success metrics

- Share of new sign-ups that complete the profile.
- Profile completers who return within 7 days versus those who do not.
- Profile completers who start checkout versus those who do not.

## Risks and open questions

- Health claims. Keep language to "targets based on the book's ratios", with a disclaimer.
- Inputs: decided, goal and goal weight only. No height, age, or activity. Those two are enough for the by-weight protein and fat recommendations (grams per pound of goal weight), which is what the targets need.
- Confirm the exact per-goal grams-per-pound values and the book's ratio table before building the target function.

## Tasks

1. Migration, model, GraphQL type and mutation for the profile.
2. Target calculation function with tests.
3. Profile form on the account page.
4. "Fits your plan" block on recipe pages and the browse toggle.
