# PRD 02: Personalization

## Problem

Every visitor sees the same recipes with the same filters. People want to know which recipes fit their goal and their body, without doing the math.

## Goal

A signed-in member sets a goal and a goal weight once, and can optionally add their calorie burn for a more accurate result. The site then adjusts its filters and recipe highlights to match. This is free and feeds the paid planner.

This is not a calorie tracker. The site only covers recipes, not every meal in someone's day, so it does not track daily intake. Calorie burn is a one-time setting that sharpens the ratios, and everything has a default if the member skips it.

## Scope

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

## Requirements

1. The profile is optional. Without it the site works exactly as today.
2. Goals are data, not code paths: a table or constant mapping each goal to protein grams per pound, fat grams per pound, and a calorie adjustment, so adding or retuning a goal needs no logic change. Illustrative protein and fat values to confirm: pure bulk 1.2 and 0.5, clean bulk 1.0 and 0.4, recomp about 0.3 fat. Today's hard-coded book ratios are replaced by this model.
3. One pure function turns goal, goal weight, and the optional burn inputs into target calories, grams, C/F/P percents, and a per-meal range for protein and fat. The planner reuses it. The number of meals it divides across is a constant (proposed: 3), not a member input.
4. Defaults keep the function total when inputs are missing:
   - No resting calories: estimate from goal weight with one global constant (11 calories per pound, see open questions).
   - Resting set but no activity chosen: use the moderate preset.
   - Activity without resting calories: apply the preset percent to the estimated resting value.
   - The preset percents, the weight constant, and the goal adjustments live in one place so they are easy to tune.
5. The UI shows total burn and target calories, labels each number "default" or "yours", and lets the member switch back to the default. Choosing a preset fills the burn right away and shows it in calories. Typing a number by hand switches the level to "custom".
6. Filter presets only set protein and fat bounds. They never hide recipes with no way back: the toggle is always visible, and the member can change the bounds by hand.
7. Protein stays a first-class number, shown alongside C/F/P and not treated as a leftover.
8. A recipe "fit" is computed from per-serving nutrition. Where a recipe has several variants (for example fully loaded), use the default one.
9. The profile form validates ranges and rejects absurd values.
10. Members can delete their profile data.
11. Goal weight, resting calories, and activity burn each record their source: `manual`, `default`, or `partner`. A partner write never overwrites a `manual` value, and the member sees where each value came from. This keeps the door open for ForgeFit (see PRD 01 and the README) to send weight, resting calories, and a real average activity burn, through GraphQL with a scoped credential and not through the form. No partner work is built now.

## Data

`member_profiles(user_id, goal, goal_weight_kg, resting_calories, activity_level, activity_calories, units)` plus a source column for each overridable value.

- `resting_calories` is nullable. Null means use the default.
- `activity_level` is light, moderate, active, or custom, and is nullable (default applied in code).
- `activity_calories` is stored only for custom or partner values. Preset values are computed from resting calories, so they follow it when it changes.
- Targets and ranges are computed, not stored.

A separate table keeps the auth-linked `users` row small.

## Success metrics

- Share of new sign-ups that complete the profile.
- Share of completers who add their own resting calories or activity level.
- Profile completers who return within 7 days versus those who do not.
- Profile completers who start checkout versus those who do not.

## Risks and open questions

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

## Tasks

1. Migration, model, GraphQL type and mutation for the profile.
2. Target function (burn, goal adjustment, grams, C/F/P percents, per-meal range) with defaults and tests.
3. Profile form on the account page, with activity presets and the default labels.
4. Browse filter presets and the "fits my goal" toggle.
5. "Fits your goal" block on recipe pages.
