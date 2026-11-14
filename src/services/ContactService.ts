import { GraphQLError } from 'graphql'

import type { ContactFormInput } from '@/graphql/schema'
import type { EmailService } from '@/services/EmailService'

import { logger } from '@/libs/Logger'

// Blank optional fields come in as '' from the form, so treat them as not given
const presentOrNull = (value?: string | null): string | null =>
  value?.trim() ? value.trim() : null

export class ContactService {
  constructor(private emailService: EmailService) {}

  // A makeover idea from the about page, emailed to the support inbox
  async submitContactForm(input: ContactFormInput) {
    const submissionId = `contact_${Date.now()}`
    const idea = {
      name: input.name.trim(),
      email: input.email.trim(),
      dish: input.dish.trim(),
      recipeUrl: presentOrNull(input.recipeUrl),
      details: presentOrNull(input.details),
    }

    try {
      logger.info('Makeover idea received', {
        submissionId,
        dish: idea.dish,
        hasRecipeUrl: Boolean(idea.recipeUrl),
      })

      await this.emailService.sendContactFormEmail(idea)

      return {
        id: submissionId,
        ...idea,
        submittedAt: new Date().toISOString(),
      }
    } catch (error) {
      logger.error('Error processing makeover idea', {
        error: String(error),
        submissionId,
        dish: idea.dish,
      })

      throw new GraphQLError('Failed to submit contact form', {
        extensions: { code: 'CONTACT_SUBMISSION_FAILED' },
      })
    }
  }
}
