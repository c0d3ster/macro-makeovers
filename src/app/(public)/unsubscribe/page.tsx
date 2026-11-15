import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { SubscriptionLinkResult } from '@/components/molecules'
import { LandingPageTemplate } from '@/components/templates'

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
}

type UnsubscribePageProps = {
  searchParams: Promise<{ token?: string | string[] }>
}

const UnsubscribePage = async ({
  searchParams,
}: UnsubscribePageProps): Promise<ReactElement> => {
  const { token } = await searchParams

  return (
    <LandingPageTemplate>
      <main className='px-4 py-24'>
        <SubscriptionLinkResult
          action='unsubscribe'
          token={typeof token === 'string' ? token : undefined}
        />
      </main>
    </LandingPageTemplate>
  )
}

export default UnsubscribePage
