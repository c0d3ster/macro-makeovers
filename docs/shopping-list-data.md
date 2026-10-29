# Shopping list data

Groundwork for the shopping list and the Instacart connection. Two files hold
the pricing:

- [`cost-estimates.md`](./cost-estimates.md): the costing write-up (Oct 22,
  2026). Per-serving cost and `$` rating for every recipe, the price book
  (lowest price found per item and where), pantry staples vs specialty buys,
  and a line-by-line breakdown of each recipe.
- [`basket-data.json`](./basket-data.json): the same prices in a structured
  form, taken from the Macro Makeovers Basket page
  (https://claude.ai/artifact/QhpQkQo7NuGLArGtKBTXxj).

## Shape of `basket-data.json`

| Key       | Contents                                                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stores`  | Store codes used by `items[].store`                                                                                                                                |
| `items`   | One per priced product: `pack` label, `packQuantity` in `unit`, `price` for one pack, `store` it was lowest at, `pantry` (staple most kitchens hold), `perishable` |
| `recipes` | `id` and `slug` (matches `content/recipes`), `servings`, `perServingCost`, and `lines`: item `key` to quantity in that item's `unit`                               |

Alternate builds are their own entry with `variantOf` set to the base recipe's
slug, matching the `variant_of` link in the database. `9a` is bulgogi with flank
instead of ribeye, and `11a` is pollo asado with Costco precooked chicken. Their
slugs are the ones those variants will get once they are written up in
`docs/recipes.md`, so they do not match a recipe yet.

## How the basket prices a trip

Worth keeping when the real shopping list is built:

- Quantities from every selected recipe are summed per item, then **rounded up
  to whole packs once**. That is why buying recipes together costs less than
  buying each alone.
- Items sold `per lb` are priced by exact weight, not by pack.
- Prices are the lowest found across stores, so a single-store basket costs
  more than the total. Treat costs as relative.
- Pantry items can be left out of a trip (`pantry: true`).
- `perishable` marks leftovers likely to be wasted (herbs, basil, spinach,
  avocado, mango, deli ham).
- An alternate build and its main build are mutually exclusive in one basket.

## For the Instacart connection

- `unit` and `packQuantity` are what turns recipe quantities into pack counts.
  Instacart will need each item mapped to a product search term. The names
  here include brand where the brand matters (Tillamook, Fage, Heritage,
  Zatarain's and the other brand-locked items listed in the price book). The
  rest default to generic or store brand.
- `walnuts` is in the data but no recipe uses it. It is a leftover from an
  earlier version and can be dropped.
- The `$` tier thresholds: `$` under $3 per serving, `$$` $3 to $4.99, `$$$`
  $5 to $6.99, `$$$$` $7 to $9.99.
