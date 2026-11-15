import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import { redirect } from 'next/navigation'

import type { MyPlan } from '@/app/loadMyPlan'
import type { PlanSummary } from '@/services/BillingService'

import { loadMyPlan } from '@/app/loadMyPlan'
import { Button } from '@/components/atoms'
import {
  BookDownloadButton,
  ManageBillingButton,
  SignOutButton,
} from '@/components/molecules'
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

const formatDate = (iso: Date): string =>
  iso.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

// One line on where the plan stands, in plain words
const planLine = (plan: PlanSummary): string => {
  const { source, status, currentPeriodEnd, cancelAtPeriodEnd, hasPaidAccess } =
    plan
  const end = currentPeriodEnd ? formatDate(currentPeriodEnd) : undefined

  if (source === 'owner') return 'Owner, with every paid feature'
  if (source === 'partner') return 'Paid, through ForgeFit'
  if (status === 'past_due' && hasPaidAccess) {
    return 'Paid, but the last payment did not go through. Update your card to keep it.'
  }
  if (hasPaidAccess && cancelAtPeriodEnd) {
    return end ? `Paid, canceled. Stays on until ${end}.` : 'Paid, canceled.'
  }
  if (hasPaidAccess) return end ? `Paid, renews ${end}` : 'Paid'
  if (status === 'past_due' || status === 'unpaid') {
    return 'Paused: the last payment did not go through.'
  }
  return 'Free'
}

const PlanSection = ({
  myPlan,
  justSubscribed,
}: {
  myPlan: MyPlan
  justSubscribed: boolean
}): ReactElement | null => {
  if (!myPlan.signedIn) return null
  const { plan } = myPlan

  return (
    <section className='mt-6 grid gap-4 rounded-lg bg-surface p-6'>
      <h2 className='text-lg font-semibold text-text'>Plan</h2>
      {justSubscribed && !plan?.hasPaidAccess && (
        <p role='status' className='text-text'>
          Thanks for subscribing. Your plan can take a minute to show up here.
          Refresh in a moment.
        </p>
      )}
      <p className='text-text'>
        {plan ? planLine(plan) : 'Could not load your plan. Refresh to try again.'}
      </p>
      {plan && (
        <div className='flex flex-wrap gap-3'>
          {plan.hasPaidAccess && <BookDownloadButton />}
          {plan.canManageBilling && <ManageBillingButton />}
          {plan.canSubscribe && <Button href='/pricing'>See the plan</Button>}
        </div>
      )}
    </section>
  )
}

type ProfilePageProps = {
  searchParams?: Promise<{ checkout?: string }>
}

const ProfilePage = async ({
  searchParams,
}: ProfilePageProps = {}): Promise<ReactElement> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // The proxy already sends signed-out visitors to /login. This covers a session that just ended.
  if (!user) redirect('/login?next=/profile')

  const owner = await isOwner()
  const [myPlan, params] = await Promise.all([loadMyPlan(), searchParams])
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
      subtitle='Your sign-in details and plan.'
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
      <PlanSection
        myPlan={myPlan}
        justSubscribed={params?.checkout === 'success'}
      />
      {owner && (
        <div className='mt-6'>
          <Button href='/admin'>Manage recipes</Button>
        </div>
      )}
    </CleanPageTemplate>
  )
}

export default ProfilePage
