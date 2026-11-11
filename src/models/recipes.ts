import type { AnyPgColumn } from 'drizzle-orm/pg-core'

import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import {
  noteKindEnum,
  nutritionKindEnum,
  recipeAccessEnum,
  recipeStatusEnum,
  stepPhaseEnum,
  tagKindEnum,
} from './enums'

// The SQL migrations in supabase/migrations are the source of truth (including RLS, check
// constraints, the updated_at trigger, and the generated `search` tsvector columns, which
// are left out here because Drizzle has no tsvector type). Change them there, run
// `pnpm run db:pull`, and port the result.
//
// Numeric columns use mode 'number' so reads match the import JSON, which has plain numbers.

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  servings: integer('servings').notNull(),
  prepMinutes: integer('prep_minutes').notNull(),
  cookMinutes: integer('cook_minutes').notNull(),
  costTier: smallint('cost_tier').notNull(),
  difficulty: smallint('difficulty').notNull(),
  status: recipeStatusEnum('status').notNull().default('draft'),
  access: recipeAccessEnum('access').notNull().default('free'),
  imageUrl: text('image_url'),
  // True when imageUrl is an AI-generated stand-in rather than a real photo
  imageIsPlaceholder: boolean('image_is_placeholder').notNull().default(false),
  // The base recipe when this one is a variant. One level deep, enforced on import.
  variantOf: uuid('variant_of').references((): AnyPgColumn => recipes.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  // Kept current by the recipes_set_updated_at trigger
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})

export const recipeNutrition = pgTable(
  'recipe_nutrition',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    // Traditional comparison rows only. Makeover macros live on recipe_builds.
    kind: nutritionKindEnum('kind').notNull(),
    label: text('label').notNull(),
    calories: numeric('calories', {
      precision: 7,
      scale: 1,
      mode: 'number',
    }).notNull(),
    carbsG: numeric('carbs_g', {
      precision: 6,
      scale: 1,
      mode: 'number',
    }).notNull(),
    fatG: numeric('fat_g', {
      precision: 6,
      scale: 1,
      mode: 'number',
    }).notNull(),
    proteinG: numeric('protein_g', {
      precision: 6,
      scale: 1,
      mode: 'number',
    }).notNull(),
    // Rows keep the order they were imported in
    position: integer('position').notNull().default(0),
  },
  (table) => [index('recipe_nutrition_recipe_idx').on(table.recipeId)]
)

// One version of a recipe that shares its method. Overrides are null to fall back to the recipe.
export const recipeBuilds = pgTable(
  'recipe_builds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    // URL key, unique per recipe. Lines, steps, and notes point at builds by key.
    key: text('key').notNull(),
    label: text('label').notNull(),
    position: integer('position').notNull().default(0),
    isDefault: boolean('is_default').notNull().default(false),
    // False for components like "Filling only": selectable on the page, never leads a card
    listed: boolean('listed').notNull().default(true),
    calories: numeric('calories', {
      precision: 7,
      scale: 1,
      mode: 'number',
    }).notNull(),
    carbsG: numeric('carbs_g', {
      precision: 6,
      scale: 1,
      mode: 'number',
    }).notNull(),
    fatG: numeric('fat_g', {
      precision: 6,
      scale: 1,
      mode: 'number',
    }).notNull(),
    proteinG: numeric('protein_g', {
      precision: 6,
      scale: 1,
      mode: 'number',
    }).notNull(),
    // Tag swaps like { turkey: 'beef' }. The title's word swaps with the tag.
    swap: jsonb('swap').$type<Record<string, string>>().notNull().default({}),
    // Only when the swapped title is not the wording wanted
    title: text('title'),
    noteMd: text('note_md'),
    costTier: smallint('cost_tier'),
    difficulty: smallint('difficulty'),
    prepMinutes: integer('prep_minutes'),
    cookMinutes: integer('cook_minutes'),
    imageUrl: text('image_url'),
    imageIsPlaceholder: boolean('image_is_placeholder')
      .notNull()
      .default(false),
  },
  (table) => [
    uniqueIndex('recipe_builds_recipe_id_key_key').on(table.recipeId, table.key),
    index('recipe_builds_recipe_idx').on(table.recipeId, table.position),
  ]
)

export const ingredients = pgTable(
  'ingredients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    groupName: text('group_name'),
    position: integer('position').notNull(),
    rawText: text('raw_text').notNull(),
    quantity: numeric('quantity', { mode: 'number' }),
    unit: text('unit'),
    name: text('name'),
    note: text('note'),
    category: text('category'),
    // Build keys this row belongs to, or skips. Empty on both means every build.
    onlyBuilds: text('only_builds').array().notNull().default([]),
    skipBuilds: text('skip_builds').array().notNull().default([]),
  },
  (table) => [
    index('ingredients_recipe_idx').on(table.recipeId, table.position),
  ]
)

export const steps = pgTable(
  'steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    phase: stepPhaseEnum('phase').notNull(),
    position: integer('position').notNull(),
    bodyMd: text('body_md').notNull(),
    durationMinutes: numeric('duration_minutes', {
      precision: 5,
      scale: 2,
      mode: 'number',
    }),
    // Build keys this row belongs to, or skips. Empty on both means every build.
    onlyBuilds: text('only_builds').array().notNull().default([]),
    skipBuilds: text('skip_builds').array().notNull().default([]),
  },
  (table) => [index('steps_recipe_idx').on(table.recipeId, table.position)]
)

export const recipeNotes = pgTable(
  'recipe_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    kind: noteKindEnum('kind').notNull(),
    position: integer('position').notNull(),
    bodyMd: text('body_md').notNull(),
    // Build keys this row belongs to, or skips. Empty on both means every build.
    onlyBuilds: text('only_builds').array().notNull().default([]),
    skipBuilds: text('skip_builds').array().notNull().default([]),
  },
  (table) => [
    index('recipe_notes_recipe_idx').on(table.recipeId, table.position),
  ]
)

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  kind: tagKindEnum('kind').notNull(),
})

export const recipeTags = pgTable(
  'recipe_tags',
  {
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.tagId, table.recipeId] }),
    index('recipe_tags_tag_idx').on(table.tagId),
  ]
)

// One row per import or save, in the same shape as the import JSON
export const recipeRevisions = pgTable(
  'recipe_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    snapshot: jsonb('snapshot').notNull(),
    // auth.users.id of whoever imported it. The FK to the auth schema is enforced in SQL.
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('recipe_revisions_recipe_idx').on(table.recipeId, table.createdAt),
  ]
)

// Relations power db.query reads, which load a recipe with its children in one call.
// They live only in Drizzle: the foreign keys themselves are in the SQL migrations.
export const recipesRelations = relations(recipes, ({ one, many }) => ({
  // A variant points at its base, and a base lists its variants
  base: one(recipes, {
    fields: [recipes.variantOf],
    references: [recipes.id],
    relationName: 'variants',
  }),
  variants: many(recipes, { relationName: 'variants' }),
  builds: many(recipeBuilds),
  nutrition: many(recipeNutrition),
  ingredients: many(ingredients),
  steps: many(steps),
  notes: many(recipeNotes),
  recipeTags: many(recipeTags),
}))

export const recipeNutritionRelations = relations(
  recipeNutrition,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeNutrition.recipeId],
      references: [recipes.id],
    }),
  })
)

export const recipeBuildsRelations = relations(recipeBuilds, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeBuilds.recipeId],
    references: [recipes.id],
  }),
}))

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [ingredients.recipeId],
    references: [recipes.id],
  }),
}))

export const stepsRelations = relations(steps, ({ one }) => ({
  recipe: one(recipes, { fields: [steps.recipeId], references: [recipes.id] }),
}))

export const recipeNotesRelations = relations(recipeNotes, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeNotes.recipeId],
    references: [recipes.id],
  }),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  recipeTags: many(recipeTags),
}))

export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeTags.recipeId],
    references: [recipes.id],
  }),
  tag: one(tags, { fields: [recipeTags.tagId], references: [tags.id] }),
}))
