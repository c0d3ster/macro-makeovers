// Service instances with dependency injection
import { Resend } from 'resend'

import { Env } from '@/libs/Env'

import { ContactService } from './ContactService'
import { EmailService } from './EmailService'
import { UserService } from './UserService'

// Create services with their dependencies
const resend = Env.RESEND_API_KEY ? new Resend(Env.RESEND_API_KEY) : null
const emailService = new EmailService(resend)
const contactService = new ContactService(emailService)
const userService = new UserService()

export const services = {
  contactService,
  userService,
}

// Export types for dependency injection
export type { ContactService }
export type { UserService }
