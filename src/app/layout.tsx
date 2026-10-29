import type { Metadata } from 'next'

import { Env } from '@/libs/Env'
import { ProvidersWrapper } from '@/providers'
import '@/styles/global.css'

export const metadata: Metadata = {
  title: {
    default: Env.NEXT_PUBLIC_BRAND_NAME,
    template: `%s | ${Env.NEXT_PUBLIC_BRAND_NAME}`,
  },
  description: 'High-protein, lower-fat versions of foods people love.',
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
