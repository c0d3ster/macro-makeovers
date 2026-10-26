import { Arg, Mutation, Resolver } from 'type-graphql'

import type { ContactService } from '@/services'

import { ContactFormInput, ContactSubmission } from '@/graphql/schema'
import { logger } from '@/libs/Logger'

@Resolver()
export class ContactResolver {
  constructor(private contactService: ContactService) {}

  @Mutation(() => ContactSubmission)
  async submitContactForm(
    @Arg('input', () => ContactFormInput) input: ContactFormInput
  ) {
    try {
      return await this.contactService.submitContactForm(input)
    } catch (error) {
      logger.error('Error in submitContactForm mutation', {
        error: String(error),
        input: {
          name: input.name,
          email: input.email,
          subject: input.subject,
        },
      })
      throw error
    }
  }
}
