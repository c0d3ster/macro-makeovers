'use client'

import type { ReactNode } from 'react'

import { frFR } from '@clerk/localizations'
import { ClerkProvider as BaseClerkProvider } from '@clerk/nextjs'
import { useMemo } from 'react'

type ClerkProviderProps = {
  children: ReactNode
  locale?: string
}

export const ClerkProvider = ({
  children,
  locale = 'en',
}: ClerkProviderProps) => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const localization = locale === 'fr' ? frFR : undefined

  const appearance = useMemo(
    () => ({
      baseTheme: undefined,
      cssLayerName: 'clerk', // Ensure Clerk is compatible with Tailwind CSS v4
      elements: {
        // Main container styling
        card: '!bg-surface !border !border-gray-600 !rounded-lg !shadow-lg',
        headerTitle: '!text-text !font-semibold !text-xl',
        headerSubtitle: '!text-text-muted !text-base',

        // Form elements - using !important to override Clerk defaults
        formButtonPrimary:
          '!rounded !border !font-medium !transition-all !duration-200 !border-blue-600 !bg-blue-600 !text-text hover:!bg-blue-700 !text-base !text-center',
        formFieldInput:
          '!bg-gray-700 !border !border-gray-600 !rounded !px-3 !py-2 !text-text focus:!outline-none focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-500/30 !transition-all !duration-200 !placeholder-gray-400',
        formFieldLabel: '!text-text-muted !font-medium !text-sm !mb-2',
        formFieldInputShowPasswordButton:
          '!text-text-muted hover:!text-text !transition-colors',

        // Social buttons
        socialButtonsBlockButton:
          '!rounded !border !font-medium !transition-all !duration-200 !border-gray-600 !bg-gray-700 !text-text hover:!bg-gray-600 !px-4 !py-2 !text-sm !text-center',
        socialButtonsBlockButtonText: '!font-medium',

        // Divider
        dividerLine: '!bg-gray-600',
        dividerText: '!text-text-muted !font-medium',

        // Footer
        footerActionText: '!text-text-muted',
        footerActionLink:
          '!text-blue-400 hover:!text-blue-300 !font-medium hover:!underline !transition-colors',

        // Identity preview
        identityPreviewText: '!text-text-muted',
        identityPreviewEditButton:
          '!text-blue-400 hover:!text-blue-300 !transition-colors',

        // Form resend button
        formResendCodeLink:
          '!text-blue-400 hover:!text-blue-300 !font-medium hover:!underline !transition-colors',

        // Alert styling
        alert:
          '!bg-gray-700 !border !border-gray-600 !text-text-muted !rounded !p-3',
        alertText: '!text-text-muted',

        // Modal styling
        modalBackdrop: '!bg-black/60 !backdrop-blur-sm',
        modalContent:
          '!bg-surface !border !border-gray-600 !rounded-lg !shadow-lg',

        // Form field wrapper
        formField: '!space-y-2',

        // Error messages
        formFieldErrorText: '!text-red-400 !text-sm',

        // Success messages
        formFieldSuccessText: '!text-green-400 !text-sm',

        // Additional input styling
        input:
          '!bg-gray-700 !border !border-gray-600 !rounded !px-3 !py-2 !text-text focus:!outline-none focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-500/30 !transition-all !duration-200',
      },
      variables: {
        colorPrimary: '#3b82f6', // blue-500
        colorText: '#ffffff', // white
        colorTextSecondary: '#d1d5db', // gray-300
        colorBackground: '#1f2937', // gray-800
        colorInputBackground: '#374151', // gray-700
        colorInputText: '#ffffff',
        borderRadius: '0.375rem', // rounded
        fontFamily: 'system-ui, sans-serif',
      },
    }),
    []
  )

  // Skip ClerkProvider when no publishable key is configured
  if (!publishableKey) {
    return <>{children}</>
  }

  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      localization={localization}
      appearance={appearance}
      signInUrl='/'
      signUpUrl='/'
      signInFallbackRedirectUrl='/profile'
      signUpFallbackRedirectUrl='/profile'
      afterSignOutUrl='/'
    >
      {children}
    </BaseClerkProvider>
  )
}
