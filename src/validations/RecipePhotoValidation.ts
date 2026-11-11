import z from 'zod'

import { recipeSlugSchema } from './RecipeImportValidation'

// Vercel refuses request bodies over 4.5 MB. The editor shrinks photos before sending them, so
// this only turns away something it could not shrink.
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const MAX_TITLE_LENGTH = 300
const MAX_SUMMARY_LENGTH = 3000
const MAX_NOTES_LENGTH = 1000

const photoStages = [
  'request',
  'config',
  'source',
  'generate',
  'optimize',
  'upload',
  'save',
] as const

export type PhotoStage = (typeof photoStages)[number]

// The text fields of a generate request. It generates from what is on screen, saved or not.
export const photoRequestSchema = z.object({
  // Names the stored file. A new recipe may not have one yet.
  slug: recipeSlugSchema.optional(),
  title: z.string().trim().min(1, 'Add a title first').max(MAX_TITLE_LENGTH),
  summary: z
    .string()
    .trim()
    .min(1, 'Add a summary first')
    .max(MAX_SUMMARY_LENGTH),
  notes: z.string().trim().max(MAX_NOTES_LENGTH).optional(),
  // A photo already in R2 to work from, instead of starting over
  sourceUrl: z.url().optional(),
})

// With a build key, the photo is that build's instead of the recipe's
export const photoChoiceSchema = z.object({
  url: z.url(),
  build: recipeSlugSchema.optional(),
})

// Clears a build's own photo, so the build shows the recipe photo again
export const buildPhotoClearSchema = z.object({ build: recipeSlugSchema })

// What the photo routes answer with. A failure names the stage, so the editor can say what broke.
export const photoResponseSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), url: z.url() }),
  z.object({
    ok: z.literal(false),
    stage: z.enum(photoStages),
    error: z.string(),
  }),
])

export type PhotoResponse = z.infer<typeof photoResponseSchema>
