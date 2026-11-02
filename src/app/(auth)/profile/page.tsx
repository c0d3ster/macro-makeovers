import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { redirect } from 'next/navigation'

import { Button } from '@/components/atoms'
import { SignOutButton } from '@/components/molecules'
import { CleanPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { isOwner } from '@/libs/supabase/owner'
import { createClient } from '@/libs/supabase/server'

export const metadata: Metadata = {
  title: `My account - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
}

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  developer: 'Developer',
}

const roleLabel = (role?: string): string =>
  (role && ROLE_LABELS[role]) || 'Member'

const ProfilePage = async (): Promise<ReactElement> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // The proxy already sends signed-out visitors to /login. This covers a session that just ended.
  if (!user) redirect('/login?next=/profile')

  const owner = await isOwner()
  // Users can read their own row, so this is the role as stored: client, admin, super_admin
  const { data: row } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .maybeSingle()
  const details: [string, string][] = [
    [
      'Name',
      text(user.user_metadata.full_name) ??
        text(user.user_metadata.name) ??
        'Not set',
    ],
    ['Email', user.email ?? 'Not set'],
    ['Role', roleLabel(row?.role)],
  ]

  return (
    <CleanPageTemplate
      activeItem='account'
      title='My account'
      subtitle='Your sign-in details.'
      header={<SignOutButton />}
    >
      <dl className='grid gap-x-6 gap-y-4 rounded-lg bg-surface p-6 sm:grid-cols-[8rem_minmax(0,1fr)]'>
        {details.map(([label, value]) => (
          <div key={label} className='contents'>
            <dt className='text-sm text-text-muted'>{label}</dt>
            <dd className='wrap-break-word text-text'>{value}</dd>
          </div>
        ))}
      </dl>
      {owner && (
        <div className='mt-6'>
          <Button href='/admin'>Manage recipes</Button>
        </div>
      )}
    </CleanPageTemplate>
  )
}

export default ProfilePage
