'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import {
  useConfirmEmailSubscription,
  useUnsubscribeFromEmails,
} from '@/apiClients'
import { track } from '@/libs/analytics'
import { logger } from '@/libs/Logger'

type SubscriptionLinkResultProps = {
  action: 'confirm' | 'unsubscribe'
  token?: string
}

type Status = 'working' | 'done' | 'invalid' | 'failed'

const MESSAGES: Record<
  SubscriptionLinkResultProps['action'],
  Record<Status, string>
> = {
  confirm: {
    working: 'Confirming your email...',
    done: "You're on the list. A welcome email is on its way, then one makeover a week.",
    invalid:
      'This link has expired or was already used to unsubscribe. Sign up again from any recipe page.',
    failed: 'Something went wrong. Please open the link again in a minute.',
  },
  unsubscribe: {
    working: 'Unsubscribing...',
    done: "You're unsubscribed. No more list emails will arrive.",
    invalid: 'This unsubscribe link is not valid.',
    failed: 'Something went wrong. Please open the link again in a minute.',
  },
}

// Runs the emailed link's action in the browser rather than on a GET, so mail scanners that
// fetch links without running scripts cannot confirm or unsubscribe anyone
export const SubscriptionLinkResult = ({
  action,
  token,
}: SubscriptionLinkResultProps): ReactElement => {
  const [status, setStatus] = useState<Status>(token ? 'working' : 'invalid')
  const [confirm] = useConfirmEmailSubscription()
  const [unsubscribe] = useUnsubscribeFromEmails()
  // Strict mode runs effects twice in development; the action should run once
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (!token || hasRunRef.current) return
    hasRunRef.current = true

    const run = async (): Promise<void> => {
      try {
        const variables = { token }
        const ok =
          action === 'confirm'
            ? (await confirm({ variables })).data?.confirmEmailSubscription
            : (await unsubscribe({ variables })).data?.unsubscribeFromEmails
        if (ok && action === 'confirm') track('email_confirmed')
        setStatus(ok ? 'done' : 'invalid')
      } catch (error) {
        logger.error('Subscription link failed', { action, error: String(error) })
        setStatus('failed')
      }
    }
    void run()
  }, [action, token, confirm, unsubscribe])

  return (
    <div className='mx-auto max-w-md rounded-2xl bg-surface p-8 text-center'>
      <p className='text-lg text-text' role='status'>
        {MESSAGES[action][status]}
      </p>
      {status !== 'working' && (
        <Link
          href='/recipes'
          className='mt-6 inline-block font-medium text-primary underline hover:no-underline'
        >
          Browse the recipes
        </Link>
      )}
    </div>
  )
}
