import z from 'zod'

import { basketItemKeySchema } from './RecipeImportValidation'

const STORE_SECTIONS = [
  'produce',
  'meat',
  'dairy',
  'bakery',
  'frozen',
  'pantry',
  'spices',
] as const

const text = z.string().trim().min(1)
const amount = z.number().positive()
const price = z.number().min(0)

const packSizeSchema = z.object({
  pack: text.describe('The larger pack as the shelf labels it, like "32 oz tub"'),
  packQuantity: amount.describe("How much of the item's unit this pack holds"),
  price: price.describe('Lowest price found for this pack'),
})

// One product as it is sold, in the shared price book every recipe's basketLines point at
export const basketItemSchema = z
  .object({
    key: basketItemKeySchema.describe(
      'Stable key recipes use in basketLines, like "chicken_breast". Reuse an existing item when the product is the same.'
    ),
    name: text.describe('Product as the list shows it, brand included when it matters'),
    pack: text.describe(
      'The smallest pack as the shelf labels it, like "16 oz tub", "3 heads", or "per lb" for items sold by weight'
    ),
    packQuantity: amount.describe(
      'How much of unit one pack holds. For "per lb" items, 1 with unit "lb".'
    ),
    unit: text.describe(
      'The unit recipe lines use for this item, like "oz", "lb", "clove", "tsp", or "each"'
    ),
    price: price.describe('Lowest price found for one pack, before tax'),
    section: z.enum(STORE_SECTIONS).describe('Where it sits in the store'),
    pantry: z
      .boolean()
      .default(false)
      .describe('A staple most kitchens already have, like oil and spices'),
    perishable: z
      .boolean()
      .default(false)
      .describe('Spoils fast once opened, so a leftover is likely wasted'),
    priceSource: text
      .optional()
      .describe(
        "Where the price came from, as a store code: W Walmart, K Kroger, H H-E-B, S ShopRite, E Acme, C Costco, T Target, M Martin's shelf, U Martin's receipt, X estimate (shows no store)"
      ),
    isEstimate: z
      .boolean()
      .default(false)
      .describe('True when the price was looked up and not yet checked on a shelf or a receipt'),
    pricedOn: z.iso.date().describe('When the price was found, as YYYY-MM-DD'),
    sizes: z
      .array(packSizeSchema)
      .optional()
      .describe(
        'Larger sizes of the same product. A recipe is priced from the smallest size that covers it, and a trip buys the cheapest mix.'
      ),
  })
  .superRefine((item, ctx) => {
    item.sizes?.forEach((size, index) => {
      if (size.packQuantity <= item.packQuantity) {
        ctx.addIssue({
          code: 'custom',
          path: ['sizes', index, 'packQuantity'],
          message: 'Larger sizes hold more than the pack above',
        })
      }
    })
    const quantities = item.sizes?.map(({ packQuantity }) => packQuantity) ?? []
    quantities.forEach((quantity, index) => {
      if (quantities.indexOf(quantity) !== index) {
        ctx.addIssue({
          code: 'custom',
          path: ['sizes', index, 'packQuantity'],
          message: 'Another size already holds this much',
        })
      }
    })
  })

export const basketItemsSchema = z
  .array(basketItemSchema)
  .min(1)
  .superRefine((items, ctx) => {
    const keys = items.map(({ key }) => key)
    keys.forEach((key, index) => {
      if (keys.indexOf(key) !== index) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'key'],
          message: `"${key}" is listed twice`,
        })
      }
    })
  })

export type BasketItemInput = z.output<typeof basketItemSchema>
