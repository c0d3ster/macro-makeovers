'use client'

import type { ReactElement, ReactNode } from 'react'

import { useState } from 'react'

import { Button } from '@/components/atoms'
import { isSubscriptionRequired } from '@/libs/billing/subscriptionRequired'

import { UpgradePrompt } from './UpgradePrompt'

type RedirectButtonProps = {
  // Resolves to the URL to send the browser to (Checkout, the portal, a signed download)
  action: () => Promise<string>
  children: ReactNode
  variant?: 'solid' | 'outline'
  fallbackError: string
}

// Runs a mutation that returns a URL, then follows it. A SUBSCRIPTION_REQUIRED error becomes an
// upgrade prompt instead of an error message.
export const RedirectButton = ({
  action,
  children,
  variant = 'solid',
  fallbackError,
}: RedirectButtonProps): ReactElement => {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string>()
  const [needsPlan, setNeedsPlan] = useState(false)

  const run = async (): Promise<void> => {
    setError(undefined)
    setIsPending(true)
    try {
      window.location.assign(await action())
    } catch (caught) {
      setIsPending(false)
      if (isSubscriptionRequired(caught)) {
        setNeedsPlan(true)
        return
      }
      setError(caught instanceof Error ? caught.message : fallbackError)
    }
  }

  if (needsPlan) return <UpgradePrompt />

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <Button variant={variant} disabled={isPending} onClick={run}>
        {children}
      </Button>
      {error && (
        <span role='alert' className='text-sm text-red-400'>
          {error}
        </span>
      )}
    </div>
  )
}
