'use client'

import type { ReactElement } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import type { ContactFormData } from '@/validations'

import { useSubmitContactForm } from '@/apiClients'
import { Button } from '@/components/atoms'
import { logger } from '@/libs/Logger'
import { Toast } from '@/libs/Toast'
import { contactFormSchema } from '@/validations'

type FieldName = keyof ContactFormData

type FieldProps = {
  name: FieldName
  label: string
  placeholder: string
  register: UseFormRegister<ContactFormData>
  error?: string
  type?: 'text' | 'email' | 'url'
  multiline?: boolean
}

const fieldStyles = (hasError: boolean): string =>
  `w-full rounded border bg-surface p-3 text-text placeholder-gray-400 focus:ring-2 focus:outline-none ${
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
      : 'border-gray-600 focus:border-blue-400 focus:ring-blue-400'
  }`

const Field = ({
  name,
  label,
  placeholder,
  register,
  error,
  type = 'text',
  multiline = false,
}: FieldProps): ReactElement => {
  const errorId = `${name}-error`
  const shared = {
    ...register(name),
    id: name,
    placeholder,
    'aria-invalid': !!error,
    'aria-describedby': error ? errorId : undefined,
  }

  return (
    <div>
      <label
        htmlFor={name}
        className='mb-2 block text-sm font-medium text-text-muted'
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          {...shared}
          rows={4}
          className={`resize-none ${fieldStyles(Boolean(error))}`}
        />
      ) : (
        <input {...shared} type={type} className={fieldStyles(Boolean(error))} />
      )}
      <div className='min-h-5'>
        {error && (
          <p id={errorId} className='mt-1 text-sm text-red-500'>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

// Asks visitors for a dish they want made over, plus optional context
export const ContactForm = (): ReactElement => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitContactForm] = useSubmitContactForm()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur',
  })

  const onSubmit = async ({
    recipeUrl,
    details,
    ...required
  }: ContactFormData): Promise<void> => {
    setIsSubmitting(true)

    try {
      const result = await submitContactForm({
        variables: {
          input: {
            ...required,
            recipeUrl: recipeUrl || null,
            details: details || null,
          },
        },
      })

      if (result.data?.submitContactForm) {
        Toast.success('Thanks! Your makeover idea is in.')
        reset()
      } else {
        Toast.error('Failed to send your idea. Please try again.')
      }
    } catch (error) {
      logger.error('Makeover idea form error', { error: String(error) })
      Toast.error(
        'Failed to send your idea. Please try again in a few minutes.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const onError = (formErrors: FieldErrors<ContactFormData>): void => {
    const messages = Object.values(formErrors)
      .map((err) => err?.message)
      .filter((msg): msg is string => Boolean(msg))
      .join(', ')
    Toast.error(`Please fix the following errors: ${messages}`)
  }

  return (
    <div className='mx-auto max-w-2xl px-4'>
      <h2 className='mb-2 text-center text-2xl font-bold text-text'>
        Have an idea for a macro makeover?
      </h2>
      <p className='mb-6 text-center text-text-muted'>
        Tell us the comfort food you miss most. We&apos;ll try to rebuild it
        with the flavor intact, less fat, and a lot more protein.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        className='space-y-3'
        noValidate
      >
        <div className='grid gap-x-6 md:grid-cols-2'>
          <Field
            name='name'
            label='Name'
            placeholder='Your name'
            register={register}
            error={errors.name?.message}
          />
          <Field
            name='email'
            label='Email'
            type='email'
            placeholder='your@email.com'
            register={register}
            error={errors.email?.message}
          />
        </div>

        <Field
          name='dish'
          label='What dish should we make over?'
          placeholder='Chicken parm, mac and cheese, your grandma’s lasagna...'
          register={register}
          error={errors.dish?.message}
        />

        <Field
          name='recipeUrl'
          label='Recipe link (optional)'
          type='url'
          placeholder='https://...'
          register={register}
          error={errors.recipeUrl?.message}
        />

        <Field
          name='details'
          label='Anything else? (optional)'
          placeholder='What you love about it, what has to stay, swaps you have tried...'
          register={register}
          error={errors.details?.message}
          multiline
        />

        <div className='text-center'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send my idea'}
          </Button>
        </div>
      </form>
    </div>
  )
}
