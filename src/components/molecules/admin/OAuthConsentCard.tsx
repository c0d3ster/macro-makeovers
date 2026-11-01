import type { ReactElement } from 'react'

import { Button } from '@/components/atoms'
import { Env } from '@/libs/Env'

type OAuthConsentCardProps = {
  authorizationId: string
  clientName: string
  redirectUri: string
  scopes: string[]
  // False when the return address is not on the allowed list, which leaves only Deny
  canApprove: boolean
}

// Asks the owner to approve or deny an app that wants to act as them. Posts to the decision
// route, so it needs no client-side code.
export const OAuthConsentCard = ({
  authorizationId,
  clientName,
  redirectUri,
  scopes,
  canApprove,
}: OAuthConsentCardProps): ReactElement => (
  <div className='w-full max-w-md rounded-lg bg-surface p-8 shadow-lg'>
    <h1 className='text-2xl font-bold text-text'>Connect {clientName}?</h1>
    <p className='mt-3 text-text-muted'>
      Approving lets this app act as you on {Env.NEXT_PUBLIC_BRAND_NAME},
      including importing recipes. Only approve if you just started this
      connection.
    </p>

    <dl className='mt-6 space-y-3 text-sm'>
      <div>
        <dt className='text-text-muted'>Returns to</dt>
        <dd className='font-mono break-all text-text'>{redirectUri}</dd>
      </div>
      <div>
        <dt className='text-text-muted'>Access requested</dt>
        <dd className='text-text'>
          {scopes.length > 0 ? scopes.join(', ') : 'Basic sign-in'}
        </dd>
      </div>
    </dl>

    {!canApprove && (
      <p role='alert' className='mt-6 text-red-400'>
        This return address is not on the allowed list, so it can only be
        denied.
      </p>
    )}

    <form
      method='post'
      action='/api/oauth/decision'
      className='mt-8 flex flex-wrap gap-3'
    >
      <input type='hidden' name='authorization_id' value={authorizationId} />
      {canApprove && (
        <Button type='submit' name='decision' value='approve'>
          Approve
        </Button>
      )}
      <Button type='submit' name='decision' value='deny' variant='outline'>
        Deny
      </Button>
    </form>
  </div>
)
