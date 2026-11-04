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
- Optional resting calories (daily calories burned at rest). A member can type it in, and a partner app (ForgeFit, see PRD 01) can supply it later. When present, the calorie target is built from it with a goal adjustment instead of the default ratio-derived number.
- Optional average activity burn (daily calories burned through activity, on top of resting). The member picks an activity level preset, which fills the burn automatically as a percent of resting calories, or types an exact daily number. When resting calories is set and nothing is chosen, the default preset is used.

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
7. Resting calories and average activity burn are optional inputs to the target function. Total daily burn is resting plus activity, and the goal adjustment (deficit, maintenance, surplus) applies to that total. With neither set, behavior is unchanged. Activity burn without resting calories is ignored, since there is nothing to add it to.
   - Activity level presets, each a percent of resting calories: light 10 percent, moderate 15 percent, active 20 percent. Moderate is the default. Most people sit at 15 to 20 percent at most. The percents live in one constant so they are easy to tune.
   - Choosing a preset fills the burn number right away and shows the result in calories, so the member sees what the preset means for them.
   - The member can instead enter an exact average daily burn in calories. Editing the number by hand switches the level to "custom".
   - The UI shows total burn and labels the activity source. A partner can supply a real average, which replaces a preset but never a manual number. Protein and fat stay set by weight either way, and carbs fill the remaining calories.
8. Every stored target and the resting calories value records its source: `manual`, `calculated`, or `partner`. A partner write never overwrites a `manual` value. The member sees where each number came from and can switch back to manual.
9. Partner writes arrive through GraphQL with a scoped credential (see PRD 01), not through the profile form.

## Data

Add to `users` or a `member_profiles` table: `goal`, `goal_weight_kg`, `protein_target_g`, `calorie_target`, `resting_calories` (nullable), `activity_level` (light, moderate, active, or custom; nullable, default applied in code), `activity_calories` (nullable, stored only for custom or partner values; preset values are computed from resting calories so they follow it when it changes), `meals_per_day`, `units`, plus a source column for each overridable value. Prefer a separate table so the auth-linked `users` row stays small.

## Success metrics

- Share of new sign-ups that complete the profile.
- Profile completers who return within 7 days versus those who do not.
- Profile completers who start checkout versus those who do not.

## Risks and open questions

- Health claims. Keep language to "targets based on the book's ratios", with a disclaimer.
- Inputs: decided, goal and goal weight only. No height, age, or activity. Those two are enough for the by-weight protein and fat recommendations (grams per pound of goal weight), which is what the targets need.
- Decided: resting calories plus an optional average activity burn, with a default activity value when none is given. Activity is chosen from presets (10, 15, 20 percent of resting, moderate default) or entered manually. Still to confirm: the preset names and percents, and the per-goal adjustment sizes for fat loss, recomp, and bulk.
- Confirm the exact per-goal grams-per-pound values and the book's ratio table before building the target function.

## Tasks

1. Migration, model, GraphQL type and mutation for the profile.
2. Target calculation function with tests.
3. Profile form on the account page.
4. "Fits your plan" block on recipe pages and the browse toggle.
