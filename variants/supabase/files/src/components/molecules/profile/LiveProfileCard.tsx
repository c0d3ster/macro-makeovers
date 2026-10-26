'use client'

import { useGetMe } from '@/apiClients'
import { useRealtimeTable } from '@/hooks'
import { useAuth } from '@/providers'

// Shows the signed-in user's profile and refetches it whenever their users row changes.
// Edit the row in Supabase Studio to watch it update without a page reload.
export const LiveProfileCard = () => {
  const { user } = useAuth()
  const { data, loading, refetch } = useGetMe()

  useRealtimeTable({
    table: 'users',
    // Without a user there is nothing to watch; this filter matches no rows
    filter: `auth_id=eq.${user?.id ?? '00000000-0000-0000-0000-000000000000'}`,
    onChange: (): void => {
      void refetch()
    },
  })

  const me = data?.me
  const name = [me?.firstName, me?.lastName].filter(Boolean).join(' ')

  return (
    <div className='rounded-lg bg-surface p-6'>
      <h2 className='mb-4 text-xl font-semibold text-text'>Live Profile</h2>
      {loading && !me ? (
        <p className='text-text-muted'>Loading...</p>
      ) : (
        <dl className='space-y-2 text-text-muted'>
          <div className='flex gap-2'>
            <dt className='font-medium text-text'>Name</dt>
            <dd>{name || 'Not set'}</dd>
          </div>
          <div className='flex gap-2'>
            <dt className='font-medium text-text'>Email</dt>
            <dd>{me?.email ?? 'Unknown'}</dd>
          </div>
          <div className='flex gap-2'>
            <dt className='font-medium text-text'>Role</dt>
            <dd>{me?.role ?? 'Unknown'}</dd>
          </div>
        </dl>
      )}
    </div>
  )
}
