import type { Metadata } from 'next'

import { ProvidersWrapper } from '@/providers'
import '@/styles/global.css'

export const metadata: Metadata = {
  title: 'Next.js GraphQL Template',
  description: 'A modern full-stack template with Next.js, GraphQL, and TypeScript',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta name='theme-color' content='#111827' />
        <link rel='icon' href='/favicon.ico' />
      </head>
      <body>
        <ProvidersWrapper>{children}</ProvidersWrapper>
      </body>
    </html>
  )
}
