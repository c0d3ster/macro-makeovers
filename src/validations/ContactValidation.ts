import z from 'zod'

// Contact form validation schema
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject too long'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message too long'),
})

// Infer the TypeScript type from the schema
export type ContactFormData = z.infer<typeof contactFormSchema>
