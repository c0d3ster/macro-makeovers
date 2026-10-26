import z from 'zod'

export const authFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long'),
})

export type AuthFormData = z.infer<typeof authFormSchema>
