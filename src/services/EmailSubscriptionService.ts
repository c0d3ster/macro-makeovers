import { eq } from 'drizzle-orm'
import { GraphQLError } from 'graphql'
import { randomBytes } from 'node:crypto'

import type { EmailSubscribeInput } from '@/graphql/schema'
import type { EmailService } from '@/services/EmailService'

import { db } from '@/libs/DB'
import { logger } from '@/libs/Logger'
import { schemas } from '@/models'
import { getBaseUrl } from '@/utils/Env'
import { emailSignupSchema, subscriptionTokenSchema } from '@/validations'

// A pending address gets at most one confirmation email in this window, however often the
// form is sent, so the form cannot be used to flood someone's inbox
export const CONFIRMATION_RESEND_MS = 5 * 60 * 1000

const MAX_FIELD = 255

const clip = (value: string | undefined): string | null =>
  value?.trim() ? value.trim().slice(0, MAX_FIELD) : null

const newToken = (): string => randomBytes(32).toString('base64url')

const confirmUrlFor = (token: string): string =>
  `${getBaseUrl()}/subscribe/confirm?token=${token}`

const unsubscribeUrlFor = (token: string): string =>
  `${getBaseUrl()}/unsubscribe?token=${token}`

// Drizzle connects as postgres and bypasses RLS, so this class is the only gate on the list.
// Every answer to the public form is the same, so it never reveals whether an address is on it.
export class EmailSubscriptionService {
  constructor(private emailService: EmailService) {}

  async subscribe(input: EmailSubscribeInput, userId?: string): Promise<boolean> {
    // A filled honeypot is a bot. Pretend it worked.
    if (input.website) return true

    const parsed = emailSignupSchema.safeParse({ email: input.email })
    if (!parsed.success) {
      throw new GraphQLError('Enter a valid email address', {
        extensions: { code: 'BAD_USER_INPUT' },
      })
    }
    const { email } = parsed.data

    const existing = await db.query.emailSubscribers.findFirst({
      where: eq(schemas.emailSubscribers.email, email),
    })
    if (existing?.status === 'confirmed') return true
    if (
      existing?.status === 'pending' &&
      existing.confirmationSentAt &&
      Date.now() - existing.confirmationSentAt.getTime() < CONFIRMATION_RESEND_MS
    ) {
      return true
    }

    const now = new Date()
    const token = existing?.token ?? newToken()
    const source = {
      signupPath: clip(input.path),
      signupSource: clip(input.source),
      signupMedium: clip(input.medium),
      signupCampaign: clip(input.campaign),
    }

    if (existing) {
      // Pending again, or back after unsubscribing: confirm before mailing
      await db
        .update(schemas.emailSubscribers)
        .set({
          status: 'pending',
          confirmationSentAt: now,
          unsubscribedAt: null,
          ...(userId && !existing.userId ? { userId } : {}),
        })
        .where(eq(schemas.emailSubscribers.id, existing.id))
    } else {
      await db.insert(schemas.emailSubscribers).values({
        email,
        token,
        confirmationSentAt: now,
        userId: userId ?? null,
        ...source,
      })
    }

    try {
      await this.emailService.sendSubscriptionConfirmEmail({
        to: email,
        confirmUrl: confirmUrlFor(token),
        unsubscribeUrl: unsubscribeUrlFor(token),
      })
    } catch (error) {
      logger.error('Could not send the confirmation email', {
        error: String(error),
      })
      throw new GraphQLError('Could not send the confirmation email', {
        extensions: { code: 'EMAIL_SEND_FAILED' },
      })
    }
    return true
  }

  // True once the address is confirmed. An unknown token, or one that already unsubscribed,
  // is false: an old confirmation link must not put someone back on the list.
  async confirm(token: string): Promise<boolean> {
    const subscriber = await this.findByToken(token)
    if (!subscriber || subscriber.status === 'unsubscribed') return false
    if (subscriber.status === 'confirmed') return true

    await db
      .update(schemas.emailSubscribers)
      .set({ status: 'confirmed', confirmedAt: new Date() })
      .where(eq(schemas.emailSubscribers.id, subscriber.id))

    // The address is confirmed either way. A failed welcome email is logged, not shown.
    try {
      await this.emailService.sendWelcomeEmail({
        to: subscriber.email,
        unsubscribeUrl: unsubscribeUrlFor(subscriber.token),
      })
    } catch (error) {
      logger.error('Could not send the welcome email', { error: String(error) })
    }
    return true
  }

  // True when the token matches an address, which is now off the list
  async unsubscribe(token: string): Promise<boolean> {
    const subscriber = await this.findByToken(token)
    if (!subscriber) return false
    if (subscriber.status === 'unsubscribed') return true

    await db
      .update(schemas.emailSubscribers)
      .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
      .where(eq(schemas.emailSubscribers.id, subscriber.id))
    return true
  }

  private async findByToken(
    token: string
  ): Promise<typeof schemas.emailSubscribers.$inferSelect | undefined> {
    if (!subscriptionTokenSchema.safeParse(token).success) return undefined
    return db.query.emailSubscribers.findFirst({
      where: eq(schemas.emailSubscribers.token, token),
    })
  }
}
