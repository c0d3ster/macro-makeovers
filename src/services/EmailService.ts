import type { Resend } from 'resend'

import { Env } from '@/libs/Env'
import { logger } from '@/libs/Logger'

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
}
