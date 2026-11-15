import type { Resend } from 'resend'

import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'
import { getBaseUrl } from '@/utils/Env'

const AMP_RE = /&/g
const LT_RE = /</g
const GT_RE = />/g
const QUOT_RE = /"/g
const APOS_RE = /'/g
const NL_RE = /\n/g

// Sent through Resend from the verified macromakeovers.com domain
const FROM_ADDRESS = 'Macro Makeovers <hello@macromakeovers.com>'

type MakeoverIdeaEmail = {
  name: string
  email: string
  dish: string
  recipeUrl: string | null
  details: string | null
}

type SubscriberEmail = {
  to: string
  // Every list email carries a working unsubscribe link
  unsubscribeUrl: string
}

const listFooter = (unsubscribeUrl: string): string => `
  <p style="color:#777;font-size:12px;margin-top:32px">
    You get this because you signed up at macromakeovers.com.
    <a href="${unsubscribeUrl}">Unsubscribe</a>
  </p>
`

// Lets mail apps show their own unsubscribe button
const listHeaders = (unsubscribeUrl: string): Record<string, string> => ({
  'List-Unsubscribe': `<${unsubscribeUrl}>`,
})

export class EmailService {
  constructor(private resend: Resend | null) {}

  /**
   * Escape HTML to prevent XSS attacks
   */
  private escapeHtml(text: string): string {
    return text
      .replace(AMP_RE, '&amp;')
      .replace(LT_RE, '&lt;')
      .replace(GT_RE, '&gt;')
      .replace(QUOT_RE, '&quot;')
      .replace(APOS_RE, '&#039;')
  }

  /**
   * Email a makeover idea from the about page to the support inbox. Replies go to the sender.
   */
  async sendContactFormEmail({
    name,
    email,
    dish,
    recipeUrl,
    details,
  }: MakeoverIdeaEmail): Promise<void> {
    if (!this.resend) {
      logger.warn('Resend not configured - skipping email send', { dish })
      return
    }

    const recipeLine = recipeUrl
      ? `<p><strong>Recipe:</strong> <a href="${this.escapeHtml(recipeUrl)}">${this.escapeHtml(recipeUrl)}</a></p>`
      : ''
    const detailsBlock = details
      ? `<p><strong>Details:</strong></p><p>${this.escapeHtml(details).replace(NL_RE, '<br>')}</p>`
      : ''

    // Resend reports failures in the result instead of throwing
    const { error } = await this.resend.emails.send({
      from: FROM_ADDRESS,
      to: Env.SUPPORT_EMAIL,
      replyTo: email,
      subject: `Makeover idea: ${dish.replace(NL_RE, ' ')}`,
      html: `
        <h2>New makeover idea</h2>
        <p><strong>From:</strong> ${this.escapeHtml(name)} (${this.escapeHtml(email)})</p>
        <p><strong>Dish:</strong> ${this.escapeHtml(dish)}</p>
        ${recipeLine}
        ${detailsBlock}
      `,
    })

    if (error) {
      logger.error('Failed to send makeover idea email', {
        error: error.message,
        dish,
      })
      throw new Error(error.message)
    }

    logger.info('Makeover idea email sent', { dish })
  }

  /**
   * Double opt-in: the link confirms the address before any list email goes out
   */
  async sendSubscriptionConfirmEmail({
    to,
    confirmUrl,
    unsubscribeUrl,
  }: SubscriberEmail & { confirmUrl: string }): Promise<void> {
    if (!this.resend) {
      // Local development without Resend: the link is the only way to finish the flow
      logger.warn('Resend not configured - skipping confirmation email', {
        confirmUrl,
      })
      return
    }

    await this.send({
      to,
      subject: 'Confirm your Macro Makeovers sign-up',
      unsubscribeUrl,
      html: `
        <h2>One more step</h2>
        <p>Confirm your address and you'll get one macro-friendly makeover a week, with the
        calories, carbs, fat, and protein for every serving.</p>
        <p><a href="${confirmUrl}"><strong>Confirm my email</strong></a></p>
        <p>Didn't sign up? Ignore this and nothing more will arrive.</p>
      `,
    })
  }

  /**
   * Sent once, right after the address is confirmed
   */
  async sendWelcomeEmail({ to, unsubscribeUrl }: SubscriberEmail): Promise<void> {
    if (!this.resend) {
      logger.warn('Resend not configured - skipping welcome email')
      return
    }

    const site = getBaseUrl()
    await this.send({
      to,
      subject: 'Welcome to Macro Makeovers',
      unsubscribeUrl,
      html: `
        <h2>You're in</h2>
        <p>Macro Makeovers rebuilds the foods people already love so they keep the flavor and
        fit your macros: more protein, less fat, and every number shown.</p>
        <p>A few places to start:</p>
        <ul>
          <li><a href="${site}/recipes">Every recipe</a>, with the makeover against the traditional version</li>
          <li><a href="${site}/guides/nutrition">The nutrition guide</a>: protein targets and the ratio for each goal</li>
          <li><a href="${site}/basket">The basket</a>: add a few recipes and see what buying them together saves</li>
        </ul>
        <p>A new makeover lands in your inbox each week. Reply any time, this address reaches a person.</p>
      `,
    })
  }

  private async send({
    to,
    subject,
    html,
    unsubscribeUrl,
  }: SubscriberEmail & { subject: string; html: string }): Promise<void> {
    if (!this.resend) return
    const { error } = await this.resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html: `${html}${listFooter(unsubscribeUrl)}`,
      headers: listHeaders(unsubscribeUrl),
    })
    if (error) {
      logger.error('Failed to send list email', { subject, error: error.message })
      throw new Error(error.message)
    }
    logger.info('List email sent', { subject })
  }
}
