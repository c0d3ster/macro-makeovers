# Knowledge for the Claude web project

Paste this whole file into the project's knowledge. It tells Claude how to draft a Macro Makeovers
recipe as JSON the site imports without errors. The schema is the source of truth
(`src/validations/RecipeImportValidation.ts`); the connector's `get_recipe_schema` tool returns it.

## The flow

1. Draft and refine the recipe in the project chat.
2. Call `validate_recipe` with the JSON. It writes nothing and returns any field problems.
3. Fix what it reports, then call `import_recipe`. A new slug lands as a **draft** and gets a
   placeholder photo.
4. Review and publish it in the site's admin. Publishing rebuilds the recipe book PDF.

`import_recipe` never overwrites an existing recipe unless asked to. If the slug exists, show the
returned diff and only retry with overwrite once the user agrees.

## Rules for the JSON

- Return one JSON object, nothing else around it.
- `slug` is lowercase words joined by hyphens, like `blackened-chicken-alfredo`.
- `costTier` and `difficulty` are whole numbers from 1 to 5. `servings`, `prepMinutes`, and
  `cookMinutes` are whole numbers.
- `nutrition` is per serving. Include at least one `makeover` row, and one `traditional` row for the
  comparison when there is a fair one. Mark exactly one makeover row `isDefault: true`. Each row has
  `calories`, `carbsG`, `fatG`, and `proteinG`. Do not add whole-batch rows.
- Macros read carbs, fat, protein, in that order. Keep protein prominent in the summary and notes.
- `ingredients` need only `raw` (the line as written). `group` is an optional heading like
  `Sauce`. `quantity`, `unit`, `name`, and `note` are optional and can be filled when they are
  clear.
- `steps` each have a `phase` (`prep` or `cook`) and a `body`. Add `durationMinutes` (fractions
  allowed) only for a timed step.
- `notes` each have a `kind` and a `body`:
  - `make_or_break`: the choices that decide whether the recipe works
  - `fixes`: how to rescue common problems
  - `levers`: swaps and options, with their effect on macros
  - `tip`: a short aside shown under the ingredients
  - `nutrition_intro` and `nutrition_analysis`: text before and after the nutrition table
- `tags` are lowercase words (`oven`, `quick`, `high protein`). Unknown tags are created.
- `variantOf` is the slug of the base recipe when this one is a full variation of it. The base must
  already exist, and a variant cannot itself be a base.
- Bodies and summaries support light markdown (bold, lists, blockquotes). Do not use em dashes.

## Example

```json
{
  "slug": "ham-and-prosciutto-sliders",
  "title": "Ham & Prosciutto Sliders",
  "summary": "Baked sweet-roll sliders, portioned and rebalanced. The rolls and cheese set a floor on the fat here, so this is the treat item of the group rather than a macro workhorse, but at 41g protein per serving it earns its place. Three sliders per serving.",
  "servings": 4,
  "prepMinutes": 5,
  "cookMinutes": 10,
  "costTier": 3,
  "difficulty": 1,
  "nutrition": [
    {
      "kind": "makeover",
      "label": "Per serving (3)",
      "calories": 620,
      "carbsG": 56,
      "fatG": 26,
      "proteinG": 41,
      "isDefault": true
    },
    {
      "kind": "traditional",
      "label": "Traditional per serving (3)",
      "calories": 690,
      "carbsG": 52,
      "fatG": 40,
      "proteinG": 30,
      "isDefault": false
    }
  ],
  "ingredients": [
    { "raw": "12 Hawaiian rolls (1 pack)" },
    { "raw": "18 oz (2 packs) lower sodium honey ham, 1.5 oz per slider" },
    { "raw": "~6 slices prosciutto, half a slice per slider" },
    { "raw": "12 slices sharp aged white cheddar (~4 oz total)" },
    { "raw": "1 avocado" },
    { "group": "Toppings", "raw": "1/2 onion, sliced" },
    { "group": "Toppings", "raw": "1 jalapeño, sliced" }
  ],
  "steps": [
    { "phase": "prep", "body": "Preheat the oven to 375°F." },
    { "phase": "prep", "body": "Slice the onion and jalapeño." },
    {
      "phase": "cook",
      "body": "Layer the ham, prosciutto, cheddar, onion, and jalapeño in the rolls."
    },
    {
      "phase": "cook",
      "body": "Bake **8-10 minutes**, until the cheese melts.",
      "durationMinutes": 10
    }
  ],
  "notes": [
    {
      "kind": "nutrition_analysis",
      "body": "Strong protein, but 26g fat is a third of a 75g day in one meal. Plan a leaner day around it."
    },
    {
      "kind": "make_or_break",
      "body": "**Ham is the base, prosciutto is the accent.** Prosciutto runs about 2x the fat of ham per ounce, so a half slice per slider gives the cured punch without the cost"
    }
  ],
  "tags": ["sandwich", "pork", "oven", "quick", "high protein"]
}
```
