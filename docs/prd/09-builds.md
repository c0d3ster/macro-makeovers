# PRD 09: Builds (free)

## Problem

Most recipes already come in more than one build: Turkey Taco Grillers as grillers, a rice bowl, or filling only, and with turkey or 90/10 beef. Today those builds are just rows in the nutrition table. The site always leads with the default row, so:

- Filters and goal matching only ever see the default. A fat loss visitor never finds the Taco Grillers rice bowl, and a `meat=beef` filter finds the turkey recipe only because the base carries both tags.
- The page title, tags, cost, and ingredients cannot follow the build. Cooking with beef still reads "Turkey Taco Grillers".
- Swapping one ingredient (flank for ribeye in bulgogi) forces a full variant: a second copy of every ingredient, step, and note that then drifts.

## Goal

A build is a lightweight alternate version of a recipe that shares its method. People click a row in the nutrition table to switch builds, and the page (title, macros, tags, cost, ingredients, steps, basket) follows. Browse and filtering pick the build that fits, so each recipe competes on its best build, not only its default.

## Builds versus variants

|                         | Build                                                  | Variant                                     |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------- |
| What it is              | A row in `recipe_builds`, with optional overrides       | A full recipe linked with `variantOf`       |
| Steps and notes         | Shared, and a step can be limited to some builds       | Its own                                     |
| Ingredients             | Shared, and a line can be limited to some builds       | Its own                                     |
| Page                    | Same page, `?build=<key>`                              | Its own page and slug                       |
| Grid                    | One card per recipe, showing the build that fits       | Its own card                                |
| Example                 | Beef Taco Grillers, Taco rice bowl, Bulgogi with flank, Costco pollo asado | Southwest Sausage Hash Brown Bake |

Rule of thumb: if it is the same dish cooked the same way, with some lines or steps added, dropped, or swapped, it is a build. If it is a different dish with its own method, it is a variant. Pollo Asado with Costco precooked chicken skips the marinade step and its ingredients and sears the chicken briefly, so it is a build. Bulgogi with flank steak only swaps the meat, so it is a build too. The Southwest Sausage Hash Brown Bake changes the flavor profile and most of the add-ins, so it stays a variant.

## Scope

**In**

- A `recipe_builds` table: each build has its own macros and a URL key, plus optional title, tag changes, cost tier, times, note, and photo, and whether it can lead a card.
- Ingredient lines and steps that belong to some builds only, or that some builds skip.
- Recipe page: makeover rows in the nutrition table are selectable. The selection drives the hero title, macro bar, cost, tags, ingredients, whole batch row, and "Add to basket".
- `?build=<key>` on recipe URLs, so a build can be linked and shared.
- Grid, filters, sorting, and goal matching resolve one build per recipe.
- Import schema, admin editor, Claude connector, and the book all carry builds.
- Convert the flank steak bulgogi variant into a build, and turn the inline Costco option in Pollo Asado into its own build.

**Out**

- Per-build edits to a step's text. A build gets its own step instead, scoped to it.
- Build axes (meat times format, picked separately). Builds are a flat list the author curates. See open questions.
- A personal "my default build" setting. Later, with PRD 02.
- Separate pages, metadata, or share images per build. The canonical page stays the recipe.

## Data

A build has grown past a nutrition row: it has its own macros, title, times, tags, picture, and scoped lines and steps. So it gets its own table, and `recipe_nutrition` goes back to holding only the traditional comparison rows. Every override is nullable and falls back to the recipe, so a build stores only what differs.

### `recipe_builds`

| Column                         | Type             | Notes                                                                                                          |
| ------------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `id`                           | uuid             | Primary key.                                                                                                   |
| `recipe_id`                    | uuid             | The recipe, cascade on delete.                                                                                 |
| `key`                          | text             | URL key, unique per recipe. Defaults to a kebab of the label on import. `grillers`, `beef`, `costco`.         |
| `label`                        | text             | The nutrition table row. "Beef grillers (90/10)".                                                              |
| `position`                     | int              | Table order.                                                                                                   |
| `is_default`                   | boolean          | Exactly one per recipe, held by a partial unique index.                                                        |
| `listed`                       | boolean          | Default true. False for components like "Filling only": selectable on the page, never chosen to lead a card.  |
| `calories`, `carbs_g`, `fat_g`, `protein_g` | numeric | Required. Every build has its own macros.                                                               |
| `swap`                         | jsonb            | Tag swaps, like `{"turkey": "beef"}`. The build's tags trade them, and its title swaps the matching word, so "Turkey Taco Grillers" reads "Beef Taco Grillers". Prose is never swapped: comparisons like "93/7 turkey is cheaper than 93/7 beef" would break. |
| `title`                        | text, nullable   | Only when the swapped title is not the wording wanted, like "Lean Beef Taco Grillers".                        |
| `difficulty`                   | smallint, nullable | 1 to 5. Costco pollo asado is easier than marinating thighs.                                                 |
| `note_md`                      | text, nullable   | One or two lines on what changes, shown under the table.                                                       |
| `cost_tier`                    | smallint, nullable | 1 to 5. Bulgogi flank is 3 where ribeye is 4.                                                                |
| `prep_minutes`, `cook_minutes` | int, nullable    | Costco pollo asado drops the marinade prep.                                                                    |
| `image_url`                    | text, nullable   | The build's own photo. Null uses the recipe photo.                                                             |
| `image_is_placeholder`         | boolean          | Same meaning as on `recipes`.                                                                                  |

The recipe row keeps everything shared: slug, summary, servings, difficulty, status, access, the recipe photo, and the recipe-level title, times, cost, and tags that the default build inherits. The default build normally sets no overrides at all.

### Scoped lines and steps

`ingredients`, `steps`, and `recipe_notes` each get `only_builds` and `skip_builds`, text[] of build keys, both default empty. Notes include the nutrition intro and analysis, which often differ per build. Empty on both means every build. A row sets one or the other, never both (check constraint).

- **Swap a line:** the turkey line skips `beef`, and a beef line is only for `beef`.
- **Drop lines and a step:** the marinade lines and the marinade step skip `costco`.
- **Add a step:** the Costco sear is its own step, only for `costco`. Skinless and skin-on get their own cook steps the same way.

Steps are never edited per build, only included or left out. That keeps every step's text in one place and keeps the book readable.

Keys, not build ids, because saving a recipe deletes and reinserts its ingredients and steps, and keys are what the import JSON and the URL already use. Validation checks every key names a real build.

### Saving

Ingredients, steps, notes, and nutrition keep the current delete and reinsert. Builds are upserted by `(recipe_id, key)` instead, so a build keeps its id and its photo across edits. A build whose key is gone from the save is deleted, and its photo goes with it. Renaming a key in the editor sends the old key with the new one, and the save rewrites the matching `only_builds` and `skip_builds` entries in the same transaction. Revisions snapshot builds with the rest of the recipe.

### Pictures

- The hero, the grid card, and the basket show the resolved build's photo, else the recipe photo.
- The share image and page metadata stay on the recipe photo.
- The admin photo editor gets a build picker. Placeholder generation for a build prompts from its title and note, and a build without a photo is fine.

### Migration

Each makeover `recipe_nutrition` row moves into `recipe_builds` with its macros, label, position, and default flag, and a key from its label. Then makeover rows are deleted from `recipe_nutrition`, its `is_default` column is dropped, and `kind` is left as `traditional` only.

### Import JSON

A top-level `builds` array, with `nutrition` keeping the traditional rows. Old JSON with makeover rows in `nutrition` still imports: the schema turns them into builds, so the seed files and the connector keep working while they are updated.

```json
"builds": [
  {
    "key": "grillers",
    "label": "Grillers (2 per serving)",
    "isDefault": true,
    "calories": 700, "carbsG": 79, "fatG": 21, "proteinG": 49
  },
  {
    "key": "beef",
    "label": "Lean beef grillers",
    "swap": { "turkey": "beef" },
    "title": "Lean Beef Taco Grillers",
    "note": "90/10 ground beef in place of the turkey.",
    "calories": 750, "carbsG": 78, "fatG": 25, "proteinG": 53
  }
],
"ingredients": [
  { "raw": "1 lb lean ground turkey (93/7)", "skipBuilds": ["beef"] },
  { "raw": "1 lb 90/10 ground beef (or 93/7)", "onlyBuilds": ["beef"] }
]
```

Photos are not in the JSON, the same as the recipe photo today.

Validation, added to `recipeImportSchema`:

- At least one build, keys unique and slug shaped, exactly one default, and the default is `listed`.
- A swap trades a tag the recipe has for one it does not.
- `onlyBuilds` and `skipBuilds` name real keys, and a row does not set both.
- Every build is left with at least one ingredient and one step.

### Keeping builds from turning into variants

The fields are all optional, so a build costs nothing until it differs. The risk is a build that scopes most of the recipe. The editor shows a soft warning when a build skips or adds more than about half the steps or ingredients: "This build differs a lot. Consider a variant." It is a nudge, not a rule.

## Requirements

### Resolving a build

1. One pure function in `src/libs/recipes`, `resolveBuild(recipe, build)`, returns the effective view: title, macros, tags, cost tier, times, the ingredients and steps that apply, and note. The page, the grid card, the book, and the basket all go through it, so a build reads the same everywhere.
2. Recipe loaders return every build with its overrides. `RecipeCard` gains a `builds` list (key, title, macros, tags, cost tier, times, image, listed) so the grid can resolve without another query.

### Recipe page

3. Makeover rows in the nutrition table are buttons in one group, with `aria-pressed` on the selected row. The selected row gets a brand-colored left edge and a tinted background. Traditional rows stay italic and are not selectable. With one makeover row the table looks and behaves as today.
4. A short hint above the table, "Tap a build to switch", shows only when there are two or more makeover rows.
5. Selecting a build updates, without a navigation or a scroll jump: the hero title and photo, macro ratio bar and numbers, cost tier, times, tag chips, ingredient lines, steps, the whole batch row, and the build note under the table. Lines and steps scoped to the build get a small marker so the difference is easy to spot. Other notes do not change.
6. The selection writes `?build=<key>` with a history replace, so back still leaves the page. The default build writes no param. An unknown key falls back to the default without an error, matching how filters treat hand-edited links.
7. The page stays statically generated and revalidated as today. The server renders the default build. A client boundary reads `?build` and swaps the view. Metadata, the canonical URL, and the share image stay on the recipe.
8. "Add to basket" adds the selected build.

### Grid and filters

9. Each recipe still shows one card. The card resolves to one listed build:
   - Drop builds that fail a hiding filter: tags (using the build's effective tags), max calories, and max cost (using the build's tier). Max time uses the build's times. Difficulty is recipe-wide.
   - No build left means the recipe is hidden.
   - With a goal or macro targets set, pick the best fit among the rest, using the same fit then distance ranking the grid already uses. Ties go to the default.
   - Otherwise pick the default if it survived, else the first survivor in table order.
10. Text search matches any build's title too, and resolves to that build: "beef taco" leads with Beef Taco Grillers.
11. The card shows the resolved build's title, photo, macros, and cost, and links to `/recipes/<slug>?build=<key>` (no param for the default). A card showing a non-default build says which in one short line under the title, for example "Rice bowl build".
12. Sorting uses the resolved build's numbers. Facet counts and "unavailable" options use effective tags across listed builds, so the `beef` meat option stays available because of the beef build.
13. Fit badges and PRD 02's "fits my goal" use the resolved build. This replaces PRD 02 requirement 8, which used the default only.

### Basket

14. A basket entry becomes `{ slug, build, batches }`. Builds of one recipe stay mutually exclusive, as PRD 08 already says for alternate builds: adding one replaces the other.
15. Price lines are keyed by recipe and build. A build with no lines of its own uses the recipe's. The bulgogi flank lines (`9a` in `docs/basket-data.json`) move under the bulgogi `flank` build, and the Costco lines (`11a`) under the pollo asado `costco` build. Saved baskets without a build read as the default.

### Authoring and the book

16. The admin editor gets a Builds section replacing the makeover rows of the nutrition editor: macros up front, overrides behind a "Build details" disclosure so simple recipes stay simple. Each ingredient line and step gets a small "Builds" picker (all, only these, all but these), hidden while the recipe has one makeover row.
17. `get_recipe_schema`, `validate_recipe`, and `import_recipe` on the Claude connector follow the schema. `docs/claude-project-knowledge.md` gets the builds versus variants rule.
18. The book keeps one table per recipe and prints the default build's lines and steps. Under the ingredients, each other build with scoped lines or steps gets one short line, written from its note: "**Beef Taco Grillers:** 1 lb 90/10 ground beef in place of the turkey." Build-only steps print inline, labeled with the build. Recipe numbering ignores builds.
19. Macro display follows the site rules everywhere a build shows: C/F/P order, `formatMacroRatios` and `toMacroRatios`, protein given full weight.

## Seed data changes

| Recipe                | Builds                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| Turkey Taco Grillers  | `grillers` (default), `beef` "Beef Taco Grillers", `rice-bowl`, `filling` (unlisted). Split the turkey or beef line in two. Drop the base `beef` tag. |
| Beef Bulgogi          | `ribeye` (default), `flank` with cost tier 3 and a meat swap. Retire the flank variant and redirect its slug to `?build=flank`. |
| Pollo Asado Chicken Thigh Bowl | `skinless` (default), `skin-on`, `costco` with cost tier 3 and shorter times. Marinade lines and step skip `costco`. Split the chicken cook step into one step per build. |
| Greek Yogurt Tuna Melt | `hoagie` (default), `sourdough`, `cold`, `salad` (unlisted).                                              |
| Kickin' Fried Chicken | `plate` (default), `chicken` (unlisted).                                                                   |
| Spicy Turkey Chili    | `loaded` (default), `base`.                                                                                |
| Ham and Prosciutto Sliders | Keys only for its existing rows.                                                                     |

Every other recipe has one makeover row and needs nothing.

## Success metrics

- Share of recipe page visits that switch builds.
- Grid cards that lead with a non-default build, and their click-through against default cards.
- Basket adds of non-default builds.

## Risks and open questions

- **Beef numbers.** Settled: the beef build adds the meat table's 90/10 beef minus turkey difference (+50 calories, -1g carbs, +4g fat, +4g protein) to the griller. The tip and table caption said +30 and 3g, and now match the table.
- **Combinations.** Meat and format multiply (two meats times three formats is six rows). The flat list keeps the table readable and lets the author list only verified builds. If combinations become common, add axes later: each build tagged with an axis value, and the table grouped by axis.
- **Shared links render the default first.** The static page paints the default build, then switches on the client. Check how this Next.js version handles reading search params under a static page (`node_modules/next/dist/docs/`) before building, and keep the swap inside one client boundary so the title and table change together.
- **Costco macros.** Settled from Costco's label (4 oz: 150 calories, under 1g carbs, 7g fat, 22g protein). 6 oz is 225 calories, 10.5g fat, and 33g protein. 6 oz raw skinless thigh with its share of the oil and marinade comes to about 228 calories, 8g fat, and 34g protein. That is within the spread of store-bought thighs, so homemade skinless and Costco share one set of numbers. Costco stays a build for its cost, prep, and steps.
- **Renaming a key.** Lines and steps point at build keys, so renaming one in the editor has to update them in the same save. Validation catches any it misses.
- **Title wins over search?** A search for "turkey" should probably keep leading with the turkey build even when a goal prefers the rice bowl. Proposal: text match on a build title beats fit.

## Tasks

1. Migration: `recipe_builds` with RLS following the parent recipe, makeover rows moved out of `recipe_nutrition`, and `only_builds` and `skip_builds` on `ingredients` and `steps`. Regenerate types and port the Drizzle models.
2. Import schema with the old-shape fallback, validation, `importRecipe`, `diffRecipe`, revisions, and the repository read and write paths, with builds upserted by key.
3. `resolveBuild` and build resolution for the grid, with tests (filters, goals, search, sorting, facets).
4. Recipe page: selectable nutrition table, client build state from `?build`, hero, ingredients, steps, and note following it.
5. Grid card: resolved build, link with the build key, non-default label.
6. Basket: entries with a build, price lines by build, stored basket migration.
7. Admin Builds section, build photos in the photo editor, and the Claude connector.
8. Book output, then the seed data changes, the Pollo Asado split, and the bulgogi variant retirement on the hosted database.
