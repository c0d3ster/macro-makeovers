import type { Metadata } from 'next'

import { UserButton } from '@clerk/nextjs'

import { Button } from '@/components/atoms'
import { CleanPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'

export const metadata: Metadata = {
  title: `Profile - ${Env.NEXT_PUBLIC_BRAND_NAME}`,
  description: 'User profile page',
}

export default function ProfilePage() {
  const header = <UserButton />

  const content = (
    <>
      {/* Content Cards */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Authentication Status Card */}
        <div className='rounded-lg bg-surface p-6'>
          <h2 className='mb-4 text-xl font-semibold text-text'>
            Authentication Status
          </h2>
          <div className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <div className='size-2 rounded-full bg-accent'></div>
              <span className='text-text-muted'>Signed in successfully</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='size-2 rounded-full bg-accent'></div>
              <span className='text-text-muted'>Protected route accessed</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='size-2 rounded-full bg-accent'></div>
              <span className='text-text-muted'>User session active</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className='rounded-lg bg-surface p-6'>
          <h2 className='mb-4 text-xl font-semibold text-text'>
            Quick Actions
          </h2>
          <div className='space-y-3'>
            <Button href='/' className='w-full text-center'>
              Return to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className='mt-8 rounded-lg bg-surface p-6'>
        <h2 className='mb-4 text-xl font-semibold text-text'>
          About This Demo
        </h2>
        <div className='space-y-2 text-text-muted'>
          <p>
            This page demonstrates successful authentication with Clerk. You can
            see:
          </p>
          <ul className='ml-4 list-disc space-y-1'>
            <li>Protected route access (this page requires authentication)</li>
            <li>User session management</li>
            <li>Sign out functionality via the UserButton</li>
            <li>Navigation between authenticated and public pages</li>
          </ul>
          <p className='mt-4'>
            Try signing out and accessing this page directly - you'll be
            redirected to the sign-in page.
          </p>
        </div>
      </div>
    </>
  )

  return (
    <CleanPageTemplate
      title={`Welcome to ${Env.NEXT_PUBLIC_BRAND_NAME}`}
      subtitle='You are successfully authenticated!'
      header={header}
    >
      {content}
    </CleanPageTemplate>
  )
}
