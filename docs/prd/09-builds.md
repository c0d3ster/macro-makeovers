# PRD 09: Builds (free)

**Status:** Shipped in #57, #58, #59, #64, and #65. Each requirement and task below is marked **Done**, **Changed** (shipped differently, and the text now matches the code), or **Open**. Every build that shops differently has basket lines.

## Problem

Most recipes already come in more than one build: Turkey Taco Grillers as grillers, a rice bowl, or filling only, and with turkey or 90/10 beef. Before this PRD those builds were just rows in the nutrition table. The site always led with the default row, so:

- Filters and goal matching only ever saw the default. A fat loss visitor never found the Taco Grillers rice bowl, and a `meat=beef` filter found the turkey recipe only because the base carried both tags.
- The page title, tags, cost, and ingredients could not follow the build. Cooking with beef still read "Turkey Taco Grillers".
- Swapping one ingredient (flank for ribeye in bulgogi) forced a full variant: a second copy of every ingredient, step, and note that then drifts.

## Goal

A build is a lightweight alternate version of a recipe that shares its method. People click or tap a row in the nutrition table to switch builds, and the page (title, summary, macros, tags, cost, ingredients, steps, basket) follows. Browse and filtering pick the build that fits, so each recipe competes on its best build, not only its default.

## Builds versus variants

|                         | Build                                                  | Variant                                     |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------- |
| What it is              | A row in `recipe_builds`, with optional overrides       | A full recipe linked with `variantOf`       |
| Steps and notes         | Shared, and a step or note can be limited to some builds | Its own                                   |
| Ingredients             | Shared, and a line can be limited to some builds       | Its own                                     |
| Page                    | Same page, `?build=<key>`                              | Its own page and slug                       |
| Grid                    | One card per recipe, showing the build that fits       | Its own card                                |
| Example                 | Lean Beef Taco Grillers, Taco rice bowl, Costco pollo asado, beef chuck enchilada casserole | Southwest Sausage Hash Brown Bake |

Rule of thumb: if it is the same dish cooked the same way, with some lines or steps added, dropped, or swapped, it is a build. If it is a different dish with its own method, it is a variant. Pollo Asado with Costco precooked chicken skips the marinade step and its ingredients and sears the chicken briefly, so it is a build. Bulgogi with flank steak only swaps the meat, so it is a build too. The Southwest Sausage Hash Brown Bake changes the flavor profile and most of the add-ins, so it stays a variant. The rule is also in `docs/claude-project-knowledge.md`.

## Scope

**In**

- A `recipe_builds` table: each build has its own macros and a URL key, plus optional title, tag swaps, cost tier, difficulty, times, course, note, and photo, and whether it can lead a card.
- Ingredient lines, steps, notes, and component links that belong to some builds only, or that some builds skip.
- Recipe page: build rows in the nutrition table are selectable. The selection drives the hero title, summary, photo, macro bar, cost, tags, ingredients, components, steps, whole batch row, and "Add to basket".
- `?build=<key>` on recipe URLs, so a build can be linked and shared.
- Grid, filters, sorting, and goal matching resolve one build per recipe.
- Import schema, admin editor, Claude connector, and the book all carry builds.
- Turn the inline Costco option in Pollo Asado into its own build (done). Convert the flank steak bulgogi option into a build (done).

**Out**

- Per-build edits to a step's text. A build gets its own step instead, scoped to it.
- Build axes (meat times format, picked separately). Builds are a flat list the author curates. See open questions.
- A personal "my default build" setting. Later, with PRD 02.
- Separate pages, metadata, or share images per build. The canonical page stays the recipe.

## Data

A build has grown past a nutrition row: it has its own macros, title, times, tags, picture, and scoped lines and steps. So it gets its own table, and `recipe_nutrition` holds only the traditional comparison rows. Every override is nullable and falls back to the recipe, so a build stores only what differs.

### `recipe_builds`

| Column                         | Type             | Notes                                                                                                          |
| ------------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `id`                           | uuid             | Primary key.                                                                                                   |
| `recipe_id`                    | uuid             | The recipe, cascade on delete.                                                                                 |
| `key`                          | text             | URL key, unique per recipe and slug shaped. Defaults to a kebab of the label on import. `grillers`, `beef`, `costco`. |
| `label`                        | text             | The nutrition table row. "Lean beef grillers".                                                                 |
| `position`                     | int              | Table order.                                                                                                   |
| `is_default`                   | boolean          | At most one per recipe, held by a partial unique index. Import checks there is exactly one.                    |
| `listed`                       | boolean          | Default true. False for parts like "Filling only": selectable on the page, never chosen to lead a card.       |
| `calories`, `carbs_g`, `fat_g`, `protein_g` | numeric | Required. Every build has its own macros.                                                               |
| `swap`                         | jsonb            | Tag swaps, like `{"turkey": "beef"}`. The build's tags trade them, and its title and summary swap the matching word, so "Turkey Taco Grillers" reads "Beef Taco Grillers". Notes, steps, and lines are never swapped: comparisons like "93/7 turkey is cheaper than 93/7 beef" would break. |
| `title`                        | text, nullable   | Only when the swapped title is not the wording wanted, like "Lean Beef Taco Grillers".                        |
| `difficulty`                   | smallint, nullable | 1 to 5. Costco pollo asado is easier than marinating thighs.                                                 |
| `note_md`                      | text, nullable   | One or two lines on what changes, shown under the table.                                                       |
| `cost_tier`                    | smallint, nullable | 1 to 5. Costco pollo asado is 3.                                                                             |
| `prep_minutes`, `cook_minutes` | int, nullable    | Costco pollo asado drops the marinade prep. The enchilada beef builds braise longer.                           |
| `course`                       | `recipe_course`, nullable | Added in #64. Only when the build is a different course, like a side salad whose chicken build is a main. |
| `image_url`                    | text, nullable   | The build's own photo. Null uses the recipe photo.                                                             |
| `image_is_placeholder`         | boolean          | Same meaning as on `recipes`.                                                                                  |

The recipe row keeps everything shared: slug, summary, servings, status, access, the recipe photo, and the recipe-level title, times, cost, difficulty, course, and tags that the default build inherits. The default build normally sets no overrides at all.

### Scoped lines and steps

`ingredients`, `steps`, `recipe_notes`, and `recipe_components` each have `only_builds` and `skip_builds`, text[] of build keys, both default empty. Notes include the nutrition intro and analysis, which often differ per build. Empty on both means every build. A row sets one or the other, never both (check constraint).

- **Swap a line:** the turkey line skips `beef`, and a beef line is only for `beef`.
- **Drop lines and a step:** the marinade lines and the marinade step skip `costco`.
- **Add a step:** the Costco sear is its own step, only for `costco`. Skinless and skin-on get their own cook steps the same way.

Steps are never edited per build, only included or left out. That keeps every step's text in one place and keeps the book readable.

Keys, not build ids, because saving a recipe deletes and reinserts its ingredients and steps, and keys are what the import JSON and the URL already use. Validation checks every key names a real build.

### Courses and components

Added in #64 (migration `20261113000000_add_courses_and_components.sql`). Courses and components have no PRD of their own. What touches builds:

- A recipe has a `course` (`breakfast`, `appetizer`, `main`, `side`, `sauce`, default `main`), and a build can override it. The main grid, filters, and goal matching show only breakfast, appetizer, and main builds. Sides and sauces get their own compact section (`cardsForCourses` in `src/libs/recipes/recipeCourses.ts`), so one recipe can show in both.
- `recipe_components` links a dish to a side or sauce it uses, with an amount, servings per dish serving, and an optional component build. Its scope columns say which of the dish's builds use it, so one component can be linked twice at different amounts (pico on the grillers and on the rice bowl). Components are one level deep, checked on import.
- The dish's build macros already include the component.

### Saving

Ingredients, steps, notes, nutrition, and components keep the delete and reinsert. Builds are upserted by `(recipe_id, key)` instead, so a build keeps its id and its photo across edits. A build whose key is gone from the save is deleted, and its photo goes with it. Renaming a key in the editor rewrites the matching `only_builds` and `skip_builds` entries in the form when the key field loses focus, and carries the build's preview and photo with it, so the save sends lines that already point at the new key. Revisions snapshot builds with the rest of the recipe.

### Pictures

- The hero and the grid card show the resolved build's photo, else the recipe photo. The basket shows no photos.
- The share image and page metadata stay on the recipe photo.
- The admin photo editor can set or clear a photo per saved build. Placeholder generation for a build prompts from its title and note, and a build without a photo is fine.

### Migration

Done in two steps. `20261111000000_create_recipe_builds.sql` (#57) copied each makeover `recipe_nutrition` row into `recipe_builds` with its macros, label, position, and default flag, and a key from its label. `20261112000000_drop_makeover_nutrition.sql` (#58) then deleted the makeover rows and dropped `is_default` and its index from `recipe_nutrition`. The `kind` column stays, with only `traditional` rows left.

### Import JSON

A top-level `builds` array, with `nutrition` keeping the traditional rows. Old JSON with makeover rows in `nutrition` still imports: the schema turns them into builds, so older files and stored revisions keep working. Setting `builds` and makeover rows together is an error.

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

Photos are not in the JSON, the same as the recipe photo.

Validation, in `recipeImportSchema` (`src/validations/RecipeImportValidation.ts`):

- At least one build, keys unique and slug shaped, exactly one default, and the default is `listed`.
- A swap trades a tag the recipe has for one it does not.
- `onlyBuilds` and `skipBuilds` name real keys, and a row does not set both. This covers ingredients, steps, notes, and components.
- A component is not the recipe itself, and is listed at most once for any one build.
- Every build is left with at least one ingredient and one step.

### Keeping builds from turning into variants

The fields are all optional, so a build costs nothing until it differs. The risk is a build that scopes most of the recipe. The editor shows a soft warning when a build skips or adds more than about half the steps or ingredients: "This build differs a lot from the featured one. Consider a variant." It is a nudge, not a rule.

## Requirements

### Resolving a build

1. **Changed.** `resolveBuild(recipe, build)` in `src/libs/recipes/recipeBuilds.ts` returns the build's title, summary, photo, cost tier, difficulty, times, course, and tags. `toRecipeView` in `recipeDetail.ts` adds the ingredients, steps, notes, components, and nutrition paragraphs that apply. The page and the grid card go through them. The book uses `buildTitle` and `appliesToBuild` from the same file, and the basket looks up price changes by build key.
2. **Done.** Recipe loaders return every build with its overrides. `RecipeCard` has a `builds` list (key, label, title, summary, macros, tags, cost tier, difficulty, times, course, image, listed) so the grid can resolve without another query.

### Recipe page

3. **Done.** With two or more builds, each build row in the nutrition table is a button, with `aria-pressed` on the selected row. The selected row gets a brand-colored left edge and a tinted background. Traditional rows stay italic and are not selectable. With one build the table is plain.
4. **Changed.** A short hint beside the Nutrition heading shows only with two or more builds. It reads "Click a build to switch" with a mouse or trackpad and "Tap a build to switch" on touch screens.
5. **Changed.** Selecting a build updates, without a navigation or a scroll jump: the hero title, summary, and photo, macro ratio bar and numbers, cost tier, difficulty, times, tag chips, ingredient lines, components, steps, the whole batch row, the build note under the table, and any nutrition paragraphs and notes scoped to builds. Unscoped notes do not change. Scoped lines and steps get no marker: it was tried and dropped in #65.
6. **Done.** The selection writes `?build=<key>` with a history replace, so back still leaves the page. The default build writes no param. An unknown key falls back to the default without an error, matching how filters treat hand-edited links.
7. **Done.** The page stays statically generated and revalidated. The server renders the default build. With two or more builds, a client boundary inside a `Suspense` reads `?build` and swaps the view, with the default build as its fallback. Metadata, the canonical URL, and the share image stay on the recipe.
8. **Done.** "Add to basket" adds the selected build, at the servings the stepper shows.

### Grid and filters

9. **Changed.** Each recipe still shows one card. The card resolves to one build that can lead: a listed build, or the default.
   - Only builds in a dish course (breakfast, appetizer, main) are in the main grid. Sides and sauces have their own section.
   - Drop builds that fail a hiding filter: tags (using the build's effective tags), search text, max calories, max time, max cost, and max difficulty, all using the build's own values.
   - No build left means the recipe is hidden.
   - Among the rest, a build whose title matches the search wins, then (with a goal or macro targets set) the best fit, using the same fit then distance ranking the grid uses. Ties go to the default, then table order.
10. **Done.** Text search matches each build's title, summary, and tags, and ingredient lines that apply to that build, and resolves to the matching build: "beef taco" leads with Lean Beef Taco Grillers.
11. **Changed.** The card shows the resolved build's title, photo, macros, and cost, and links to `/recipes/<slug>?build=<key>` (no param for the default). A card showing a non-default build says which in one short line under the title: "Build: Rice bowl (3/4 cup)".
12. **Done.** Sorting uses the resolved build's numbers. Facet counts and "unavailable" options use effective tags across listed builds, so the `beef` meat option stays available because of the beef build.
13. **Done.** Fit badges use the resolved build. PRD 02's "fits my goal" should do the same. This replaces PRD 02 requirement 8, which used the default only.

### Basket

14. **Changed.** A basket entry is `{ slug, build?, servings }`, with no build meaning the default. Servings replaced the batch count in #57. Builds of one recipe stay mutually exclusive: adding one replaces the other.
15. **Changed.** Price data lives in `src/libs/basket/basketData.ts`. A recipe's entry can carry a `builds` map: per build, a cost per serving and changes to the recipe's lines by item key, where 0 drops a line (#59). A build with no entry shops like the recipe. Priced: the Taco Grillers `beef`, `rice-bowl`, and `filling` builds, the Pollo Asado `costco` build, the bulgogi `flank` build, and the enchilada `beef-eye-of-round` and `beef-chuck` builds. Saved baskets without a build read as the default.

### Authoring and the book

16. **Changed.** Builds are edited in the nutrition editor (`RecipeNutritionEditor`), in place of the old makeover rows: macros up front, overrides behind a "Build details" disclosure so simple recipes stay simple. The hero editor previews a chosen build, fading the lines and steps it does not have. Each ingredient line, step, note, and component gets a "Builds" picker (Every build, Only these, All but these), hidden while the recipe has one build.
17. **Done.** `get_recipe_schema`, `get_recipe`, `validate_recipe`, and `import_recipe` on the Claude connector (`src/libs/mcp/recipeMcpServer.ts`) follow the schema. `get_recipe` returns a saved recipe in import shape, builds included, so edits start from what the hosted database holds. `docs/claude-project-knowledge.md` has the builds versus variants rule.
18. **Changed.** The book (`src/libs/recipes/bookMarkdown.ts`) keeps one table per recipe, with a row per build. It prints every line and step, and labels a scoped one with build labels: "_(Lean beef grillers only)_" or "_(skip for Costco precooked)_". Under the table, each build with a note gets one line, named by its title when that differs from the recipe's, else its label: "**Lean Beef Taco Grillers:** 90/10 ground beef in place of the turkey." A side or sauce a dish uses prints inside that dish, not as its own entry. Recipe numbering ignores builds.
19. **Done.** Macro display follows the site rules everywhere a build shows: C/F/P order, `formatMacroRatios` and `toMacroRatios`, protein given full weight.

## Seed data changes

As seeded in `content/recipes`. The hosted database is the source of truth and may have moved on.

| Recipe                | Builds                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| Turkey Taco Grillers  | **Done.** `grillers` (default), `beef` "Lean Beef Taco Grillers", `rice-bowl`, `filling` (unlisted). The turkey and beef lines are split, and the base has no `beef` tag. The corn pico is a component, linked twice at different amounts. |
| Beef Bulgogi          | **Done.** `per-serving` (default, "Ribeye strips (Heritage)") and `flank` with cost tier 3, difficulty 3, and a longer prep. The meat line is split, and the trim-and-slice step and flank notes are only for `flank`. No swap, since both builds are beef. |
| Pollo Asado Chicken Thigh Bowl | **Done.** `skinless` (default), `costco` with cost tier 3 and a shorter prep, `skin-on`. Marinade lines and step skip `costco`. The mango habanero salsa is a component. |
| Greek Yogurt Tuna Melt | **Done.** `melt-on-hoagie-roll-default` (default), `melt-on-sourdough`, `cold-sandwich-whole-wheat`, `salad-only-1-serving` (unlisted). Each sandwich build has its own bread line and broil step. |
| Kickin' Fried Chicken | **Done.** `plate-chicken-sides-ranch` (default), `chicken-only` (listed). Sides are only on the plate. |
| Spicy Turkey Chili    | **Done.** `fully-loaded` (default), `base-only`. Fully loaded lists its toppings.                         |
| Ham and Prosciutto Sliders | **Done.** `classic` (default), `leaner`.                                                              |
| Red Enchilada Casserole | **Done** (#65). `chicken` (default), `beef-eye-of-round`, `beef-chuck`, each beef build with a chicken to beef swap, its own meat line, braise steps, and cook time. |

Every other recipe has one build. Build keys follow the hosted database, so photos and links stay attached.

## Success metrics

- Share of recipe page visits that switch builds.
- Grid cards that lead with a non-default build, and their click-through against default cards.
- Basket adds of non-default builds.

## Risks and open questions

- **Beef numbers.** Settled: the beef build adds the meat table's 90/10 beef minus turkey difference (+50 calories, -1g carbs, +4g fat, +4g protein) to the griller. The tip and table caption said +30 and 3g, and now match the table.
- **Combinations.** Meat and format multiply (two meats times three formats is six rows). The flat list keeps the table readable and lets the author list only verified builds. If combinations become common, add axes later: each build tagged with an axis value, and the table grouped by axis.
- **Shared links render the default first.** Settled: the static page paints the default build as the `Suspense` fallback, then the switcher reads `?build` on the client. The title and table change together because the whole body sits in one client boundary.
- **Costco macros.** Settled from Costco's label (4 oz: 150 calories, under 1g carbs, 7g fat, 22g protein). 6 oz is 225 calories, 10.5g fat, and 33g protein. 6 oz raw skinless thigh with its share of the oil and marinade comes to about 228 calories, 8g fat, and 34g protein. That is within the spread of store-bought thighs, so homemade skinless and Costco share one set of numbers. Costco stays a build for its cost, prep, and steps.
- **Renaming a key.** Lines and steps point at build keys, so the editor rewrites them on rename. Validation catches any it misses.
- **Title wins over search?** Settled: a build whose title matches the search beats fit, both when picking a recipe's build and when ranking cards.
- **Builds without price lines.** A build with no basket entry shops like the recipe, so a new build that buys something different needs lines in `basketData.ts`, or its trip cost is off.

## Tasks

1. **Done.** Migration: `recipe_builds` with RLS following the parent recipe, makeover rows moved out of `recipe_nutrition`, and `only_builds` and `skip_builds` on `ingredients`, `steps`, and `recipe_notes`. Types regenerated and Drizzle models ported. Makeover rows and `is_default` dropped in #58.
2. **Done.** Import schema with the old-shape fallback, validation, `importRecipe`, `diffRecipe`, revisions, and the repository read and write paths, with builds upserted by key.
3. **Done.** `resolveBuild` and build resolution for the grid, with tests (filters, goals, search, sorting, facets).
4. **Done.** Recipe page: selectable nutrition table, client build state from `?build`, hero, ingredients, steps, and note following it.
5. **Done.** Grid card: resolved build, link with the build key, non-default label.
6. **Done.** Basket: entries with a build, price lines by build (#59), stored baskets without a build read as the default.
7. **Done.** Admin build editor, build photos in the photo editor, and the Claude connector.
8. **Mostly done.** Book output, the seed data changes, and the Pollo Asado split. The bulgogi flank build is on the hosted database too.
