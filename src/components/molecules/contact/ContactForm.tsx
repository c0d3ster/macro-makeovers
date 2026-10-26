'use client'

import type { FieldErrors } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import type { ContactFormData } from '@/validations'

import { useSubmitContactForm } from '@/apiClients'
import { Button } from '@/components/atoms'
import { logger } from '@/libs/Logger'
import { Toast } from '@/libs/Toast'
import { contactFormSchema } from '@/validations'

// Contact form component for handling user submissions
export const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitContactForm] = useSubmitContactForm()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur', // Validate on blur for better UX
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)

    try {
      const result = await submitContactForm({
        variables: { input: data },
      })

      if (result.data?.submitContactForm) {
        Toast.success(
          "Message sent successfully! I'll get back to you within 24 hours."
        )
        reset()
      } else {
        Toast.error('Failed to send message. Please try again.')
      }
    } catch (error) {
      // Log detailed error information for debugging
      if (
        error &&
        typeof error === 'object' &&
        'graphQLErrors' in error &&
        Array.isArray(error.graphQLErrors) &&
        error.graphQLErrors.length > 0
      ) {
        const graphQLError = error.graphQLErrors[0]
        logger.error('Contact form error details', {
          originalError: graphQLError.extensions?.originalError,
          details: graphQLError.extensions?.details,
          code: graphQLError.extensions?.code,
          message: graphQLError.message,
        })
      } else {
        logger.error('Contact form error', { error })
      }

      // Show generic user-friendly message regardless of error type
      Toast.error(
        'Failed to send message. Please try again or contact support if the issue persists.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const onError = (errors: FieldErrors<ContactFormData>) => {
    const errorMessages = Object.values(errors)
      .map((err) => err?.message)
      .filter((msg): msg is string => Boolean(msg))
      .join(', ')
    Toast.error(`Please fix the following errors: ${errorMessages}`)
  }

  return (
    <div className='mx-auto max-w-2xl'>
      <h3 className='mb-6 text-center text-2xl font-bold text-text'>
        Contact Us
      </h3>

      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        className='space-y-3'
        noValidate
      >
        <div className='grid gap-6 md:grid-cols-2'>
          <div>
            <label
              htmlFor='name'
              className='mb-2 block text-sm font-medium text-text-muted'
            >
              Name
            </label>
            <input
              {...register('name')}
              id='name'
              type='text'
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={`w-full rounded border bg-surface p-3 text-text placeholder-gray-400 focus:ring-2 focus:outline-none ${
                errors.name
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                  : 'border-gray-600 focus:border-blue-400 focus:ring-blue-400'
              }`}
              placeholder='Your name'
            />
            <div className='min-h-5'>
              {errors.name && (
                <p id='name-error' className='mt-1 text-sm text-red-500'>
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>
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
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`w-full rounded border bg-surface p-3 text-text placeholder-gray-400 focus:ring-2 focus:outline-none ${
                errors.email
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                  : 'border-gray-600 focus:border-blue-400 focus:ring-blue-400'
              }`}
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
        </div>

        <div>
          <label
            htmlFor='subject'
            className='mb-2 block text-sm font-medium text-text-muted'
          >
            Subject
          </label>
          <input
            {...register('subject')}
            id='subject'
            type='text'
            aria-invalid={errors.subject ? 'true' : 'false'}
            aria-describedby={errors.subject ? 'subject-error' : undefined}
            className={`w-full rounded border bg-surface p-3 text-text placeholder-gray-400 focus:ring-2 focus:outline-none ${
              errors.subject
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                : 'border-gray-600 focus:border-blue-400 focus:ring-blue-400'
            }`}
            placeholder="What's this about?"
          />
          <div className='min-h-5'>
            {errors.subject && (
              <p id='subject-error' className='mt-1 text-sm text-red-500'>
                {errors.subject.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor='message'
            className='mb-2 block text-sm font-medium text-text-muted'
          >
            Message
          </label>
          <textarea
            {...register('message')}
            id='message'
            rows={4}
            aria-invalid={errors.message ? 'true' : 'false'}
            aria-describedby={errors.message ? 'message-error' : undefined}
            className={`w-full resize-none rounded border bg-surface p-3 text-text placeholder-gray-400 focus:ring-2 focus:outline-none ${
              errors.message
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                : 'border-gray-600 focus:border-blue-400 focus:ring-blue-400'
            }`}
            placeholder='Tell us about your project...'
          />
          <div className='min-h-5'>
            {errors.message && (
              <p id='message-error' className='mt-1 text-sm text-red-500'>
                {errors.message.message}
              </p>
            )}
          </div>
        </div>

        <div className='text-center'>
          <Button
            type='submit'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </form>
    </div>
  )
}
