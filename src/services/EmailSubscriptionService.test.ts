import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/libs/DB'

import type { EmailService } from './EmailService'

import {
  CONFIRMATION_RESEND_MS,
  EmailSubscriptionService,
} from './EmailSubscriptionService'

const findFirst = vi.fn()
const insertValues = vi.fn()
const updateSet = vi.fn()
const updateWhere = vi.fn()

vi.mock('@/libs/DB', () => ({
  db: {
    query: { emailSubscribers: { findFirst: (...args: unknown[]) => findFirst(...args) } },
    insert: vi.fn(),
    update: vi.fn(),
  },
}))
vi.mock('@/models', () => ({
  schemas: { emailSubscribers: { id: 'id', email: 'email', token: 'token' } },
}))

const TOKEN = 'a'.repeat(43)

const subscriber = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'sub-1',
  email: 'cook@example.com',
  status: 'pending',
  token: TOKEN,
  userId: null,
  confirmationSentAt: new Date(Date.now() - CONFIRMATION_RESEND_MS - 1000),
  ...overrides,
})

const emailService = {
  sendSubscriptionConfirmEmail: vi.fn(),
  sendWelcomeEmail: vi.fn(),
}

describe('EmailSubscriptionService', () => {
  const service = new EmailSubscriptionService(
    emailService as unknown as EmailService
  )

  beforeEach(() => {
    findFirst.mockResolvedValue(undefined)
    insertValues.mockResolvedValue(undefined)
    updateWhere.mockResolvedValue(undefined)
    updateSet.mockReturnValue({ where: updateWhere })
    vi.mocked(db.insert).mockReturnValue({ values: insertValues } as never)
    vi.mocked(db.update).mockReturnValue({ set: updateSet } as never)
    emailService.sendSubscriptionConfirmEmail.mockResolvedValue(undefined)
    emailService.sendWelcomeEmail.mockResolvedValue(undefined)
  })

  describe('subscribe', () => {
    it('adds a new address as pending and sends the confirmation link', async () => {
      await expect(
        service.subscribe(
          {
            email: '  Cook@Example.com ',
            path: '/recipes/tacos',
            source: 'reddit',
            medium: 'social',
          },
          'user-1'
        )
      ).resolves.toBe(true)

      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'cook@example.com',
          userId: 'user-1',
          signupPath: '/recipes/tacos',
          signupSource: 'reddit',
          signupMedium: 'social',
          signupCampaign: null,
        })
      )

      const [{ token }] = insertValues.mock.calls[0] as [{ token: string }]

      expect(token).toMatch(/^[\w-]{43}$/)
      expect(emailService.sendSubscriptionConfirmEmail).toHaveBeenCalledWith({
        to: 'cook@example.com',
        confirmUrl: expect.stringContaining(`/subscribe/confirm?token=${token}`),
        unsubscribeUrl: expect.stringContaining(`/unsubscribe?token=${token}`),
      })
    })

    it('rejects an invalid address', async () => {
      await expect(service.subscribe({ email: 'not-an-email' })).rejects.toThrow(
        'Enter a valid email address'
      )
      expect(insertValues).not.toHaveBeenCalled()
    })

    it('quietly ignores a filled honeypot', async () => {
      await expect(
        service.subscribe({ email: 'bot@example.com', website: 'spam.biz' })
      ).resolves.toBe(true)

      expect(findFirst).not.toHaveBeenCalled()
      expect(emailService.sendSubscriptionConfirmEmail).not.toHaveBeenCalled()
    })

    it('answers the same for a confirmed address without mailing it', async () => {
      findFirst.mockResolvedValue(subscriber({ status: 'confirmed' }))

      await expect(service.subscribe({ email: 'cook@example.com' })).resolves.toBe(true)
      expect(db.update).not.toHaveBeenCalled()
      expect(emailService.sendSubscriptionConfirmEmail).not.toHaveBeenCalled()
    })

    it('does not resend a confirmation sent moments ago', async () => {
      findFirst.mockResolvedValue(subscriber({ confirmationSentAt: new Date() }))

      await expect(service.subscribe({ email: 'cook@example.com' })).resolves.toBe(true)
      expect(emailService.sendSubscriptionConfirmEmail).not.toHaveBeenCalled()
    })

    it('resends to a pending address once the window has passed', async () => {
      findFirst.mockResolvedValue(subscriber())

      await service.subscribe({ email: 'cook@example.com' })

      expect(insertValues).not.toHaveBeenCalled()
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      )
      expect(emailService.sendSubscriptionConfirmEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmUrl: expect.stringContaining(TOKEN),
        })
      )
    })

    it('asks an unsubscribed address to confirm again', async () => {
      findFirst.mockResolvedValue(
        subscriber({ status: 'unsubscribed', unsubscribedAt: new Date() })
      )

      await service.subscribe({ email: 'cook@example.com' })

      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending', unsubscribedAt: null })
      )
      expect(emailService.sendSubscriptionConfirmEmail).toHaveBeenCalled()
    })

    it('reports a failed confirmation email', async () => {
      emailService.sendSubscriptionConfirmEmail.mockRejectedValue(
        new Error('Resend down')
      )

      await expect(service.subscribe({ email: 'cook@example.com' })).rejects.toThrow(
        'Could not send the confirmation email'
      )
    })
  })

  describe('confirm', () => {
    it('confirms a pending address and sends the welcome email', async () => {
      findFirst.mockResolvedValue(subscriber())

      await expect(service.confirm(TOKEN)).resolves.toBe(true)
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'confirmed' })
      )
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith({
        to: 'cook@example.com',
        unsubscribeUrl: expect.stringContaining(`/unsubscribe?token=${TOKEN}`),
      })
    })

    it('does not welcome an address twice', async () => {
      findFirst.mockResolvedValue(subscriber({ status: 'confirmed' }))

      await expect(service.confirm(TOKEN)).resolves.toBe(true)
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled()
    })

    it('will not resubscribe from an old link after unsubscribing', async () => {
      findFirst.mockResolvedValue(subscriber({ status: 'unsubscribed' }))

      await expect(service.confirm(TOKEN)).resolves.toBe(false)
      expect(db.update).not.toHaveBeenCalled()
    })

    it('stays confirmed when the welcome email fails', async () => {
      findFirst.mockResolvedValue(subscriber())
      emailService.sendWelcomeEmail.mockRejectedValue(new Error('Resend down'))

      await expect(service.confirm(TOKEN)).resolves.toBe(true)
    })

    it('rejects a malformed token without a lookup', async () => {
      await expect(service.confirm('short')).resolves.toBe(false)
      expect(findFirst).not.toHaveBeenCalled()
    })

    it('rejects an unknown token', async () => {
      await expect(service.confirm(TOKEN)).resolves.toBe(false)
    })
  })

  describe('unsubscribe', () => {
    it('takes the address off the list', async () => {
      findFirst.mockResolvedValue(subscriber({ status: 'confirmed' }))

      await expect(service.unsubscribe(TOKEN)).resolves.toBe(true)
      expect(updateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'unsubscribed' })
      )
    })

    it('is a no-op for an address already off the list', async () => {
      findFirst.mockResolvedValue(subscriber({ status: 'unsubscribed' }))

      await expect(service.unsubscribe(TOKEN)).resolves.toBe(true)
      expect(db.update).not.toHaveBeenCalled()
    })

    it('rejects an unknown token', async () => {
      await expect(service.unsubscribe(TOKEN)).resolves.toBe(false)
    })
  })
})
