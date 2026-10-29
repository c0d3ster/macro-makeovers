import z from 'zod'

const nonNegative = z.number().min(0)
const text = z.string().trim().min(1)
const slug = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase words separated by hyphens'
  )

const nutritionSchema = z.object({
  kind: z.enum(['makeover', 'traditional']),
  label: text,
  isDefault: z.boolean().default(false),
  calories: nonNegative,
  carbsG: nonNegative,
  fatG: nonNegative,
  proteinG: nonNegative,
})

const ingredientSchema = z.object({
  group: text.optional(),
  raw: text,
  quantity: z.number().positive().optional(),
  unit: text.optional(),
  name: text.optional(),
  note: text.optional(),
})

const stepSchema = z.object({
  phase: z.enum(['prep', 'cook']),
  body: text,
  // Minutes, fractions allowed (0.25 is 15 seconds). Feeds per-step timers later.
  durationMinutes: z.number().positive().max(999).optional(),
})

const noteSchema = z.object({
  kind: z.enum(['make_or_break', 'fixes', 'levers', 'tip']),
  body: text,
})

// The one shape every recipe enters the database in. Only `raw` is required on an
// ingredient, so a parsing pass can fill quantity, unit, and name in later.
export const recipeImportSchema = z
  .object({
    slug,
    title: text,
    summary: text,
    servings: z.number().int().positive(),
    prepMinutes: z.number().int().min(0),
    cookMinutes: z.number().int().min(0),
    costTier: z.number().int().min(1).max(4),
    difficulty: z.number().int().min(1).max(5),
    // Slug of the recipe this one is a variant of. The base must already exist.
    variantOf: slug.optional(),
    tags: z.array(z.string().trim().toLowerCase().min(1)),
    nutrition: z.array(nutritionSchema).min(1),
    ingredients: z.array(ingredientSchema).min(1),
    steps: z.array(stepSchema).min(1),
    notes: z.array(noteSchema),
  })
  .superRefine((recipe, ctx) => {
    if (recipe.variantOf === recipe.slug) {
      ctx.addIssue({
        code: 'custom',
        path: ['variantOf'],
        message: 'A recipe cannot be a variant of itself',
      })
    }

    if (!recipe.nutrition.some(({ kind }) => kind === 'makeover')) {
      ctx.addIssue({
        code: 'custom',
        path: ['nutrition'],
        message: 'Add at least one makeover nutrition row',
      })
    }

    const defaults = recipe.nutrition.flatMap(({ isDefault }, index) =>
      isDefault ? [index] : []
    )
    defaults.forEach((index) => {
      const row = recipe.nutrition[index]
      if (row?.kind === 'traditional') {
        ctx.addIssue({
          code: 'custom',
          path: ['nutrition', index, 'isDefault'],
          message: 'The default row must be a makeover, not a traditional one',
        })
      }
    })
    if (defaults.length > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['nutrition', defaults[1] ?? 0, 'isDefault'],
        message: 'Only one nutrition row can be the default',
      })
    }
  })
  .transform((recipe) => {
    const hasDefault = recipe.nutrition.some(({ isDefault }) => isDefault)
    const firstMakeover = recipe.nutrition.findIndex(
      ({ kind }) => kind === 'makeover'
    )

    return {
      ...recipe,
      // Same set of tags in a stable order, so re-imports diff cleanly
      tags: [...new Set(recipe.tags)].sort(),
      // With no default flagged, the first makeover row is the featured build
      nutrition: recipe.nutrition.map((row, index) => ({
        ...row,
        isDefault: hasDefault ? row.isDefault : index === firstMakeover,
      })),
    }
  })

export type RecipeImport = z.infer<typeof recipeImportSchema>
export type RecipeImportInput = z.input<typeof recipeImportSchema>
