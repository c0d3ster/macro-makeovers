import z from 'zod'

// The email list sign-up form. The address is lowercased so one inbox is one subscriber.
export const emailSignupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .max(255, 'Email too long')
    .email('Invalid email address'),
})

export type EmailSignupData = z.infer<typeof emailSignupSchema>

// Confirmation and unsubscribe links carry a base64url token
export const subscriptionTokenSchema = z
  .string()
  .regex(/^[\w-]{20,64}$/, 'Invalid link')
