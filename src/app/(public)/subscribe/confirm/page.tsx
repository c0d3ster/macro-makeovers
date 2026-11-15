import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { SubscriptionLinkResult } from '@/components/molecules'
import { LandingPageTemplate } from '@/components/templates'

export const metadata: Metadata = {
  title: 'Confirm your email',
  robots: { index: false, follow: false },
}

type ConfirmPageProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

const ConfirmPage = async ({
  searchParams,
}: ConfirmPageProps): Promise<ReactElement> => {
  const { token } = await searchParams

  return (
    <LandingPageTemplate>
      <main className='px-4 py-24'>
        <SubscriptionLinkResult
          action='confirm'
          token={typeof token === 'string' ? token : undefined}
        />
      </main>
    </LandingPageTemplate>
  )
}

export default ConfirmPage
