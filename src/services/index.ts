// Service instances with dependency injection
// #region @module:email
import { Resend } from 'resend'

import { Env } from '@/libs/Env'

import { ContactService } from './ContactService'
import { EmailService } from './EmailService'
// #endregion @module:email
import { UserService } from './UserService' // @module:auth

// Create services with their dependencies
// #region @module:email
const resend = Env.RESEND_API_KEY ? new Resend(Env.RESEND_API_KEY) : null
const emailService = new EmailService(resend)
const contactService = new ContactService(emailService)
// #endregion @module:email
const userService = new UserService() // @module:auth

export const services = {
  contactService, // @module:email
  userService, // @module:auth
}

// Export types for dependency injection
export type { ContactService } // @module:email
export type { UserService } // @module:auth
