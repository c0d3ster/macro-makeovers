# PRD 09: Builds (free)

## Problem

Most recipes already come in more than one build: Turkey Taco Grillers as grillers, a rice bowl, or filling only, and with turkey or 90/10 beef. Today those builds are just rows in the nutrition table. The site always leads with the default row, so:

- Filters and goal matching only ever see the default. A fat loss visitor never finds the Taco Grillers rice bowl, and a `meat=beef` filter finds the turkey recipe only because the base carries both tags.
- The page title, tags, cost, and ingredients cannot follow the build. Cooking with beef still reads "Turkey Taco Grillers".
- Swapping one ingredient (flank for ribeye in bulgogi) forces a full variant: a second copy of every ingredient, step, and note that then drifts.

## Goal

A build is a lightweight alternate version of a recipe that shares its steps. People click a row in the nutrition table to switch builds, and the page (title, macros, tags, cost, ingredient swaps, basket) follows. Browse and filtering pick the build that fits, so each recipe competes on its best build, not only its default.

## Builds versus variants

|                         | Build                                                  | Variant                                     |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------- |
| What it is              | A row of the recipe, with a few overrides              | A full recipe linked with `variantOf`       |
| Steps and notes         | Shared with the recipe                                 | Its own                                     |
| Ingredients             | Shared, with up to a few line swaps                    | Its own                                     |
| Page                    | Same page, `?build=<key>`                              | Its own page and slug                       |
| Grid                    | One card per recipe, showing the build that fits       | Its own card                                |
| Example                 | Beef Taco Grillers, Taco rice bowl, Bulgogi with flank | Southwest Sausage Hash Brown Bake           |

Rule of thumb: if the steps change, it is a variant. If only amounts, one or two ingredients, or the serving format change, it is a build. Pollo Asado with Costco precooked chicken skips the marinade and the cook, so it stays a variant. Bulgogi with flank steak only swaps the meat, so it becomes a build.

## Scope

**In**

- Build overrides on each makeover nutrition row: a URL key, an optional title, tag changes, an optional cost tier, a short note, ingredient line swaps, and whether the build can lead a card.
- Recipe page: makeover rows in the nutrition table are selectable. The selection drives the hero title, macro bar, cost, tags, ingredients, whole batch row, and "Add to basket".
- `?build=<key>` on recipe URLs, so a build can be linked and shared.
- Grid, filters, sorting, and goal matching resolve one build per recipe.
- Import schema, admin editor, Claude connector, and the book all carry builds.
- Convert the flank steak bulgogi variant into a build.

**Out**

- Step overrides. A build that needs different steps is a variant.
- Build axes (meat times format, picked separately). Builds are a flat list the author curates. See open questions.
- A personal "my default build" setting. Later, with PRD 02.
- Separate pages, metadata, or share images per build. The canonical page stays the recipe.

## Data

Builds extend `recipe_nutrition`. The table already holds one row per build (`NutritionBuild` in code), so this adds columns instead of a new table. Traditional rows ignore every new column.

| Column            | Type            | Notes                                                                                                   |
| ----------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| `key`             | text            | URL key, unique per recipe. Defaults to a kebab of the label on import. `turkey`, `beef`, `rice-bowl`.  |
| `title`           | text, nullable  | Full title while this build is selected. Null keeps the recipe title. "Beef Taco Grillers".             |
| `note_md`         | text, nullable  | One or two lines on what changes, shown under the table when selected.                                  |
| `tags_add`        | text[]          | Tags this build adds to the recipe's own. `{beef}`.                                                     |
| `tags_remove`     | text[]          | Recipe tags this build drops. `{turkey}`.                                                               |
| `cost_tier`       | int, nullable   | 1 to 5. Null keeps the recipe tier. Bulgogi flank is 3 where ribeye is 4.                               |
| `listed`          | boolean         | Default true. False for components like "Filling only" or "Chicken only": selectable on the page, never chosen to lead a card. |

Ingredient swaps get their own small table, `recipe_build_swaps(nutrition_id, ingredient_position, raw_text)`. A swap replaces one ingredient line by its position. Steps are never swapped.

A build's effective tags are the recipe tags minus `tags_remove` plus `tags_add`. The recipe's own tags describe the default build only, so Turkey Taco Grillers drops its `beef` tag and the beef build adds it.

### Import JSON

Builds stay in the `nutrition` array, so a recipe with no build fields imports exactly as today.

```json
{
  "kind": "makeover",
  "key": "beef",
  "label": "Beef grillers (90/10)",
  "title": "Beef Taco Grillers",
  "note": "90/10 ground beef in place of turkey. Adds about 30 calories and 3g fat per serving.",
  "tagsAdd": ["beef"],
  "tagsRemove": ["turkey"],
  "swaps": [{ "ingredient": 0, "raw": "1 lb 90/10 ground beef" }],
  "calories": 730,
  "carbsG": 79,
  "fatG": 24,
  "proteinG": 49
}
```

Validation, added to `recipeImportSchema`:

- Keys are unique within a recipe and are slug shaped.
- `tagsRemove` only names tags the recipe has. `tagsAdd` does not repeat one.
- A swap's `ingredient` points at a real line, and a build swaps a line at most once.
- The default build must be `listed`. At least one listed makeover row exists.
- Build fields on a traditional row are rejected.

## Requirements

### Resolving a build

1. One pure function in `src/libs/recipes`, `resolveBuild(recipe, build)`, returns the effective view: title, macros, tags, cost tier, ingredients with swaps applied, and note. The page, the grid card, the book, and the basket all go through it, so a build reads the same everywhere.
2. Recipe loaders return every build with its overrides. `RecipeCard` gains a `builds` list (key, title, macros, tags, cost tier, listed) so the grid can resolve without another query.

### Recipe page

3. Makeover rows in the nutrition table are buttons in one group, with `aria-pressed` on the selected row. The selected row gets a brand-colored left edge and a tinted background. Traditional rows stay italic and are not selectable. With one makeover row the table looks and behaves as today.
4. A short hint above the table, "Tap a build to switch", shows only when there are two or more makeover rows.
5. Selecting a build updates, without a navigation or a scroll jump: the hero title, macro ratio bar and numbers, cost tier, tag chips, ingredient lines (swapped lines get a small "swapped" marker), the whole batch row, and the build note under the table. Steps and other notes do not change.
6. The selection writes `?build=<key>` with a history replace, so back still leaves the page. The default build writes no param. An unknown key falls back to the default without an error, matching how filters treat hand-edited links.
7. The page stays statically generated and revalidated as today. The server renders the default build. A client boundary reads `?build` and swaps the view. Metadata, the canonical URL, and the share image stay on the recipe.
8. "Add to basket" adds the selected build.

### Grid and filters

9. Each recipe still shows one card. The card resolves to one listed build:
   - Drop builds that fail a hiding filter: tags (using the build's effective tags), max calories, and max cost (using the build's tier). Max time and difficulty are recipe-wide.
   - No build left means the recipe is hidden.
   - With a goal or macro targets set, pick the best fit among the rest, using the same fit then distance ranking the grid already uses. Ties go to the default.
   - Otherwise pick the default if it survived, else the first survivor in table order.
10. Text search matches any build's title too, and resolves to that build: "beef taco" leads with Beef Taco Grillers.
11. The card shows the resolved build's title, macros, and cost, and links to `/recipes/<slug>?build=<key>` (no param for the default). A card showing a non-default build says which in one short line under the title, for example "Rice bowl build".
12. Sorting uses the resolved build's numbers. Facet counts and "unavailable" options use effective tags across listed builds, so the `beef` meat option stays available because of the beef build.
13. Fit badges and PRD 02's "fits my goal" use the resolved build. This replaces PRD 02 requirement 8, which used the default only.

### Basket

14. A basket entry becomes `{ slug, build, batches }`. Builds of one recipe stay mutually exclusive, as PRD 08 already says for alternate builds: adding one replaces the other.
15. Price lines are keyed by recipe and build. A build with no lines of its own uses the recipe's. The bulgogi flank lines (`9a` in `docs/basket-data.json`) move under the bulgogi `flank` build. Saved baskets without a build read as the default.

### Authoring and the book

16. The admin nutrition editor adds the build fields to each makeover row, behind a "Build details" disclosure so simple recipes stay simple. Swaps pick an ingredient line from a list, not a typed index.
17. `get_recipe_schema`, `validate_recipe`, and `import_recipe` on the Claude connector follow the schema. `docs/claude-project-knowledge.md` gets the builds versus variants rule.
18. The book keeps one table per recipe. Under the ingredients, each build with swaps or a title gets one line: "**Beef Taco Grillers:** 1 lb 90/10 ground beef in place of the turkey." Recipe numbering ignores builds.
19. Macro display follows the site rules everywhere a build shows: C/F/P order, `formatMacroRatios` and `toMacroRatios`, protein given full weight.

## Seed data changes

| Recipe                | Builds                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| Turkey Taco Grillers  | `grillers` (default), `beef` "Beef Taco Grillers", `rice-bowl`, `filling` (unlisted). Drop the base `beef` tag. |
| Beef Bulgogi          | `ribeye` (default), `flank` with cost tier 3 and a meat swap. Retire the flank variant and redirect its slug to `?build=flank`. |
| Greek Yogurt Tuna Melt | `hoagie` (default), `sourdough`, `cold`, `salad` (unlisted).                                              |
| Kickin' Fried Chicken | `plate` (default), `chicken` (unlisted).                                                                   |
| Spicy Turkey Chili    | `loaded` (default), `base`.                                                                                |
| Pollo Asado, Ham and Prosciutto Sliders | Keys only for their existing rows. Costco precooked pollo asado stays a variant.          |

Every other recipe has one makeover row and needs nothing.

## Success metrics

- Share of recipe page visits that switch builds.
- Grid cards that lead with a non-default build, and their click-through against default cards.
- Basket adds of non-default builds.

## Risks and open questions

- **Unverified numbers.** The beef griller numbers come from the recipe's own tip (about +30 calories and +3g fat), and its meat table disagrees slightly (+50 and +4g, with +4g protein). Confirm before the beef build ships, since filtering will now act on them.
- **Combinations.** Meat and format multiply (two meats times three formats is six rows). The flat list keeps the table readable and lets the author list only verified builds. If combinations become common, add axes later: each build tagged with an axis value, and the table grouped by axis.
- **Shared links render the default first.** The static page paints the default build, then switches on the client. Check how this Next.js version handles reading search params under a static page (`node_modules/next/dist/docs/`) before building, and keep the swap inside one client boundary so the title and table change together.
- **Swaps by position.** Reordering ingredients in the editor has to move swaps with their lines. The editor should remap them, and validation catches any it misses.
- **Title wins over search?** A search for "turkey" should probably keep leading with the turkey build even when a goal prefers the rice bowl. Proposal: text match on a build title beats fit.

## Tasks

1. Migration: new `recipe_nutrition` columns and `recipe_build_swaps`, with RLS following the parent recipe. Regenerate types.
2. Import schema, validation, `importRecipe`, `diffRecipe`, and the repository read and write paths.
3. `resolveBuild` and build resolution for the grid, with tests (filters, goals, search, sorting, facets).
4. Recipe page: selectable nutrition table, client build state from `?build`, hero, ingredients, and note following it.
5. Grid card: resolved build, link with the build key, non-default label.
6. Basket: entries with a build, price lines by build, stored basket migration.
7. Admin editor and Claude connector.
8. Book output, then the seed data changes and the bulgogi variant retirement on the hosted database.
