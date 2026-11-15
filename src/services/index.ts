// Service instances with dependency injection
// RecipeService pulls in the GraphQL schema classes, whose decorators need this polyfill first
import 'reflect-metadata'
import { Resend } from 'resend'

import { getStripe, SubscriptionRepository } from '@/libs/billing'
import { readBookBucket } from '@/libs/book'
import { Env } from '@/libs/Env'
import { getBaseUrl } from '@/utils/Env'

import { BillingService } from './BillingService'
import { ContactService } from './ContactService'
import { EmailService } from './EmailService'
import { EmailSubscriptionService } from './EmailSubscriptionService'
import { GroceryService } from './GroceryService'
import { RecipeService } from './RecipeService'
import { UserService } from './UserService'

// Create services with their dependencies
const resend = Env.RESEND_API_KEY ? new Resend(Env.RESEND_API_KEY) : null
const emailService = new EmailService(resend)
const contactService = new ContactService(emailService)
const emailSubscriptionService = new EmailSubscriptionService(emailService)
const groceryService = new GroceryService()
const recipeService = new RecipeService()
const userService = new UserService()
const billingService = new BillingService({
  repository: new SubscriptionRepository(),
  emailService,
  getStripe,
  getBookBucket: () => {
    const result = readBookBucket(Env)
    return 'bucket' in result ? result.bucket : undefined
  },
  appUrl: getBaseUrl,
})

export const services = {
  billingService,
  contactService,
  emailSubscriptionService,
  groceryService,
  recipeService,
  userService,
}

// Export types for dependency injection
export type { BillingService }
export type { ContactService }
export type { EmailSubscriptionService }
export type { GroceryService }
export type { RecipeService }
export type { UserService }
