# PRD 04: Studio

**Plan:** Studio, $20 a month. Includes everything in Fit.

**Status:** Not started. Starts once Fit has paying members and the book has 50+ recipes. Until then, nothing here is built, but PRD 01 and PRD 03 should not block it.

| Phase | What | Status |
| --- | --- | --- |
| 1 | Makeover engine and rules | Not started |
| 2 | Personal library, caps, and cache | Not started |
| 3 | Studio planner and connector access | Not started |

## Problem

The book only covers recipes we have made over and tested. Members want the same treatment for their own favorites: a family recipe, something saved from social media, or a dish the book does not have yet. Today they have to wait for it to show up in the book or do the swaps themselves.

## Goal

Studio, the $20 plan, lets a member make over any recipe, or generate one from an idea or goal, using the rules and learnings behind the book's tested recipes. Results land in a personal library and work like book recipes: builds, nutrition, fit to their targets, the planner, the basket, and Send to cart.

The book is our recipes. Studio is our method applied to their food. Pitch: "any recipe, made over your way."

## Plans

Studio includes everything in Fit. What each plan gets is in the plan table in the [PRD README](./README.md#business-model-decided). The short version:

- **Free:** the book, goal presets, the basket.
- **Fit, $5:** the book fit to the member's body (PRD 03 phase 1), the planner (PRD 03 phase 3), Send to cart (PRD 02 phase 4), the book download.
- **Studio, $20:** Fit plus everything in this PRD.

The line between Fit and Studio is cost to run. Fit features are formulas and data, with almost no cost per member. Studio is the first feature with a model call per use, which is why it sits behind the higher price and a monthly cap.

## Scope

**In**

- **Makeover:** a member gives a recipe link, pasted text, or a dish name and gets back a made-over version.
- **Generate:** a member describes an idea or goal ("high-protein breakfast under 400 calories, no eggs") and gets a recipe built for it.
- **Personal library:** generated recipes save to the member's account, private by default, and render with the existing recipe page, builds, nutrition table, fit block, and basket.
- **Fit to the member:** generation targets the member's per-meal range from PRD 03 phase 1, not fixed book ratios.
- **Studio planner:** the planner (PRD 03 phase 3) can use library recipes, and can fill an empty slot with a newly generated recipe that fits what is left.
- **Connector access:** the Macro Makeovers Claude connector exposes the same engine to members' own Claude (a `makeover_recipe` tool and a `makeover` prompt that shows as a slash command in clients that support MCP prompts). Same OAuth connector as the admin import, scoped to the member.

**Out**

- Publishing member recipes to the public site or the book.
- Generated build photos for member recipes.
- A native app.

## Requirements

1. **One engine, two entry points.** A single server-side service does the makeover. The web UI calls it through a GraphQL mutation (`makeoverRecipe`), and the connector tool calls the same mutation. No logic lives in the client or the prompt text.
2. **Pipeline:**
   1. Fetch and parse the source on the server (many MCP clients cannot fetch pages).
   2. Pull the rules that apply (swaps, technique learnings, levers) and one or two similar book recipes as examples.
   3. Generate in the recipe import schema, so the output goes through the same validation as admin imports.
   4. Validate against the member's targets (the existing `validate_recipe` logic). If it misses, revise once, then save with an honest fit label rather than retrying forever.
3. **Rules are data.** Swaps and learnings live in the database (for example `makeover_rules`), grown from the book's techniques and learnings notes and each new recipe. They stay on the server and are never sent whole to a client. This is the moat, so it should not be readable through the connector.
4. **Nutrition is computed, not trusted.** Book numbers were checked against MyFitnessPal tracking. Generated recipes have not been, so their macros are calculated from ingredient data (PRD 03 phase 2), not taken from the model's output, and carry the estimate disclaimer plus a "Generated, not kitchen-tested" label.
5. **Gating by plan.** `hasPlan(ctx, 'studio')` (PRD 01 phase 2) gates every Studio resolver and the RLS on library recipes. Fit and Free members see Studio entry points with an upgrade prompt.
6. **Usage cap.** A monthly generation cap per member, set by config. Usage is recorded per generation. The UI shows what is left before the member hits it.
7. **Cache.** Makeovers of the same source (normalized URL or dish name) are cached and reused, so popular dishes do not cost a new generation each time. The member still gets their own copy in the library.
8. **Demand signal from Fit and Free.** Log searches with no results and recipe requests. That feeds which recipes the book adds next, and later the Studio upgrade prompt ("make over anything, not just what's in the book").
9. **Upgrade path.** Fit members get a discounted first month of Studio or a few free generations at launch.

## Data

- `recipes.owner_id` and `recipes.visibility` (`public` for book recipes, `private` for member recipes), so library recipes reuse the existing tables, builds, and basket lines. Alternative: a separate `member_recipes` table, if mixing them complicates RLS.
- `makeover_rules(id, kind, rule, source_recipe_id, created_at)`.
- `makeover_usage(user_id, period, count)`.
- `makeover_cache(source_key, recipe_json, created_at)`.
- `subscriptions.plan` (PRD 01 phase 2).

## Competition

AI makeover apps already exist, so "make over any recipe" alone is not new. easyEats, But Make It Healthy, Reci AI, RecipeBox AI, Remy AI, and DietMod all turn a link or photo into a high-protein or lighter version. See [`meal-planning-market.md`](../meal-planning-market.md#ai-recipe-makeover-apps).

What Studio has that they do not:

- Rules learned from tested recipes, not generic one-tap swaps.
- Targets from the member's own weight and burn (PRD 03 phase 1), not a "high-protein" toggle.
- Honest in-store cost per serving and real carts at Walmart and Kroger (PRD 02).
- The same engine inside the member's own Claude.

## Phase 1: Makeover engine and rules

**Status:** Not started.

Requirements 1 to 5 and 8.

1. Studio plan level (PRD 01 phase 2).
2. `makeover_rules` table, seeded from the book's techniques and learnings.
3. Source fetch and parse service.
4. Makeover service and the `makeoverRecipe` mutation, using the import schema and `validate_recipe`.
5. Demand logging on Free and Fit.
6. Tests: gating and the pipeline.

## Phase 2: Personal library, caps, and cache

**Status:** Not started.

Requirements 6, 7, and 9.

1. Library: owner and visibility on recipes, RLS, a library page.
2. Usage cap and cache.
3. Fit to Studio upgrade offer.
4. Tests: caps, cache, RLS on private recipes.

## Phase 3: Studio planner and connector access

**Status:** Not started. Needs PRD 03 phase 3.

1. Studio planner: library recipes and generated fill-ins in the planner.
2. Member tool and prompt on the connector, scoped by OAuth.

## Success metrics

- Fit to Studio upgrade rate.
- Generations per Studio member per month, and the share who hit the cap.
- Library recipes cooked: planned, added to the basket, or sent to cart.
- Model cost per Studio member against the $20.
- Cache hit rate.

## Risks and open questions

- Cap size. 30 a month is the starting guess. Whether cache hits count toward it.
- Quality on dishes far from the book's comfort-food lane (desserts, baking). Decide whether to refuse, warn, or allow.
- Source parsing on sites that block fetches, and social video links.
- Which model, and the cost per generation at that model. At $20, model cost per member should stay well under a few dollars a month.
- Whether members can submit a library recipe for the book later.
