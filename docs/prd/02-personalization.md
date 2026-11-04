# PRD 02: Personalization

## Problem

Every visitor sees the same recipes with the same filters. People want to know which recipes fit their goal and their body weight, without doing the math.

## Goal

A signed-in member sets a goal and a goal weight once. The site then adjusts its filters and recipe highlights to match. This is free and feeds the paid planner.

This is not a calorie tracker. The site only covers recipes, not every meal in someone's day, so it does not track daily intake, calories burned, or activity. Weight and goal are the only inputs.

## Scope

**In**

- Profile with two inputs: goal and goal weight. Goals start as balanced, fat loss, recomp, and bulk, and are expected to grow (for example pure bulk and clean bulk as separate goals).
- Each goal is defined by grams per pound of goal weight for protein and for fat. A single global estimate of daily calories per pound of goal weight (a maintenance-style average, the same for every goal) gives the calorie base. Together they give the member's target C/F/P percentages: carbs are the remainder of the goal's calories after the fat and protein grams are converted to calories (9 and 4 per gram). The site keeps displaying ratios, now personalized. The calorie base depends on weight only, never on the goal, and is never something the member enters or tracks. Goals do not model a surplus or deficit: they differ only in protein and fat grams per pound, and carbs absorb the rest.
- The daily grams at the member's weight are shared across a few meals a day to give a per-meal range.
- Browse filters start preset to the member's range, with a clear "fits my goal" toggle to turn it off.
- Recipe pages show whether a recipe fits, per serving, with protein given full weight next to C/F/P. Where a recipe misses, suggest a servings amount that gets closer.
- Units setting (lb or kg).

**Out**

- Member-entered calorie targets, resting calories, activity levels, and any tracking of daily totals.
- Carb cycling and training-day plans. Later.
- Wearable or tracker sync.
- Medical advice. Show the nutrition disclaimer next to anything derived from weight.

## Requirements

1. The profile is optional. Without it the site works exactly as today.
2. Goals are data, not code paths: a table or constant mapping each goal to protein grams and fat grams per pound of goal weight (calories per pound is one global constant, not part of a goal), so adding a goal or retuning one needs no logic change. Illustrative values to confirm: pure bulk 1.2 protein and 0.5 fat, clean bulk 1.0 and 0.4, recomp about 0.3 fat. Today's hard-coded book ratios are replaced by this model.
3. One pure function turns goal and goal weight into a per-meal range for protein and fat. The planner reuses it. The number of meals it divides across is a constant (proposed: 3), not a member input.
4. Filter presets only set protein and fat bounds. They never hide recipes with no way back: the toggle is always visible, and the member can change the bounds by hand.
5. Protein stays a first-class number, shown alongside C/F/P and not treated as a leftover.
6. A recipe "fit" is computed from per-serving nutrition. Where a recipe has several variants (for example fully loaded), use the default one.
7. The profile form validates ranges and rejects absurd values.
8. Members can delete their profile data.
9. Goal and goal weight record their source: `manual` or `partner`. A partner write never overwrites a `manual` value, and the member sees where each value came from. This keeps the door open for ForgeFit (see PRD 01 and the README) to send weight later, through GraphQL with a scoped credential and not through the form. No partner work is built now.

## Data

`member_profiles(user_id, goal, goal_weight_kg, units, goal_source, weight_source)`. A separate table keeps the auth-linked `users` row small. Ranges are computed, not stored.

## Success metrics

- Share of new sign-ups that complete the profile.
- Profile completers who return within 7 days versus those who do not.
- Profile completers who start checkout versus those who do not.

## Risks and open questions

- Health claims. Keep language to "recipe fit based on your goal weight", with a disclaimer, and avoid anything that sounds like a prescription.
- Confirm the grams-per-pound values per goal, and pick one global calories-per-pound constant. It only exists to turn protein and fat grams into percentages with carbs as the remainder, so it should be a round, defensible number and labeled as an estimate. Because it ignores activity and goal, it will be off for very active or sedentary people, which is acceptable for judging recipe fit. A partner-supplied calorie figure could override it later. Example for a sense of scale: at 1.2 g/lb protein, 0.5 g/lb fat and 16 kcal/lb, the ratio is 42 / 28 / 30 (C/F/P). The 16 is illustrative only.
- Fit is judged on protein and fat grams per meal plus how close the recipe's own C/F/P is to the member's target ratio. Decide how much weight carbs get in "fits my goal", since carbs are the loosest of the three.
- How a per-meal range is derived from the daily figure (even split across 3 meals is the proposal).
- Whether fat should be a ceiling only (fat loss), a range, or left unfiltered for some goals.
- Whether a calorie filter is wanted at all. Default is no, since calories are not an input.

## Tasks

1. Migration, model, GraphQL type and mutation for the profile.
2. Range function (goal and weight to per-meal protein and fat bounds) with tests.
3. Profile form on the account page.
4. Browse filter presets and the "fits my goal" toggle.
5. "Fits your goal" block on recipe pages.
