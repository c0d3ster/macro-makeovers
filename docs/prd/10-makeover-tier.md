# PRD 10: Makeover tier

**Status:** Planned, not built. Starts once the $5 plan has paying members and the book has 50+ recipes. Until then, nothing here is built, but PRD 01 and 02 should not block it.

## Problem

The book only covers recipes we have made over and tested. Members want the same treatment for their own favorites: a family recipe, something saved from social media, or a dish the book does not have yet. Today they have to wait for it to show up in the book or do the swaps themselves.

## Goal

A second paid plan where a member can make over any recipe, or generate one from an idea or goal, using the rules and learnings behind the book's tested recipes. Results land in a personal library and work like book recipes: builds, nutrition, fit to their goal, the basket, and Send to cart.

The book is our recipes. This plan is our method applied to their food.

## Plans

| Plan | Price | Includes |
| --- | --- | --- |
| Free | $0 | Every book recipe, filters, servings scaler, accounts, the basket, favorites, reviews |
| Plan 1 | $5 a month (PRD 01) | Send to cart (PRD 05), goal-based targets from the member's stats (PRD 02), and the book download |
| Plan 2 (this PRD) | $10 to $20 a month, decided at launch | Everything in plan 1, plus makeovers, idea-to-recipe generation, the personal library, and member MCP access. Possibly meal planning (open question) |

Two paid plans total. No third tier.

Plan 1 costs almost nothing per member to run. Personal targets come from a formula (PRD 02 requirement 3), and scaling is math on recipes that already exist. Plan 2 is the first feature with a real per-use cost (a model call per generation), which is why it sits behind the higher price.

## Scope

**In**

- **Makeover:** a member gives a recipe link, pasted text, or a dish name and gets back a made-over version.
- **Generate:** a member describes an idea or goal ("high-protein breakfast under 400 calories, no eggs") and gets a recipe built for it.
- **Personal library:** generated recipes save to the member's account, private by default, and render with the existing recipe page, builds, nutrition table, fit block, and basket.
- **Fit to the member:** generation targets the member's per-meal range from PRD 02, not fixed book ratios.
- **Member MCP access:** the Macro Makeovers connector exposes the same engine to members' own Claude (a `makeover_recipe` tool and a `makeover` prompt that shows as a slash command in clients that support MCP prompts). Same OAuth connector as the admin import, scoped to the member.

**Out**

- Publishing member recipes to the public site or the book.
- Generated build photos for member recipes.
- A native app.

## Requirements

1. **One engine, two entry points.** A single server-side service does the makeover. The web UI calls it through a GraphQL mutation (`makeoverRecipe`), and the MCP tool calls the same mutation. No logic lives in the client or the prompt text.
2. **Pipeline:**
   1. Fetch and parse the source on the server (many MCP clients cannot fetch pages).
   2. Pull the rules that apply (swaps, technique learnings, levers) and one or two similar book recipes as examples.
   3. Generate in the recipe import schema, so the output goes through the same validation as admin imports.
   4. Validate against the member's targets (the existing `validate_recipe` logic). If it misses, revise once, then save with an honest fit label rather than retrying forever.
3. **Rules are data.** Swaps and learnings live in the database (for example `makeover_rules`), grown from the book's `techniques-and-learnings` notes and each new recipe. They stay on the server and are never sent whole to a client. This is the moat, so it should not be readable through the connector.
4. **Nutrition is computed, not trusted.** Book numbers were checked against MyFitnessPal tracking. Generated recipes have not been, so their macros are calculated from ingredient data (PRD 03), not taken from the model's output, and carry the estimate disclaimer plus a "Generated, not kitchen-tested" label.
5. **Gating by plan level.** Add `plan` to `subscriptions`. A `requirePlan(ctx, 'makeover')` check sits next to `requirePaidAccess`, enforced in resolvers and RLS, same as PRD 01.
6. **Usage cap.** A monthly generation cap per member, set by config. Usage is recorded per generation. The UI shows what is left before the member hits the cap.
7. **Cache.** Makeovers of the same source (normalized URL or dish name) are cached and reused, so popular dishes do not cost a new generation each time. A cache hit still counts toward the cap or not, decided at build time (open question), and the member gets their own copy in the library.
8. **Demand signal from plan 1.** Log searches with no results and recipe requests from plan 1 members. That feeds which recipes the book adds next, and later the upgrade prompt ("make over anything, not just what's in the book").
9. **Upgrade path.** Plan 1 members get a discounted first month or a few free generations when plan 2 launches.

## Data

- `recipes.owner_id` and `recipes.visibility` (`public` for book recipes, `private` for member recipes), so library recipes reuse the existing tables, builds, and basket lines. Alternative: a separate `member_recipes` table, if mixing them complicates RLS.
- `makeover_rules(id, kind, rule, source_recipe_id, created_at)`.
- `makeover_usage(user_id, period, count)`.
- `makeover_cache(source_key, recipe_json, created_at)`.
- `subscriptions.plan`.

## Competition

AI makeover apps already exist, so "make over any recipe" alone is not new. easyEats, But Make It Healthy, Reci AI, RecipeBox AI, Remy AI, and DietMod all turn a link or photo into a high-protein or lighter version. See [`meal-planning-market.md`](../meal-planning-market.md#ai-recipe-makeover-apps).

What plan 2 has that they do not:

- Rules learned from tested recipes, not generic one-tap swaps.
- Targets from the member's own weight and burn (PRD 02), not a "high-protein" toggle.
- Honest in-store cost per serving and real carts at Walmart and Kroger (PRD 05, PRD 08).
- The same engine inside the member's own Claude through MCP.

## Success metrics

- Plan 1 to plan 2 upgrade rate.
- Generations per plan 2 member per month, and the share who hit the cap.
- Library recipes cooked: added to the basket or sent to cart.
- Model cost per plan 2 member against plan revenue.
- Cache hit rate.

## Risks and open questions

- **Personalization placement.** The README and PRD 02 say personalization is free. This PRD puts goal-based targets in plan 1. Decide which, and update PRD 02 and the README to match.
- **Meal planner placement.** The README puts the meal planner in the $5 plan (PRD 04). Decide whether it stays there or moves to plan 2.
- Price point: $10 or $20. Revisit with plan 1 conversion data.
- Cap size (20 to 30 a month is the starting guess) and whether cache hits count.
- Quality on dishes far from the book's comfort-food lane (desserts, baking). Decide whether to refuse, warn, or allow.
- Source parsing on sites that block fetches, and social video links.
- Which model, and the cost per generation at that model.
- Whether members can submit a library recipe for the book later.

## Tasks

1. `subscriptions.plan`, `requirePlan`, and plan 2 in Stripe and on `/pricing`.
2. `makeover_rules` table, seeded from the book's techniques and learnings.
3. Source fetch and parse service.
4. Makeover service and the `makeoverRecipe` mutation, using the import schema and `validate_recipe`.
5. Library: owner and visibility on recipes, RLS, a library page.
6. Usage cap and cache.
7. Member MCP tool and prompt on the connector, scoped by OAuth.
8. Demand logging on plan 1.
9. Tests: gating, caps, cache, RLS on private recipes.
