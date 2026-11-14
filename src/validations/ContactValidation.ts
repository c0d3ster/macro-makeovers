import z from 'zod'

// An empty optional field arrives as '', which counts as not given
const optionalText = (max: number, tooLong: string) =>
  z.string().trim().max(max, tooLong).optional()

// Makeover idea form: who is asking, the dish, and optional context
export const contactFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().trim().email('Invalid email address'),
  dish: z
    .string()
    .trim()
    .min(2, 'Tell us the dish')
    .max(150, 'Dish name too long'),
  recipeUrl: z
    .union([
      z.literal(''),
      z.string().trim().url('Use a full link, like https://...').max(500),
    ])
    .optional(),
  details: optionalText(2000, 'Details too long'),
})

export type ContactFormData = z.infer<typeof contactFormSchema>
