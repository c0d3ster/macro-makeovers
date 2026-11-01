import type { Metadata } from 'next'
import type { ReactElement, ReactNode } from 'react'

import { redirect } from 'next/navigation'

import { OAuthConsentCard } from '@/components/molecules'
import { Env } from '@/libs/Env'
import { isAllowedRedirectUri } from '@/libs/mcp/allowedClients'
import { isOwner } from '@/libs/supabase/owner'
import { createClient } from '@/libs/supabase/server'

export const metadata: Metadata = {
  title: `Connect an app - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
  robots: { index: false },
}

type ConsentPageProps = {
  searchParams: Promise<{ authorization_id?: string }>
}

const Screen = ({ children }: { children: ReactNode }): ReactElement => (
  <main className='flex min-h-screen items-center justify-center px-4'>
    {children}
  </main>
)

const Message = ({ children }: { children: ReactNode }): ReactElement => (
  <div className='w-full max-w-md rounded-lg bg-surface p-8 text-text'>
    {children}
  </div>
)

// Supabase sends the owner here after an app asks to connect. The owner signs in if needed,
// then approves or denies.
const ConsentPage = async ({
  searchParams,
}: ConsentPageProps): Promise<ReactElement> => {
  const { authorization_id: authorizationId } = await searchParams
  if (!authorizationId) {
    return (
      <Screen>
        <Message>This page needs an authorization request to show.</Message>
      </Screen>
    )
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) {
    const here = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`
    redirect(`/login?next=${encodeURIComponent(here)}`)
  }

  if (!(await isOwner())) {
    return (
      <Screen>
        <Message>Only the site owner can connect apps.</Message>
      </Screen>
    )
  }

  const { data: details, error } =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId)
  if (error || !details) {
    return (
      <Screen>
        <Message>That request is invalid or has expired. Start again.</Message>
      </Screen>
    )
  }

  // Already approved before, so there is nothing to ask
  if (!('authorization_id' in details)) redirect(details.redirect_url)

  return (
    <Screen>
      <OAuthConsentCard
        authorizationId={authorizationId}
        clientName={details.client.name}
        redirectUri={details.redirect_uri}
        scopes={details.scope.split(' ').filter(Boolean)}
        canApprove={isAllowedRedirectUri(details.redirect_uri)}
      />
    </Screen>
  )
}

export default ConsentPage
