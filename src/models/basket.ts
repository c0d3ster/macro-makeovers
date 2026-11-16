import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { storeSectionEnum } from './enums'
import { recipeBuilds, recipes } from './recipes'

// Basket data (PRD 08). The SQL migration is the source of truth, as for the recipe tables.

// The shared price book: one product as it is sold
export const basketItems = pgTable('basket_items', {
  key: text('key').primaryKey(),
  name: text('name').notNull(),
  pack: text('pack').notNull(),
  packQuantity: numeric('pack_quantity', {
    precision: 10,
    scale: 4,
    mode: 'number',
  }).notNull(),
  unit: text('unit').notNull(),
  price: numeric('price', { precision: 8, scale: 2, mode: 'number' }).notNull(),
  section: storeSectionEnum('section').notNull(),
  pantry: boolean('pantry').notNull().default(false),
  perishable: boolean('perishable').notNull().default(false),
  priceSource: text('price_source'),
  isEstimate: boolean('is_estimate').notNull().default(false),
  pricedOn: date('priced_on', { mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})

// Larger sizes of an item. The item's own pack is the smallest.
export const basketItemSizes = pgTable(
  'basket_item_sizes',
  {
    itemKey: text('item_key')
      .notNull()
      .references(() => basketItems.key, { onDelete: 'cascade' }),
    pack: text('pack').notNull(),
    packQuantity: numeric('pack_quantity', {
      precision: 10,
      scale: 4,
      mode: 'number',
    }).notNull(),
    price: numeric('price', { precision: 8, scale: 2, mode: 'number' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.itemKey, table.packQuantity] })]
)

// What one batch of a recipe buys, in each item's unit
export const recipeBasketLines = pgTable(
  'recipe_basket_lines',
  {
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    itemKey: text('item_key')
      .notNull()
      .references(() => basketItems.key, { onDelete: 'restrict' }),
    quantity: numeric('quantity', {
      precision: 10,
      scale: 4,
      mode: 'number',
    }).notNull(),
    position: integer('position').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.itemKey] }),
    index('recipe_basket_lines_item_idx').on(table.itemKey),
  ]
)

// A build's changes to its recipe's lines. 0 drops a line.
export const recipeBuildBasketLines = pgTable(
  'recipe_build_basket_lines',
  {
    buildId: uuid('build_id')
      .notNull()
      .references(() => recipeBuilds.id, { onDelete: 'cascade' }),
    itemKey: text('item_key')
      .notNull()
      .references(() => basketItems.key, { onDelete: 'restrict' }),
    quantity: numeric('quantity', {
      precision: 10,
      scale: 4,
      mode: 'number',
    }).notNull(),
    position: integer('position').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.buildId, table.itemKey] }),
    index('recipe_build_basket_lines_item_idx').on(table.itemKey),
  ]
)

export const basketItemsRelations = relations(basketItems, ({ many }) => ({
  sizes: many(basketItemSizes),
}))

export const basketItemSizesRelations = relations(
  basketItemSizes,
  ({ one }) => ({
    item: one(basketItems, {
      fields: [basketItemSizes.itemKey],
      references: [basketItems.key],
    }),
  })
)
