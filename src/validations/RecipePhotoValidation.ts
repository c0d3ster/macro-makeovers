import z from 'zod'

// Vercel refuses request bodies over 4.5 MB, so a reference photo has to fit well inside that
export const MAX_REFERENCE_BYTES = 4 * 1024 * 1024
export const REFERENCE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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
  title: z.string().trim().min(1, 'Add a title first').max(MAX_TITLE_LENGTH),
  summary: z
    .string()
    .trim()
    .min(1, 'Add a summary first')
    .max(MAX_SUMMARY_LENGTH),
  notes: z.string().trim().max(MAX_NOTES_LENGTH).optional(),
  // A photo already in R2 to refine, instead of starting over
  sourceUrl: z.url().optional(),
})

export const photoChoiceSchema = z.object({ url: z.url() })

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
