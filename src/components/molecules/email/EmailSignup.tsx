'use client'

import type { ReactElement } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { usePathname } from 'next/navigation'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

import type { EmailSignupData } from '@/validations'

import { useSubscribeToEmails } from '@/apiClients'
import { Button } from '@/components/atoms'
import { readTrafficSourceCookie, track } from '@/libs/analytics'
import { logger } from '@/libs/Logger'
import { Toast } from '@/libs/Toast'
import { emailSignupSchema } from '@/validations'

type EmailSignupProps = {
  heading: string
  blurb: string
  className?: string
}

// Honeypot: hidden from people, filled in by bots. Kept in the schema so the resolver passes
// it through instead of stripping it.
const formSchema = emailSignupSchema.extend({ website: z.string().optional() })

type EmailSignupFields = EmailSignupData & { website?: string }

// The email list form for recipe pages and the home page. Double opt-in: a sign-up gets a
// confirmation link, and nothing else arrives until it is followed.
export const EmailSignup = ({
  heading,
  blurb,
  className = '',
}: EmailSignupProps): ReactElement => {
  const id = useId()
  const pathname = usePathname()
  const [isSent, setIsSent] = useState(false)
  const [subscribe, { loading }] = useSubscribeToEmails()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailSignupFields>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async ({
    email,
    website,
  }: EmailSignupFields): Promise<void> => {
    const source = readTrafficSourceCookie()
    try {
      await subscribe({
        variables: {
          input: {
            email,
            website,
            path: pathname,
            source: source?.source,
            medium: source?.medium,
            campaign: source?.campaign,
          },
        },
      })
      track('email_subscribe', { path: pathname })
      setIsSent(true)
    } catch (error) {
      logger.error('Email sign-up failed', { error: String(error) })
      Toast.error('Could not sign you up. Please try again in a minute.')
    }
  }

  const emailId = `${id}-email`
  const errorId = `${id}-error`

  return (
    <section className={className} aria-labelledby={`${id}-heading`}>
      <div className='rounded-2xl bg-surface p-6 sm:p-8'>
        <h2 id={`${id}-heading`} className='text-xl font-bold text-text'>
          {heading}
        </h2>
        <p className='mt-1 text-text-muted'>{blurb}</p>

        {isSent ? (
          <p className='mt-4 font-medium text-text' role='status'>
            Check your inbox for a confirmation link. Nothing else arrives until
            you click it.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-start'
            noValidate
          >
            <div className='flex-1'>
              <label htmlFor={emailId} className='sr-only'>
                Email
              </label>
              <input
                {...register('email')}
                id={emailId}
                type='email'
                autoComplete='email'
                placeholder='your@email.com'
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? errorId : undefined}
                className={`w-full rounded border bg-background p-3 text-text placeholder-gray-400 focus:ring-2 focus:outline-none ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-gray-600 focus:border-primary focus:ring-primary/50'
                }`}
              />
              {errors.email && (
                <p id={errorId} className='mt-1 text-sm text-red-500'>
                  {errors.email.message}
                </p>
              )}
            </div>
            {/* Off-screen rather than display:none, which some bots skip */}
            <div aria-hidden='true' className='absolute left-[-9999px]'>
              <label htmlFor={`${id}-website`}>Website</label>
              <input
                {...register('website')}
                id={`${id}-website`}
                type='text'
                tabIndex={-1}
                autoComplete='off'
              />
            </div>
            <Button type='submit' disabled={loading} className='shrink-0'>
              {loading ? 'Signing up...' : 'Sign up'}
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
