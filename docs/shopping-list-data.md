# Shopping list data

Groundwork for the shopping list and Send to cart. Three files hold the pricing:

- [`cost-estimates.md`](./cost-estimates.md): the costing write-up (Oct 22,
  2026). Per-serving cost and `$` rating for every recipe, the price book
  (lowest price found per item and where), pantry staples vs specialty buys,
  and a line-by-line breakdown of each recipe.
- [`basket-data.json`](./basket-data.json): the same prices in a structured
  form, taken from the Macro Makeovers Basket page
  (https://claude.ai/artifact/QhpQkQo7NuGLArGtKBTXxj).
- `src/libs/basket/basketData.ts`: what the site's basket page (`/basket`)
  reads. It was generated once from `basket-data.json` and is edited by hand
  from there, so it is the copy to change. Its items have a store `section`
  for grouping the list instead of a `store`, and its recipes carry their
  builds (below).

## Shape of `basket-data.json`

| Key             | Contents                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stores`        | Store codes used by `items[].store`                                                                                                                                |
| `items`         | One per priced product: `pack` label, `packQuantity` in `unit`, `price` for one pack, `store` it was lowest at, `pantry` (staple most kitchens hold), `perishable` |
| `items[].sizes` | Optional larger sizes of the same product, each with `pack`, `packQuantity`, `price`, and `store`. The item's own pack is the smallest.                            |
| `recipes`       | `id`, `slug` (matches `content/recipes`), `title`, `servings`, `perServingCost`, and `lines`: item `key` to quantity in that item's `unit`                         |

Alternate builds are their own entry with `variantOf` set to the base recipe's
slug. `9a` is bulgogi with flank instead of ribeye, and `11a` is pollo asado
with Costco precooked chicken. Their slugs don't match a recipe.

## Builds in `basketData.ts`

On the site an alternate is a build of its recipe, not its own recipe. A
recipe's `builds` maps a build key to that build's `perServingCost` and the
`lines` it changes: a quantity replaces the recipe's, and `0` drops the line.
Two builds are priced: the taco grillers' `beef` (3a, 90/10 beef for the
turkey) and the pollo asado's `costco` (11a). A build that isn't listed, like
the enchilada casserole's beef builds, shops like its recipe. The flank
bulgogi (9a) has no lines in the app.

Sides and sauces linked as components, like the corn pico and the mango
habanero salsa, have no basket entry. Their ingredients are priced inside the
dish's lines, so they can't be added to the basket alone.

## How the basket prices a trip

Worth keeping when the real shopping list is built:

- Each basket entry is a recipe, its build, and a serving count. Lines scale
  by servings over the recipe's servings, the way the recipe page's stepper
  does. A basket holds one build per recipe, and adding another build swaps it.
- Quantities from every selected recipe are summed per item, then **rounded up
  to whole packs once**. That is why buying recipes together costs less than
  buying each alone.
- Each recipe's share is priced from the **smallest size that covers what it
  uses**, so 4 oz of cheddar is costed from the 8 oz block. A bigger size wins
  when it costs at most 10% more, so the 16 oz bacon prices the hash brown bake,
  not the 12 oz at 5 cents less. A trip buys the
  **cheapest mix of sizes** for the pooled amount, so the chili and tacos,
  needing 6 oz of cottage cheese between them, buy the 2-cup pack instead of two
  single cups.
- Items sold `per lb` are priced by exact weight, not by pack.
- The page compares the trip against buying each recipe as written, on its own
  trip at its own servings, and shows one saving for both pooling and scaling.
- Prices are the lowest found across stores, so a single-store basket costs
  more than the total. Treat costs as relative.
- Pantry items can be left out of a trip (`pantry: true`).
- `perishable` marks leftovers likely to be wasted, such as fresh herbs,
  spinach, avocado, mango, deli ham and prosciutto, and the Costco pollo asado.

## For Send to cart

- `unit` and `packQuantity` are what turns recipe quantities into pack counts.
  Each grocer will need each item mapped to a product search term. The names
  here include brand where the brand matters (Tillamook, Fage, Heritage,
  Zatarain's and the other brand-locked items listed in the price book). The
  rest default to generic or store brand.
- `walnuts` is in `basket-data.json` but no recipe uses it, and it isn't in
  `basketData.ts`.
- The `$` tier thresholds: `$` under $3 per serving, `$$` $3 to $4.99, `$$$`
  $5 to $6.99, `$$$$` $7 to $9.99, `$$$$$` $10 and up.
