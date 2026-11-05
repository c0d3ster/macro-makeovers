# Builds (proposal)

Status: idea, not built. Written down so it does not get lost.

## Problem

Some recipes have several ways to make them where only an ingredient or two changes. The Chicken Parm Skillet is the clearest case: the chicken, crust, and steps are identical, but pasta goes from none to 3 oz dry per serving and the sauce scales with it. Each version lands on a different calorie and macro profile, and a different eating goal fits each one.

Today there is no good home for this.

## What exists today

- **Nutrition rows.** A recipe has several rows with a label and macros. One makeover row is flagged `isDefault`, and the recipe card and page show that one. Ingredient amounts for the other rows live in free text, for example "Use 2 cups with 1 oz pasta per serving".
- **Variants (`variantOf`).** A separate recipe that points at a base recipe. It has its own ingredients, steps, and nutrition. Recipe cards only list recipes that are not variants, and variants appear on the base recipe's page.

## Why neither fits

- Nutrition rows cannot change the ingredient list, so the page cannot show the right amounts for the chosen row, and the default is one fixed row no matter who is looking.
- Variants would mean four near-identical recipes. Every fix to the steps has to be made four times, and a goal filter has to look through variants, which the card query skips.

Variants are for a genuinely different recipe, such as a different protein or cooking method. A build is the same recipe at a different size or portion mix.

## Proposal

A **build** is a nutrition row plus the ingredient amounts that produce it, plus the goals it fits. A recipe has one or more builds and shares one set of steps and notes.

- The page shows one build at a time, with a switcher.
- The ingredient list rescales to the selected build.
- A goal or day filter picks the matching build as the default. If nothing matches, fall back to the current `isDefault` row.

### Example: Chicken Parm Skillet

| Build | Pasta (dry, per serving) | Sauce (pan) | Calories | Ratio C/F/P |
| --- | --- | --- | --- | --- |
| No pasta | none | 1.5 cups | ~400 | 11 / 38 / 51 |
| 1 oz | 1 oz | 2 cups | ~520 | 26 / 31 / 43 |
| 2 oz | 2 oz | 2.5 cups | ~635 | 35 / 28 / 37 |
| 3 oz | 3 oz | 3 cups | ~755 | 42 / 25 / 33 |

Goals each build fits are still to be decided. One known pairing: a fat loss goal would still fit the 1 oz build.

### Rough data shape

```json
{
  "builds": [
    {
      "label": "With 1 oz dry pasta",
      "goals": ["fat loss"],
      "nutrition": { "calories": 520, "carbsG": 33, "fatG": 18, "proteinG": 55 },
      "ingredients": {
        "marinara": { "quantity": 2, "unit": "cup" },
        "pasta": { "quantity": 4, "unit": "oz" }
      }
    }
  ]
}
```

Builds would override only the ingredients that change. Everything else comes from the recipe's base ingredient list.

## What would change

- **Database:** a migration, either a new builds table or extra columns on the nutrition table for goals and ingredient overrides.
- **Import:** the shared schema in `RecipeImportValidation.ts`, `importRecipe`, and the diff logic.
- **Loaders:** `recipeCards.ts` and `recipeDetail.ts` choose the build for the active filter.
- **UI:** a build switcher on the recipe page and ingredient rescaling.
- **Import connector:** the recipe schema the MCP tools expose.

## Open questions

- Ingredients are mostly free text today (`raw`). Rescaling needs real quantities and units, at least for the ingredients that vary. How much of the existing library needs migrating?
- What are the goals and days? Candidates: fat loss, recomp, maintenance, gain, plus low, moderate, and high carb days.
- Do steps ever differ by build? The Chicken Parm has one pasta-only step ("boil the pasta"), which would need to appear only on builds with pasta.
- Does the filter live on the recipe list, the recipe page, or both?
- Should the existing nutrition rows migrate into builds, or stay as a simpler option for recipes that do not need them?
