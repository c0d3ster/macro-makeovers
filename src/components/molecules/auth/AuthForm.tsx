'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import type { AuthFormData } from '@/validations'

import { Button } from '@/components/atoms'
import { logger } from '@/libs/Logger'
import { createClient } from '@/libs/supabase/client'
import { Toast } from '@/libs/Toast'
import { getSafeRedirectPath } from '@/utils/Redirect'
import { authFormSchema } from '@/validations'

type AuthMode = 'sign-in' | 'sign-up'

type AuthFormProps = {
  next?: string
}

const inputStyles = (hasError: boolean): string =>
  `w-full rounded border bg-surface p-3 text-text placeholder-gray-400 focus:ring-2 focus:outline-none ${
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
      : 'border-gray-600 focus:border-blue-400 focus:ring-blue-400'
  }`

export const AuthForm = ({ next }: AuthFormProps) => {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirectPath = getSafeRedirectPath(next)
  const isSignUp = mode === 'sign-up'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authFormSchema),
    mode: 'onBlur',
  })

  const onSubmit = async ({ email, password }: AuthFormData): Promise<void> => {
    setIsSubmitting(true)
    const supabase = createClient()

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
          },
        })
        if (error) {
          Toast.error(error.message)
          return
        }
        // With email confirmation on, there is no session until the link is clicked
        if (!data.session) {
          Toast.success('Check your email to confirm your account.')
          return
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          Toast.error(error.message)
          return
        }
      }

      router.push(redirectPath)
      router.refresh()
    } catch (error) {
      logger.error('Auth form error', { error: String(error) })
      Toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const signInWithGoogle = async (): Promise<void> => {
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      },
    })
    // On success the browser navigates to Google, so only errors land here
    if (error) Toast.error(error.message)
  }

  return (
    <div className='mx-auto max-w-md'>
      <h1 className='mb-6 text-center text-2xl font-bold text-text'>
        {isSignUp ? 'Create your account' : 'Sign in'}
      </h1>

      <button
        type='button'
        onClick={signInWithGoogle}
        className='w-full rounded border border-gray-600 bg-surface px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-background'
      >
        Continue with Google
      </button>

      <div className='my-6 flex items-center gap-3'>
        <div className='h-px flex-1 bg-gray-600' />
        <span className='text-sm font-medium text-text-muted'>or</span>
        <div className='h-px flex-1 bg-gray-600' />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-3' noValidate>
        <div>
          <label
            htmlFor='email'
            className='mb-2 block text-sm font-medium text-text-muted'
          >
            Email
          </label>
          <input
            {...register('email')}
            id='email'
            type='email'
            autoComplete='email'
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={inputStyles(Boolean(errors.email))}
            placeholder='your@email.com'
          />
          <div className='min-h-5'>
            {errors.email && (
              <p id='email-error' className='mt-1 text-sm text-red-500'>
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor='password'
            className='mb-2 block text-sm font-medium text-text-muted'
          >
            Password
          </label>
          <input
            {...register('password')}
            id='password'
            type='password'
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={inputStyles(Boolean(errors.password))}
            placeholder='At least 8 characters'
          />
          <div className='min-h-5'>
            {errors.password && (
              <p id='password-error' className='mt-1 text-sm text-red-500'>
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <Button type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting ? 'Please wait...' : isSignUp ? 'Sign up' : 'Sign in'}
        </Button>
      </form>

      <p className='mt-6 text-center text-sm text-text-muted'>
        {isSignUp ? 'Already have an account?' : 'Need an account?'}{' '}
        <button
          type='button'
          onClick={() => setMode(isSignUp ? 'sign-in' : 'sign-up')}
          className='font-medium text-blue-400 hover:text-blue-300 hover:underline'
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </div>
  )
}
