import type { Metadata } from 'next'
import type { ReactElement } from 'react'

import type { MyPlan } from '@/app/loadMyPlan'

import { loadMyPlan } from '@/app/loadMyPlan'
import { Button } from '@/components/atoms'
import {
  ManageBillingButton,
  PlanFeatureList,
  SubscribeButton,
} from '@/components/molecules'
import { LandingPageTemplate } from '@/components/templates'
import { getPlanPrice } from '@/libs/billing/planPrice'
import { Env } from '@/libs/Env'

export const metadata: Metadata = {
  title: 'Pricing',
  description: `Every ${Env.NEXT_PUBLIC_BRAND_NAME} recipe is free. One monthly plan adds the meal planner, Send to cart, and the recipe book.`,
  alternates: { canonical: '/pricing' },
}

const CallToAction = ({
  myPlan,
  price,
}: {
  myPlan: MyPlan
  price: string
}): ReactElement => {
  if (!myPlan.signedIn) {
    return (
      <Button href='/login?next=/pricing'>Sign up to subscribe</Button>
    )
  }

  const { plan } = myPlan
  if (!plan) {
    return (
      <p className='text-text-muted'>
        Could not load your plan. Refresh to try again.
      </p>
    )
  }
  if (plan.hasPaidAccess) {
    return (
      <div className='flex flex-wrap items-center gap-3'>
        <p className='text-text'>You have the plan.</p>
        <Button href='/profile' variant='outline'>
          Go to my account
        </Button>
      </div>
    )
  }
  if (plan.canSubscribe) {
    return <SubscribeButton label={`Subscribe for ${price} a month`} />
  }
  if (plan.canManageBilling) {
    return (
      <div className='grid gap-3'>
        <p className='text-text'>
          Your last payment did not go through. Update your card to turn the
          plan back on.
        </p>
        <ManageBillingButton />
      </div>
    )
  }
  return (
    <p className='text-text-muted'>
      Your plan is managed outside this site.
    </p>
  )
}

const PricingPage = async (): Promise<ReactElement> => {
  const [price, myPlan] = await Promise.all([getPlanPrice(), loadMyPlan()])

  return (
    <LandingPageTemplate activeItem='pricing'>
      <main className='mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8'>
        <h1 className='mb-3 text-3xl font-bold text-text sm:text-4xl'>
          Every recipe is free
        </h1>
        <p className='mb-10 text-lg text-text-muted'>
          One plan, {price} a month, adds the tools that take the recipes
          further. Cancel any time.
        </p>

        <section className='rounded-xl bg-surface p-6'>
          <p className='mb-6 text-text'>
            <span className='text-4xl font-bold'>{price}</span>
            <span className='text-text-muted'> / month</span>
          </p>
          <PlanFeatureList />
          <div className='mt-8'>
            <CallToAction myPlan={myPlan} price={price} />
          </div>
        </section>

        <p className='mt-6 text-sm text-text-muted'>
          Payments go through Stripe. Cancel or change your card from your
          account page, and the plan stays on until the end of the month you
          paid for.
        </p>
      </main>
    </LandingPageTemplate>
  )
}

export default PricingPage
