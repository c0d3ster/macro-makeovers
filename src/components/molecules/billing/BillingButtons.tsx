'use client'

import type { ReactElement } from 'react'

import {
  useBookDownloadUrl,
  useOpenBillingPortal,
  useStartCheckout,
} from '@/apiClients'

import { RedirectButton } from './RedirectButton'

export const SubscribeButton = ({
  label = 'Subscribe',
}: {
  label?: string
}): ReactElement => {
  const startCheckout = useStartCheckout()
  return (
    <RedirectButton
      action={startCheckout}
      fallbackError='Could not start checkout. Try again.'
    >
      {label}
    </RedirectButton>
  )
}

export const ManageBillingButton = (): ReactElement => {
  const openBillingPortal = useOpenBillingPortal()
  return (
    <RedirectButton
      action={openBillingPortal}
      variant='outline'
      fallbackError='Could not open billing. Try again.'
    >
      Manage billing
    </RedirectButton>
  )
}

// The server checks paid access before signing the link; without it this shows the upgrade prompt
export const BookDownloadButton = (): ReactElement => {
  const bookDownloadUrl = useBookDownloadUrl()
  return (
    <RedirectButton
      action={bookDownloadUrl}
      variant='outline'
      fallbackError='Could not get the book. Try again.'
    >
      Download the book (PDF)
    </RedirectButton>
  )
}
