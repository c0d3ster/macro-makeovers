import type { Metadata } from 'next'

import Link from 'next/link' // @module:auth

import { ContactForm } from '@/components/molecules' // @module:email
import { LandingPageTemplate } from '@/components/templates'
import { Env } from '@/libs/Env'
import { getLogoUrl } from '@/utils/logo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `${Env.NEXT_PUBLIC_BRAND_NAME} - Modern Web Application`,
  description:
    'A modern web application built with Next.js, GraphQL, and TypeScript',
}

export default async function Index() {
  const logoUrl = await getLogoUrl()

  return (
    <LandingPageTemplate logoUrl={logoUrl}>
      {/* Main Content */}
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          {logoUrl && (
            <div className='mb-16 flex justify-center'>
              <img src={logoUrl} alt='Logo' className='h-32 w-auto' />
            </div>
          )}
          <h2 className='mb-4 text-4xl font-bold text-text'>
            Welcome to {Env.NEXT_PUBLIC_BRAND_NAME}
          </h2>
          <p className='mb-8 text-lg text-text-muted'>
            A modern web application template
            {' with authentication'} {/* @module:auth */}
          </p>

          {/* #region @module:auth */}
          {/* Auth Demo Section */}
          <div className='mb-8 rounded-lg bg-surface p-6'>
            <h3 className='mb-4 text-xl font-semibold text-text'>
              Authentication Demo
            </h3>
            <div className='space-y-2 text-text-muted'>
              <p>This template includes:</p>
              <ul className='ml-4 list-disc space-y-1 text-left'>
                <li>Public pages (this page)</li>
                <li>
                  Protected pages (try accessing{' '}
                  <Link
                    href='/profile'
                    className='text-primary transition-opacity hover:opacity-80'
                  >
                    /profile
                  </Link>{' '}
                  after signing in)
                </li>
                <li>Sign in/up modals</li>
                <li>User session management</li>
              </ul>
            </div>
          </div>
          {/* #endregion @module:auth */}
        </div>
      </div>

      {/* #region @module:email */}
      {/* Contact Form Section */}
      <div id='contact' className='bg-surface py-16'>
        <ContactForm />
      </div>
      {/* #endregion @module:email */}
    </LandingPageTemplate>
  )
}
