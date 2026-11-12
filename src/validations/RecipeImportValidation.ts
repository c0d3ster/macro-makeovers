import z from 'zod'

import { appliesToBuild } from '@/libs/recipes/recipeBuilds'

const nonNegative = z.number().min(0)
const text = z.string().trim().min(1)
const tagName = z.string().trim().toLowerCase().min(1)
const tier = z.number().int().min(1).max(5)
const minutes = z.number().int().min(0)
export const recipeSlugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase words separated by hyphens'
  )
const buildKeySchema = recipeSlugSchema

const macroFields = {
  calories: nonNegative,
  carbsG: nonNegative,
  fatG: nonNegative,
  proteinG: nonNegative,
}

// Traditional rows are the comparison under the table. Makeover rows are the old way to write
// builds and are still accepted, so older JSON and stored revisions keep importing.
const nutritionSchema = z.object({
  kind: z.enum(['makeover', 'traditional']).default('traditional'),
  label: text,
  // Only read on old makeover rows, where it marks the default build
  isDefault: z.boolean().optional(),
  ...macroFields,
})

const buildSchema = z.object({
  key: buildKeySchema
    .optional()
    .describe(
      'URL key, unique in the recipe. Ingredients, steps, and notes point at builds by key. Made from the label when missing.'
    ),
  label: text.describe('The nutrition table row, e.g. "Grillers (2 per serving)"'),
  isDefault: z
    .boolean()
    .default(false)
    .describe('The build the page and the grid lead with. First build when none is set.'),
  listed: z
    .boolean()
    .default(true)
    .describe(
      'False for a component like "Filling only": selectable on the page, never leads a card'
    ),
  ...macroFields,
  swap: z
    .record(tagName, tagName)
    .optional()
    .describe(
      'Tags this build trades, like {"turkey": "beef"}. The recipe tag is dropped for the new one, and the word in the title and summary swaps with it, so "Turkey Taco Grillers" reads "Beef Taco Grillers".'
    ),
  title: text
    .optional()
    .describe(
      'Only when the swapped title is not the wording wanted, like "Lean Beef Taco Grillers". Falls back to the recipe title with the swap applied.'
    ),
  note: text.optional().describe('One or two lines on what this build changes'),
  costTier: tier.optional(),
  difficulty: tier.optional(),
  prepMinutes: minutes.optional(),
  cookMinutes: minutes.optional(),
})

// Which builds a row belongs to. Leave both out for every build, and never set both.
const buildScope = {
  onlyBuilds: z
    .array(buildKeySchema)
    .optional()
    .describe('Show only for these build keys'),
  skipBuilds: z
    .array(buildKeySchema)
    .optional()
    .describe('Hide for these build keys'),
}

const ingredientSchema = z.object({
  group: text.optional(),
  raw: text,
  quantity: z.number().positive().optional(),
  unit: text.optional(),
  name: text.optional(),
  note: text.optional(),
  ...buildScope,
})

const stepSchema = z.object({
  phase: z.enum(['prep', 'cook']),
  body: text,
  // Minutes, fractions allowed (0.25 is 15 seconds). Feeds per-step timers later.
  durationMinutes: z.number().positive().max(999).optional(),
  ...buildScope,
})

const noteSchema = z.object({
  kind: z.enum([
    'make_or_break',
    'fixes',
    'levers',
    'tip',
    'nutrition_intro',
    'nutrition_analysis',
  ]),
  body: text,
  ...buildScope,
})

type BuildInput = z.output<typeof buildSchema>
type Scoped = { onlyBuilds?: string[]; skipBuilds?: string[] }

// "Grillers (2 per serving)" becomes "grillers-2-per-serving"
const toBuildKey = (label: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'build'

// Keys made from labels get a number when two would collide
const withKeys = (builds: BuildInput[]): (BuildInput & { key: string })[] => {
  const taken = new Set(builds.flatMap(({ key }) => (key ? [key] : [])))
  return builds.map((build) => {
    if (build.key) return { ...build, key: build.key }
    const base = toBuildKey(build.label)
    const key =
      [base, ...Array.from({ length: builds.length }, (_, i) => `${base}-${i + 2}`)].find(
        (candidate) => !taken.has(candidate)
      ) ?? base
    taken.add(key)
    return { ...build, key }
  })
}

const sortedUnique = (values: string[] | undefined): string[] | undefined =>
  values && values.length > 0 ? [...new Set(values)].sort() : undefined

// Empty scope lists mean every build, so they are left out and re-imports diff cleanly
const normalizeScope = <T extends Scoped>({
  onlyBuilds,
  skipBuilds,
  ...row
}: T): Omit<T, keyof Scoped> & Scoped => ({
  ...row,
  ...(onlyBuilds?.length ? { onlyBuilds: sortedUnique(onlyBuilds) } : {}),
  ...(skipBuilds?.length ? { skipBuilds: sortedUnique(skipBuilds) } : {}),
})

// The one shape every recipe enters the database in. Only `raw` is required on an
// ingredient, so a parsing pass can fill quantity, unit, and name in later.
export const recipeImportSchema = z
  .object({
    slug: recipeSlugSchema,
    title: text,
    summary: text,
    servings: z.number().int().positive(),
    prepMinutes: minutes,
    cookMinutes: minutes,
    costTier: tier,
    difficulty: tier,
    // Slug of the recipe this one is a variant of. The base must already exist.
    variantOf: recipeSlugSchema.optional(),
    tags: z.array(tagName),
    // Versions of this recipe that share its method. Required unless nutrition has makeover rows.
    builds: z.array(buildSchema).optional(),
    nutrition: z.array(nutritionSchema).default([]),
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

    const makeoverRows = recipe.nutrition.flatMap((row, index) =>
      row.kind === 'makeover' ? [index] : []
    )
    if (recipe.builds && makeoverRows.length > 0) {
      makeoverRows.forEach((index) =>
        ctx.addIssue({
          code: 'custom',
          path: ['nutrition', index, 'kind'],
          message: 'With builds set, makeover rows go in builds',
        })
      )
    }
    if (!recipe.builds?.length && makeoverRows.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['builds'],
        message: 'Add at least one build',
      })
    }
  })
  .transform(({ builds: buildInput, nutrition, ...recipe }) => {
    // Old makeover rows become builds, in table order
    const asBuilds: BuildInput[] =
      buildInput ??
      nutrition
        .filter(({ kind }) => kind === 'makeover')
        .map(({ label, isDefault, calories, carbsG, fatG, proteinG }) => ({
          label,
          isDefault: isDefault ?? false,
          listed: true,
          calories,
          carbsG,
          fatG,
          proteinG,
        }))
    const keyed = withKeys(asBuilds)
    const hasDefault = keyed.some(({ isDefault }) => isDefault)

    return {
      ...recipe,
      // Same set of tags in a stable order, so re-imports diff cleanly
      tags: [...new Set(recipe.tags)].sort(),
      builds: keyed.map(({ swap, ...build }, index) => ({
        ...build,
        // With no default flagged, the first build is the featured one
        isDefault: hasDefault ? build.isDefault : index === 0,
        // An empty swap is the same as none, so it is left out and re-imports diff cleanly
        ...(swap && Object.keys(swap).length > 0 ? { swap } : {}),
      })),
      nutrition: nutrition
        .filter(({ kind }) => kind === 'traditional')
        .map(({ label, calories, carbsG, fatG, proteinG }) => ({
          kind: 'traditional' as const,
          label,
          calories,
          carbsG,
          fatG,
          proteinG,
        })),
      ingredients: recipe.ingredients.map(normalizeScope),
      steps: recipe.steps.map(normalizeScope),
      notes: recipe.notes.map(normalizeScope),
    }
  })
  .superRefine((recipe, ctx) => {
    const keys = recipe.builds.map(({ key }) => key)
    const known = new Set(keys)

    keys.forEach((key, index) => {
      if (keys.indexOf(key) !== index) {
        ctx.addIssue({
          code: 'custom',
          path: ['builds', index, 'key'],
          message: `Another build already uses the key "${key}"`,
        })
      }
    })

    const defaults = recipe.builds.flatMap(({ isDefault }, index) =>
      isDefault ? [index] : []
    )
    if (defaults.length > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['builds', defaults[1] ?? 0, 'isDefault'],
        message: 'Only one build can be the default',
      })
    }
    defaults.forEach((index) => {
      if (recipe.builds[index]?.listed === false) {
        ctx.addIssue({
          code: 'custom',
          path: ['builds', index, 'listed'],
          message: 'The default build has to be listed',
        })
      }
    })

    recipe.builds.forEach(({ swap = {} }, index) => {
      Object.entries(swap).forEach(([from, to]) => {
        if (!recipe.tags.includes(from)) {
          ctx.addIssue({
            code: 'custom',
            path: ['builds', index, 'swap', from],
            message: `"${from}" is not a recipe tag, so there is nothing to swap`,
          })
        }
        if (recipe.tags.includes(to)) {
          ctx.addIssue({
            code: 'custom',
            path: ['builds', index, 'swap', from],
            message: `"${to}" is already a recipe tag. Recipe tags describe the default build`,
          })
        }
      })
    })

    const checkScope = (
      section: 'ingredients' | 'steps' | 'notes',
      rows: Scoped[]
    ): void => {
      rows.forEach(({ onlyBuilds, skipBuilds }, index) => {
        if (onlyBuilds && skipBuilds) {
          ctx.addIssue({
            code: 'custom',
            path: [section, index, 'skipBuilds'],
            message: 'Set only builds or skip builds, not both',
          })
        }
        ;(
          [
            ['onlyBuilds', onlyBuilds],
            ['skipBuilds', skipBuilds],
          ] as const
        ).forEach(([field, list]) =>
          list?.forEach((key) => {
            if (!known.has(key)) {
              ctx.addIssue({
                code: 'custom',
                path: [section, index, field],
                message: `No build has the key "${key}"`,
              })
            }
          })
        )
      })
    }
    checkScope('ingredients', recipe.ingredients)
    checkScope('steps', recipe.steps)
    checkScope('notes', recipe.notes)

    recipe.builds.forEach(({ key }, index) => {
      if (!recipe.ingredients.some((row) => appliesToBuild(row, key))) {
        ctx.addIssue({
          code: 'custom',
          path: ['builds', index, 'key'],
          message: 'This build is left with no ingredients',
        })
      }
      if (!recipe.steps.some((row) => appliesToBuild(row, key))) {
        ctx.addIssue({
          code: 'custom',
          path: ['builds', index, 'key'],
          message: 'This build is left with no steps',
        })
      }
    })
  })

export type RecipeImport = z.infer<typeof recipeImportSchema>
export type RecipeImportInput = z.input<typeof recipeImportSchema>
